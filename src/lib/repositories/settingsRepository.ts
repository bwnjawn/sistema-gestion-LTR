 // src/lib/repositories/settingsRepository.ts

import type { BusinessInfo, BusinessParameters } from '../../types/domain'
import type { RestaurantSchedules, CampingSchedules, CabinSchedules } from '../../types/settings'
import { getStorageItem, setStorageItem } from '../persistence'

export interface SettingsRepository {
  getContactInfo(fallback: BusinessInfo): Promise<BusinessInfo>
  saveContactInfo(info: BusinessInfo): Promise<void>
  getParameters(fallback: BusinessParameters): Promise<BusinessParameters>
  saveParameters(params: BusinessParameters): Promise<void>
  getRestaurantSchedules(fallback: RestaurantSchedules): Promise<RestaurantSchedules>
  saveRestaurantSchedules(schedules: RestaurantSchedules): Promise<void>
  getCampingSchedules(fallback: CampingSchedules): Promise<CampingSchedules>
  saveCampingSchedules(schedules: CampingSchedules): Promise<void>
  getCabinSchedules(fallback: CabinSchedules): Promise<CabinSchedules>
  saveCabinSchedules(schedules: CabinSchedules): Promise<void>
}

export class LocalSettingsRepository implements SettingsRepository {
  async getContactInfo(fallback: BusinessInfo): Promise<BusinessInfo> {
    return getStorageItem('contact_info', fallback)
  }

  async saveContactInfo(info: BusinessInfo): Promise<void> {
    setStorageItem('contact_info', info)
  }

  async getParameters(fallback: BusinessParameters): Promise<BusinessParameters> {
    return getStorageItem('parameters', fallback)
  }

  async saveParameters(params: BusinessParameters): Promise<void> {
    setStorageItem('parameters', params)
  }

  async getRestaurantSchedules(fallback: RestaurantSchedules): Promise<RestaurantSchedules> {
    return getStorageItem('restaurant_schedules', fallback)
  }

  async saveRestaurantSchedules(schedules: RestaurantSchedules): Promise<void> {
    setStorageItem('restaurant_schedules', schedules)
  }

  async getCampingSchedules(fallback: CampingSchedules): Promise<CampingSchedules> {
    return getStorageItem('camping_schedules', fallback)
  }

  async saveCampingSchedules(schedules: CampingSchedules): Promise<void> {
    setStorageItem('camping_schedules', schedules)
  }

  async getCabinSchedules(fallback: CabinSchedules): Promise<CabinSchedules> {
    return getStorageItem('cabin_schedules', fallback)
  }

  async saveCabinSchedules(schedules: CabinSchedules): Promise<void> {
    setStorageItem('cabin_schedules', schedules)
  }
}

export const settingsRepository: SettingsRepository = new LocalSettingsRepository()