// src/stores/reservationStore.ts

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useRequestsStore } from './requestsStore'
import { useSettingsStore } from './settingsStore'
import { useCatalogStore } from './catalogStore'
import type { ServiceType, SelectedMealPayload } from '../types/domain'

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
  const clientName = ref<string>(initialDraft?.clientName ?? '')
  const clientPhone = ref<string>(initialDraft?.clientPhone ?? '+56 9 ')
  const clientEmail = ref<string>(initialDraft?.clientEmail ?? '')
  const comments = ref<string>(initialDraft?.comments ?? '')

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
        clientName: clientName.value,
        clientPhone: clientPhone.value,
        clientEmail: clientEmail.value,
        comments: comments.value
      })
    },
    { deep: true }
  )

  function setService(service: ServiceType | 'cabaña' | 'restaurant') {
    const normalized: ServiceType = service === 'restaurant' ? 'restaurante' : service === 'cabaña' ? 'cabana' : service
    selectedService.value = normalized
    currentStep.value = 1
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
    selectedCabinId.value = ''
    selectedCampingId.value = ''
    restaurantTime.value = ''
    selectedMealTypes.value = []
    mealTimes.value = {}
    selectedMenus.value = {}
    selectedMeals.value = []
  }

  function resetStore() {
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

    const code = `SOL-${Math.floor(100 + Math.random() * 900)}`
    let resourceName = ''
    let resourceId = ''
    let netTotal = 0

    if (selectedService.value === 'cabana') {
      const cabin = catalogStore.cabins.find(c => c.id === selectedCabinId.value)
      resourceName = cabin ? cabin.name : 'Cabaña'
      resourceId = selectedCabinId.value
      let nights = 1
      if (checkInDate.value && checkOutDate.value) {
        const diff = new Date(checkOutDate.value).getTime() - new Date(checkInDate.value).getTime()
        const days = Math.ceil(diff / (1000 * 3600 * 24))
        if (days > 0) nights = days
      }
      netTotal = (cabin?.pricePerNight || 65000) * nights
    } else if (selectedService.value === 'camping') {
      const site = catalogStore.campingSites.find(s => s.id === selectedCampingId.value)
      resourceName = site ? site.name : 'Camping'
      resourceId = selectedCampingId.value
      let nights = 1
      if (campingType.value === 'pernoctar' && checkInDate.value && checkOutDate.value) {
        const diff = new Date(checkOutDate.value).getTime() - new Date(checkInDate.value).getTime()
        const days = Math.ceil(diff / (1000 * 3600 * 24))
        if (days > 0) nights = days
      }
      netTotal = (site?.pricePerPerson || 10000) * guestsCount.value * nights
    } else {
      resourceName = 'Restaurante'
      netTotal = selectedMeals.value.reduce((acc, item) => acc + (item.price * item.quantity), 0)
    }

    const totalWithIva = Math.round(netTotal * (1 + (settingsStore.ivaPercentage || 19) / 100))
    const depositAmount = Math.round((totalWithIva * settingsStore.defaultDepositPercentage) / 100)

    await requestsStore.addRequest({
      requestCode: code,
      clientName: clientName.value || 'Cliente Web',
      clientPhone: clientPhone.value || '+56900000000',
      clientEmail: clientEmail.value || '',
      type: selectedService.value,
      resourceName,
      date: checkInDate.value || new Date().toISOString().split('T')[0],
      timeOrDuration: checkOutDate.value || '1 día',
      guestsCount: guestsCount.value,
      totalAmount: totalWithIva,
      depositAmount,
      details: {
        comments: comments.value,
        selectedMeals: selectedMeals.value,
        resourceId,
        startDate: checkInDate.value,
        endDate: checkOutDate.value,
        campingType: campingType.value,
        mealTimes: mealTimes.value,
        restaurantTime: restaurantTime.value
      }
    })

    // Limpia el borrador de sessionStorage una vez enviada la solicitud
    clearDraftFromSession()
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
    clientName,
    clientPhone,
    clientEmail,
    comments,
    setService,
    nextStep,
    prevStep,
    prepareCrossServiceBooking,
    resetStore,
    submitReservationRequest
  }
})