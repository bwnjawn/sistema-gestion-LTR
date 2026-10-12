import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useReservationStore = defineStore('reservation', () => {
  // Estado original de proyecto completo.txt (para mantener compatibilidad total con todas las vistas)
  const currentStep = ref(1)
  const selectedService = ref<'cabana' | 'camping' | 'restaurant' | 'restaurante'>('cabana')
  const checkInDate = ref('')
  const checkOutDate = ref('')
  const guestsCount = ref(1)

  // Cabañas
  const selectedCabinId = ref('')

  // Camping (Mantiene propiedades originales de la plantilla)
  const campingType = ref<'diario' | 'pernoctar'>('pernoctar')
  const selectedCampingId = ref('')

  // Restaurante
  const restaurantTime = ref('')
  const selectedMealTypes = ref<string[]>([])
  const mealTimes = ref<Record<string, string>>({})
  const selectedMenus = ref<Record<string, any>>({})
  const selectedMeals = ref<any[]>([])

  // Cliente
  const clientName = ref('')
  const clientPhone = ref('+56 9 ')
  const comments = ref('')

  // Métodos originales requeridos por las vistas existentes
  function setService(service: 'cabana' | 'camping' | 'restaurant' | 'restaurante') {
    selectedService.value = service
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

  // HU-5.2: Preparar sugerencia de reserva cruzada conservando datos del cliente y fechas
  function prepareCrossServiceBooking(newService: 'cabana' | 'camping' | 'restaurant' | 'restaurante') {
    selectedService.value = newService
    currentStep.value = 1
    
    // Se limpian ÚNICAMENTE los ítems específicos del servicio anterior
    selectedCabinId.value = ''
    selectedCampingId.value = ''
    restaurantTime.value = ''
    selectedMealTypes.value = []
    mealTimes.value = {}
    selectedMenus.value = {}
    selectedMeals.value = []
    
    // MANTIENE INTACTOS: checkInDate, checkOutDate, guestsCount, clientName, clientPhone, comments
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
    comments.value = ''
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
    comments,
    setService,
    nextStep,
    prevStep,
    prepareCrossServiceBooking,
    resetStore
  }
})