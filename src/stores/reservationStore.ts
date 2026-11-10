// src/stores/reservationStore.ts

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useRequestsStore } from './requestsStore'
import { useSettingsStore } from './settingsStore'
import { useCatalogStore } from './catalogStore'
import { todayISO } from '../lib/dates'
import { calculateBookingPrice, type PriceBreakdown } from '../services/pricing'
import type { ClientType, RequestSchedule, ServiceType, SelectedMealPayload } from '../types/domain'

export type { SelectedMealPayload }

const DRAFT_STORAGE_KEY = 'ltr_wizard_draft'

interface WizardDraftState {
  currentStep: number
  selectedService: ServiceType
  checkInDate: string
  checkOutDate: string
  guestsCount: number
  selectedCabinId: string
  campingType: 'diario' | 'pernoctar'
  selectedCampingId: string
  restaurantTime: string
  selectedMealTypes: string[]
  mealTimes: Record<string, string>
  selectedMenus: Record<string, any>
  selectedMeals: SelectedMealPayload[]
  clientType: ClientType
  clientName: string
  clientPhone: string
  clientEmail: string
  comments: string
}

function loadDraftFromSession(): WizardDraftState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveDraftToSession(data: WizardDraftState) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Ignorar errores de cuota de storage
  }
}

function clearDraftFromSession() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY)
  } catch {
    // Ignorar
  }
}

