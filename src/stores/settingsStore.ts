// src/stores/settingsStore.ts

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { BusinessInfo } from '../types/domain'
import type { RestaurantSchedules, CampingSchedules, CabinSchedules } from '../types/settings'
import { settingsRepository } from '../lib/repositories/settingsRepository'
import { getStorageItem, setStorageItem } from '../lib/persistence'

export interface CapacityRules {
  maxRestaurantGroupsPerSlot: number
  maxCampingPeopleCapacity: number
  marginPercentage: number
}

export interface BusinessParametersExtended {
  defaultDepositPercentage: number
  ivaPercentage: number
  marginPercentage: number
  currentDate: string
  isConnected: boolean
  capacityRules: CapacityRules
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
  iframeMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d73.4167!3d41.1500!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDA5JzAwLjAiUyA3M8KwMjUnMDAuMCJX!5e0!3m2!1ses!2scl!4v1600000000000'
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

const DEFAULT_PARAMS: BusinessParametersExtended = {
  defaultDepositPercentage: 30,
  ivaPercentage: 19,
  marginPercentage: 10,
  currentDate: '',
  isConnected: true,
  capacityRules: {
    maxRestaurantGroupsPerSlot: 8,
    maxCampingPeopleCapacity: 150,
    marginPercentage: 10
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const contactInfo = ref<BusinessInfo>(getStorageItem('contact_info', DEFAULT_CONTACT))
  const restaurantSchedules = ref<RestaurantSchedules>(getStorageItem('restaurant_schedules', DEFAULT_RESTAURANT_SCHEDULES))
  const campingSchedules = ref<CampingSchedules>(getStorageItem('camping_schedules', DEFAULT_CAMPING_SCHEDULES))
  const cabinSchedules = ref<CabinSchedules>(getStorageItem('cabin_schedules', DEFAULT_CABIN_SCHEDULES))
  const parameters = ref<BusinessParametersExtended>(getStorageItem('parameters', DEFAULT_PARAMS))

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const isOnline = ref(typeof navigator !== 'undefined' ? navigator.onLine : true)

  function updateOnlineStatus() {
    isOnline.value = typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  }

  const currentDateDynamic = computed(() => {
    const now = new Date()
    const str = now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
    return str.charAt(0).toUpperCase() + str.slice(1)
  })

  watch(contactInfo, async (val) => {
    setStorageItem('contact_info', val)
    await settingsRepository.saveContactInfo(val)
  }, { deep: true })

  watch(restaurantSchedules, async (val) => {
    setStorageItem('restaurant_schedules', val)
    await settingsRepository.saveRestaurantSchedules(val)
  }, { deep: true })

  watch(campingSchedules, async (val) => {
    setStorageItem('camping_schedules', val)
    await settingsRepository.saveCampingSchedules(val)
  }, { deep: true })

  watch(cabinSchedules, async (val) => {
    setStorageItem('cabin_schedules', val)
    await settingsRepository.saveCabinSchedules(val)
  }, { deep: true })

  watch(parameters, async (val) => {
    setStorageItem('parameters', val)
    await settingsRepository.saveParameters(val)
  }, { deep: true })

  const phone1Clean = computed(() => contactInfo.value.phone1.replace(/\s+/g, ''))
  const phone2Clean = computed(() => contactInfo.value.phone2.replace(/\s+/g, ''))

  async function updateContactInfo(info: Partial<BusinessInfo>): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      contactInfo.value = { ...contactInfo.value, ...info }
    } catch (e: any) {
      error.value = 'Error al actualizar la información de contacto.'
    } finally {
      isLoading.value = false
    }
  }

  async function updateParameters(params: Partial<BusinessParametersExtended>): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      parameters.value = { ...parameters.value, ...params }
    } catch (e: any) {
      error.value = 'Error al actualizar los parámetros del negocio.'
    } finally {
      isLoading.value = false
    }
  }

  async function updateCapacityRules(rules: Partial<CapacityRules>): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      parameters.value.capacityRules = {
        ...parameters.value.capacityRules,
        ...rules
      }
    } catch (e: any) {
      error.value = 'Error al actualizar las reglas de aforo.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    contactInfo,
    restaurantSchedules,
    campingSchedules,
    cabinSchedules,
    parameters,
    isLoading,
    error,
    defaultDepositPercentage: computed(() => parameters.value.defaultDepositPercentage ?? 30),
    ivaPercentage: computed(() => parameters.value.ivaPercentage ?? 19),
    marginPercentage: computed(() => parameters.value.marginPercentage ?? 10),
    capacityRules: computed(() => parameters.value.capacityRules ?? DEFAULT_PARAMS.capacityRules),
    currentDate: currentDateDynamic,
    isConnected: isOnline,
    phone1Clean,
    phone2Clean,
    updateContactInfo,
    updateParameters,
    updateCapacityRules
  }
})