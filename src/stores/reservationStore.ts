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

  // Restaurante (Inicia en blanco para exigir selección explícita)
  const restaurantTime = ref('')
  const selectedMealTypes = ref<string[]>([])
  const mealTimes = ref<Record<string, string>>({})
  const selectedMenus = ref<Record<string, { count: number; sides: Record<string, number> }>>({})
  const selectedMeals = ref<any[]>([])

  // Camping
  const campingType = ref<'diario' | 'pernoctar'>('diario')

  // Datos Cliente
  const clientName = ref('')
  const clientPhone = ref('+56 9 ')
  const eventReason = ref('Particular')

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
    clientName.value = ''
    clientPhone.value = '+56 9 '
    eventReason.value = 'Particular'
  }

  return {
    currentStep,
    selectedService,
    checkInDate,
    checkOutDate,
    guestsCount,
    selectedCabinId,
    restaurantTime,
    selectedMealTypes,
    mealTimes,
    selectedMenus,
    selectedMeals,
    campingType,
    clientName,
    clientPhone,
    eventReason,
    setService,
    nextStep,
    prevStep,
    resetStore
  }
})