export const useReservationStore = defineStore('reservation', () => {
  const initialDraft = loadDraftFromSession()

  const currentStep = ref<number>(initialDraft?.currentStep ?? 1)
  const selectedService = ref<ServiceType>(initialDraft?.selectedService ?? 'cabana')
  const checkInDate = ref<string>(initialDraft?.checkInDate ?? '')
  const checkOutDate = ref<string>(initialDraft?.checkOutDate ?? '')
  const guestsCount = ref<number>(initialDraft?.guestsCount ?? 1)

  // Cabañas
  const selectedCabinId = ref<string>(initialDraft?.selectedCabinId ?? '')

  // Camping
  const campingType = ref<'diario' | 'pernoctar'>(initialDraft?.campingType ?? 'pernoctar')
  const selectedCampingId = ref<string>(initialDraft?.selectedCampingId ?? '')

  // Restaurante
  const restaurantTime = ref<string>(initialDraft?.restaurantTime ?? '')
  const selectedMealTypes = ref<string[]>(initialDraft?.selectedMealTypes ?? [])
  const mealTimes = ref<Record<string, string>>(initialDraft?.mealTimes ?? {})
  const selectedMenus = ref<Record<string, any>>(initialDraft?.selectedMenus ?? {})
  const selectedMeals = ref<SelectedMealPayload[]>(initialDraft?.selectedMeals ?? [])

  // Datos Cliente
  const clientType = ref<ClientType>(initialDraft?.clientType ?? 'Particular')
  const clientName = ref<string>(initialDraft?.clientName ?? '')
  const clientPhone = ref<string>(initialDraft?.clientPhone ?? '+56 9 ')
  const clientEmail = ref<string>(initialDraft?.clientEmail ?? '')
  const comments = ref<string>(initialDraft?.comments ?? '')

  // Se enciende al enviar la solicitud: el encabezado deja de ofrecer volver o salir
  const solicitudEnviada = ref(false)

  /** El cliente ya eligió o escribió algo que se perdería al salir. */
  const tieneBorrador = computed(() =>
    Boolean(
      checkInDate.value ||
      selectedCabinId.value ||
      selectedCampingId.value ||
      selectedMealTypes.value.length ||
      selectedMeals.value.length ||
      clientName.value.trim()
    )
  )

  // Guardar automáticamente en sessionStorage ante cualquier cambio
  watch(
    [
      currentStep,
      selectedService,
      checkInDate,
      checkOutDate,
      guestsCount,
      selectedCabinId,
      campingType,
      selectedCampingId,
      restaurantTime,
      selectedMealTypes,
      mealTimes,
      selectedMenus,
      selectedMeals,
      clientType,
      clientName,
      clientPhone,
      clientEmail,
      comments
    ],
    () => {
      saveDraftToSession({
        currentStep: currentStep.value,
        selectedService: selectedService.value,
        checkInDate: checkInDate.value,
        checkOutDate: checkOutDate.value,
        guestsCount: guestsCount.value,
        selectedCabinId: selectedCabinId.value,
        campingType: campingType.value,
        selectedCampingId: selectedCampingId.value,
        restaurantTime: restaurantTime.value,
        selectedMealTypes: selectedMealTypes.value,
        mealTimes: mealTimes.value,
        selectedMenus: selectedMenus.value,
        selectedMeals: selectedMeals.value,
        clientType: clientType.value,
        clientName: clientName.value,
        clientPhone: clientPhone.value,
        clientEmail: clientEmail.value,
        comments: comments.value
      })
    },
    { deep: true }
  )

  // Horario de ingreso y salida vigente (cabaña y camping). El restaurante usa mealTimes.
  const scheduleSnapshot = computed<RequestSchedule | undefined>(() => {
    const settingsStore = useSettingsStore()
    if (selectedService.value === 'cabana') {
      const { checkIn, checkOut } = settingsStore.cabinSchedules
      return { checkIn, checkOut }
    }
    if (selectedService.value === 'camping') {
      const { checkIn, checkOut } = settingsStore.campingSchedules[campingType.value]
      return { checkIn, checkOut }
    }
    return undefined
  })

  // Precio del borrador. Es la única fuente: lo que ve el cliente en el paso 4
  // es exactamente lo que se guarda al enviar la solicitud.
  const priceBreakdown = computed<PriceBreakdown | null>(() => {
    const settingsStore = useSettingsStore()
    const catalogStore = useCatalogStore()
    return calculateBookingPrice({
      service: selectedService.value,
      cabin: catalogStore.cabins.find(c => c.id === selectedCabinId.value),
      campingSite: catalogStore.campingSites.find(s => s.id === selectedCampingId.value),
      checkInDate: checkInDate.value,
      checkOutDate: checkOutDate.value,
      guestsCount: guestsCount.value,
      campingType: campingType.value,
      meals: selectedMeals.value,
      depositPercentage: settingsStore.defaultDepositPercentage,
      ivaPercentage: settingsStore.ivaPercentage
    })
  })

  function setService(service: ServiceType | 'cabaña' | 'restaurant') {
    const normalized: ServiceType = service === 'restaurant' ? 'restaurante' : service === 'cabaña' ? 'cabana' : service
    selectedService.value = normalized
    currentStep.value = 1
    solicitudEnviada.value = false
  }

  function nextStep() {
    currentStep.value++
  }

  function prevStep() {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }

  function prepareCrossServiceBooking(newService: ServiceType | 'cabaña' | 'restaurant') {
    const normalized: ServiceType = newService === 'restaurant' ? 'restaurante' : newService === 'cabaña' ? 'cabana' : newService
    selectedService.value = normalized
    currentStep.value = 1
    solicitudEnviada.value = false
    selectedCabinId.value = ''
    selectedCampingId.value = ''
    restaurantTime.value = ''
    selectedMealTypes.value = []
    mealTimes.value = {}
    selectedMenus.value = {}
    selectedMeals.value = []
  }

  function resetStore() {
    solicitudEnviada.value = false
    currentStep.value = 1
    selectedService.value = 'cabana'
    checkInDate.value = ''
    checkOutDate.value = ''
    guestsCount.value = 1
    selectedCabinId.value = ''
    campingType.value = 'pernoctar'
    selectedCampingId.value = ''
    restaurantTime.value = ''
    selectedMealTypes.value = []
    mealTimes.value = {}
    selectedMenus.value = {}
    selectedMeals.value = []
    clientType.value = 'Particular'
    clientName.value = ''
    clientPhone.value = '+56 9 '
    clientEmail.value = ''
    comments.value = ''
    clearDraftFromSession()
  }

  // Envío a la Persistencia de Administración (requestsStore)
  async function submitReservationRequest(): Promise<string> {
    const requestsStore = useRequestsStore()
    const settingsStore = useSettingsStore()
    const catalogStore = useCatalogStore()

    const price = priceBreakdown.value
    if (!price) {
      throw new Error('No se pudo calcular el precio: falta seleccionar la cabaña o el espacio de camping.')
    }

    const code = `SOL-${Math.floor(100 + Math.random() * 900)}`
    let resourceName = 'Restaurante'
    let resourceId = ''

    if (selectedService.value === 'cabana') {
      resourceName = catalogStore.cabins.find(c => c.id === selectedCabinId.value)?.name ?? 'Cabaña'
      resourceId = selectedCabinId.value
    } else if (selectedService.value === 'camping') {
      resourceName = catalogStore.campingSites.find(s => s.id === selectedCampingId.value)?.name ?? 'Camping'
      resourceId = selectedCampingId.value
    }

    await requestsStore.addRequest({
      requestCode: code,
      clientName: clientName.value || 'Cliente Web',
      clientPhone: clientPhone.value || '+56900000000',
      clientEmail: clientEmail.value || '',
      type: selectedService.value,
      resourceName,
      date: checkInDate.value || todayISO(),
      timeOrDuration: checkOutDate.value || '1 día',
      guestsCount: guestsCount.value,
      totalAmount: price.totalWithIva,
      depositRequired: price.depositAmount,
      payments: [],
      details: {
        comments: comments.value,
        selectedMeals: selectedMeals.value,
        resourceId,
        startDate: checkInDate.value,
        endDate: checkOutDate.value,
        campingType: campingType.value,
        selectedMealTypes: selectedMealTypes.value,
        mealTimes: mealTimes.value,
        restaurantTime: restaurantTime.value,
        clientType: selectedService.value === 'restaurante' ? clientType.value : undefined,
        schedule: scheduleSnapshot.value,
        pricing: {
          subtotal: price.subtotal,
          ivaAmount: price.ivaAmount,
          ivaPercentage: settingsStore.ivaPercentage,
          depositPercentage: settingsStore.defaultDepositPercentage,
          nights: price.nights
        }
      }
    })

    // Limpia el borrador de sessionStorage una vez enviada la solicitud
    clearDraftFromSession()
    solicitudEnviada.value = true
    return code
  }

  return {
    currentStep,
    selectedService,
    checkInDate,
    checkOutDate,
    guestsCount,
    selectedCabinId,
    campingType,
    selectedCampingId,
    restaurantTime,
    selectedMealTypes,
    mealTimes,
    selectedMenus,
    selectedMeals,
    clientType,
    clientName,
    clientPhone,
    clientEmail,
    comments,
    solicitudEnviada,
    tieneBorrador,
    setService,
    nextStep,
    prevStep,
    priceBreakdown,
    prepareCrossServiceBooking,
    resetStore,
    submitReservationRequest
  }
})