// src/stores/settingsStore.ts
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export interface BusinessInfo {
 phone1: string
 phone2: string
 email: string
 websiteDisplay: string
 websiteUrl: string
 instagramUser: string
 instagramUrl: string
 address: string
 mapsUrl: string
 iframeMapUrl: string
}

export interface RestaurantScheduleItem {
 start: string
 end: string
 times: string[]
}

export interface RestaurantSchedules {
 desayuno: RestaurantScheduleItem
 almuerzo: RestaurantScheduleItem
 once: RestaurantScheduleItem
}

export interface CampingScheduleItem {
 checkIn: string
 checkOut: string
 display: string
}

export interface CampingSchedules {
 diario: CampingScheduleItem
 pernoctar: CampingScheduleItem
}

export interface CabinSchedules {
 checkIn: string
 checkOut: string
 display: string
}

export interface BusinessParameters {
 defaultDepositPercentage: number
 marginPercentage: number
 currentDate: string
 isConnected: boolean
}

const DEFAULT_CONTACT: BusinessInfo = {
 phone1: '+56 9 8502 5056',
 phone2: '+56 9 9588 3385',
 email: 'lostroncosderepil@gmail.com',
 websiteDisplay: 'www.lostroncosderepil.cl',
 websiteUrl: 'https://www.lostroncosderepil.cl',
 instagramUser: '@lostroncosderepil',
 instagramUrl: 'https://instagram.com/lostroncosderepil',
 address: 'Sector Repil s/n, Comuna de Fresia, Región de Los Lagos, Chile',
 mapsUrl: 'https://maps.google.com/?q=-41.1500,-73.4167',
 iframeMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d-73.4167!3d41.1500!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDA5JzAwLjAiUyA3M8KwMjUnMDAuMCJX!5e0!3m2!1ses!2scl!4v162000000000'
}

const DEFAULT_RESTAURANT_SCHEDULES: RestaurantSchedules = {
 desayuno: { start: '08:30', end: '11:00', times: ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00'] },
 almuerzo: { start: '12:30', end: '14:00', times: ['12:30', '13:00', '13:30', '14:00'] },
 once: { start: '17:00', end: '19:30', times: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'] }
}

const DEFAULT_CAMPING_SCHEDULES: CampingSchedules = {
 diario: { checkIn: '09:00', checkOut: '19:30', display: 'Día de ingreso (09:00 hrs) - Día de ingreso (19:30 hrs)' },
 pernoctar: { checkIn: '12:00', checkOut: '11:00', display: 'Día de ingreso (12:00 hrs) - Día de salida (11:00 hrs)' }
}

const DEFAULT_CABIN_SCHEDULES: CabinSchedules = {
 checkIn: '15:00',
 checkOut: '11:00',
 display: 'Día de ingreso (15:00 hrs) - Día de salida (11:00 hrs)'
}

const DEFAULT_PARAMS: BusinessParameters = {
 defaultDepositPercentage: 30,
 marginPercentage: 10,
 currentDate: 'Miércoles 21 de Octubre',
 isConnected: true
}

export const useSettingsStore = defineStore('settings', () => {
 const getStorageItem = <T>(key: string, fallback: T): T => {
   const raw = localStorage.getItem(`ltr_${key}`)
   if (raw) {
     try {
       return JSON.parse(raw)
     } catch (e) {
       console.error(`Error al analizar ${key} de localStorage`, e)
     }
   }
   return fallback
 }

 const setStorageItem = <T>(key: string, val: T): void => {
   localStorage.setItem(`ltr_${key}`, JSON.stringify(val))
 }

 const contactInfo = ref(getStorageItem<BusinessInfo>('contact_info', DEFAULT_CONTACT))
 const restaurantSchedules = ref(getStorageItem<RestaurantSchedules>('restaurant_schedules', DEFAULT_RESTAURANT_SCHEDULES))
 const campingSchedules = ref(getStorageItem<CampingSchedules>('camping_schedules', DEFAULT_CAMPING_SCHEDULES))
 const cabinSchedules = ref(getStorageItem<CabinSchedules>('cabin_schedules', DEFAULT_CABIN_SCHEDULES))
 const parameters = ref(getStorageItem<BusinessParameters>('parameters', DEFAULT_PARAMS))

 watch(contactInfo, (val) => setStorageItem('contact_info', val), { deep: true })
 watch(restaurantSchedules, (val) => setStorageItem('restaurant_schedules', val), { deep: true })
 watch(campingSchedules, (val) => setStorageItem('camping_schedules', val), { deep: true })
 watch(cabinSchedules, (val) => setStorageItem('cabin_schedules', val), { deep: true })
 watch(parameters, (val) => setStorageItem('parameters', val), { deep: true })

 const phone1Clean = computed(() => contactInfo.value.phone1.replace(/\s+/g, ''))
 const phone2Clean = computed(() => contactInfo.value.phone2.replace(/\s+/g, ''))

 function updateContactInfo(info: Partial<BusinessInfo>) {
   contactInfo.value = { ...contactInfo.value, ...info }
 }

 function updateParameters(params: Partial<BusinessParameters>) {
   parameters.value = { ...parameters.value, ...params }
 }

 return {
   contactInfo,
   restaurantSchedules,
   campingSchedules,
   cabinSchedules,
   parameters,
   defaultDepositPercentage: computed(() => parameters.value.defaultDepositPercentage),
   marginPercentage: computed(() => parameters.value.marginPercentage),
   currentDate: computed(() => parameters.value.currentDate),
   isConnected: computed(() => parameters.value.isConnected),
   phone1Clean,
   phone2Clean,
   updateContactInfo,
   updateParameters
 }
})