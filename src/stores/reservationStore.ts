import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useReservationStore = defineStore('reservation', () => {
  const currentStep = ref(1)
  const selectedService = ref<'cabana' | 'camping' | 'restaurant'>('cabana')
  const checkInDate = ref('')
  const checkOutDate = ref('')
  const guestsCount = ref(1)

  // Cabaña
  const selectedCabinId = ref('')

  // Camping
  const campingType = ref<'diario' | 'pernoctar'>('diario')
  const selectedCampingId = ref('')

  // Restaurante
  const restaurantTime = ref('')
  const selectedMealTypes = ref<string[]>([])
  const mealTimes = ref<Record<string, string>>({})
  const selectedMenus = ref<Record<string, { count: number; sides: Record<string, number> }>>({})
  const selectedMeals = ref<any[]>([])

  // Datos Cliente & Comentarios
  const clientName = ref('')
  const clientPhone = ref('+56 9 ') // Pre-rellenado y editable
  const comments = ref('')

  function setService(service: 'cabana' | 'camping' | 'restaurant') {
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

  function resetStore() {
    currentStep.value = 1
    checkInDate.value = ''
    checkOutDate.value = ''
    guestsCount.value = 1
    selectedCabinId.value = ''
    restaurantTime.value = ''
    selectedMealTypes.value = []
    mealTimes.value = {}
    selectedMenus.value = {}
    selectedMeals.value = []
    campingType.value = 'diario'
    selectedCampingId.value = ''
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
    resetStore
  }
})