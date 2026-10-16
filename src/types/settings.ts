// src/types/settings.ts

export type {
  BusinessInfo,
  BusinessParameters
} from './domain'

export interface ServiceSchedule {
  start: string
  end: string
  times?: string[]
}

export interface RestaurantSchedules {
  desayuno: ServiceSchedule
  almuerzo: ServiceSchedule
  once: ServiceSchedule
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