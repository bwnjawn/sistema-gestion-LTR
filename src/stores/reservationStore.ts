import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRequestsStore } from './requestsStore'
import { useSettingsStore } from './settingsStore'
import { useCatalogStore } from './catalogStore'

export interface SelectedMealPayload {
 id: string
 name: string
 price: number
 quantity: number
 sideSelection?: string
}

export const useReservationStore = defineStore('reservation', () => {
 const currentStep = ref(1)
 const selectedService = ref<'cabana' | 'camping' | 'restaurant' | 'restaurante'>('cabana')
 const checkInDate = ref('')
 const checkOutDate = ref('')
 const guestsCount = ref(1)

 // Cabañas
 const selectedCabinId = ref('')

 // Camping
 const campingType = ref<'diario' | 'pernoctar'>('pernoctar')
 const selectedCampingId = ref('')

 // Restaurante
 const restaurantTime = ref('')
 const selectedMealTypes = ref<string[]>([])
 const mealTimes = ref<Record<string, string>>({})
 const selectedMenus = ref<Record<string, any>>({})
 const selectedMeals = ref<SelectedMealPayload[]>([])

 // Datos Cliente
 const clientName = ref('')
 const clientPhone = ref('+56 9 ')
 const clientEmail = ref('')
 const comments = ref('')

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

 function prepareCrossServiceBooking(newService: 'cabana' | 'camping' | 'restaurant' | 'restaurante') {
   selectedService.value = newService
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
 }

 // Envío a la Persistencia de Administración (requestsStore)
 function submitReservationRequest(): string {
   const requestsStore = useRequestsStore()
   const settingsStore = useSettingsStore()
   const catalogStore = useCatalogStore()

   const code = `SOL-${Math.floor(100 + Math.random() * 900)}`
   let resourceName = ''
   let netTotal = 0

   if (selectedService.value === 'cabana') {
     const cabin = catalogStore.cabins.find(c => c.id === selectedCabinId.value)
     resourceName = cabin ? cabin.name : 'Cabaña'
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

   const totalWithIva = Math.round(netTotal * 1.19)
   const depositAmount = Math.round((totalWithIva * settingsStore.defaultDepositPercentage) / 100)

   requestsStore.addRequest({
     requestCode: code,
     clientName: clientName.value || 'Cliente Web',
     clientPhone: clientPhone.value || '+56900000000',
     clientEmail: clientEmail.value || '',
     type: selectedService.value === 'restaurant' ? 'restaurante' : (selectedService.value as any),
     resourceName,
     date: checkInDate.value || new Date().toISOString().split('T')[0],
     timeOrDuration: checkOutDate.value || '1 día',
     guestsCount: guestsCount.value,
     totalAmount: totalWithIva,
     depositAmount,
     details: {
       comments: comments.value,
       selectedMeals: selectedMeals.value
     }
   })

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