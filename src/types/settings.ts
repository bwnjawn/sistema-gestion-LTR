// src/types/settings.ts

import type { BusinessInfo, TransferInfo } from './domain'

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

export interface CapacityRules {
  /** Sin uso desde SCRUM-244: el aforo del restaurante ahora sale de `restaurantSpaces`. */
  maxRestaurantGroupsPerSlot: number
  /** Espacios del restaurante y su capacidad; la suma es el aforo total. */
  restaurantSpaces: EspacioRestaurante[]
  /** Grupos de más de estas personas tienen un máximo de platos distintos por comida (SCRUM-36). */
  menuLargeGroupThreshold: number
  /** Máximo de platos distintos por comida para grupos grandes. */
  maxMenuVarietiesLargeGroup: number
  maxCampingPeopleCapacity: number
  marginPercentage: number
}

export interface BusinessParametersExtended {
  defaultDepositPercentage: number
  /** Horas para abonar desde que el cliente envía la solicitud (SCRUM-264). */
  depositDeadlineHours?: number
  ivaPercentage: number
  /** Precio de la entrada a la piscina por persona (SCRUM-44). Valor de ejemplo hasta tener el real (SCRUM-270). */
  poolEntryPrice?: number
  marginPercentage: number
  currentDate: string
  isConnected: boolean
  capacityRules: CapacityRules
}

/** Los ajustes que se guardan, por clave. Es lo que lee y escribe `SettingsRepository`. */
export interface AjustesGuardados {
  contact_info: BusinessInfo
  transfer_info: TransferInfo
  parameters: BusinessParametersExtended
  restaurant_schedules: RestaurantSchedules
  camping_schedules: CampingSchedules
  cabin_schedules: CabinSchedules
}

export type ClaveAjuste = keyof AjustesGuardados
