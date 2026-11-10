// src/types/settings.ts

export type {
  BusinessInfo,
  BusinessParameters
} from './domain'

/** Espacio del restaurante con su capacidad en personas (ej. comedor principal, carpa). */
export interface EspacioRestaurante {
  id: string
  nombre: string
  capacidad: number
}

/** Topes de personas que usa el calendario para marcar "sobrecupo". */
export interface LimitesAforo {
  /** Personas que caben a la vez en el restaurante (suma de sus espacios). */
  restaurantePersonas: number
  /** Personas que admite el camping en un mismo día. */
  campingPersonas: number
}

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

/** Límite de variedades de menú para grupos grandes (cocina). */
export interface LimiteVariedades {
  /** La regla se aplica cuando el grupo supera esta cantidad de personas. */
  umbralPersonas: number
  /** Máximo de platos distintos por comida cuando se aplica la regla. */
  maxVariedades: number
}
