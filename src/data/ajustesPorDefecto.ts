// src/data/ajustesPorDefecto.ts
// Valores de fábrica de los ajustes del negocio. Son el estado inicial del `settingsStore` y lo que el
// repositorio local entrega mientras el administrador no haya guardado nada. Con Supabase (SCRUM-248) viven en la base.

import type { BusinessInfo, TransferInfo } from '../types/domain'
import type {
  BusinessParametersExtended,
  CabinSchedules,
  CampingSchedules,
  RestaurantSchedules
} from '../types/settings'
import { DEFAULT_DEPOSIT_DEADLINE_HOURS } from '../services/payments'

/** Valor de ejemplo de la entrada a la piscina (CLP por persona): el real está por confirmar con el cliente. */
export const PRECIO_PISCINA_POR_DEFECTO = 3000

export const DEFAULT_CONTACT: BusinessInfo = {
  phone1: '+56 9 8502 5056',
  phone2: '+56 9 5883 3853',
  email: 'lostroncosderepil@gmail.com',
  websiteDisplay: 'fresianatural.cl',
  websiteUrl: 'https://www.fresianatural.cl/troncos-de-repil-fresia-natural.html',
  instagramUser: '@lostroncosderepil',
  instagramUrl: 'https://instagram.com/lostroncosderepil',
  address: 'Sector Repil s/n, Comuna de Fresia, Región de Los Lagos, Chile',
  // Ubicación real de "Turismo Los Troncos de Repil" (-41.0616375, -73.647016)
  mapsUrl: 'https://www.google.com/maps/place/Turismo+Los+Troncos+de+Repil/@-41.0616375,-73.647016,17z',
  iframeMapUrl: 'https://maps.google.com/maps?q=-41.0616375,-73.647016&z=17&output=embed'
}

// Datos de ejemplo hasta que el cliente entregue los reales (D3); el admin los edita en Ajustes.
export const DEFAULT_TRANSFER: TransferInfo = {
  bank: 'Banco Estado',
  accountType: 'Cuenta Vista / Cuenta RUT',
  accountNumber: '12345678',
  holderName: 'Los Troncos de Repil',
  holderRut: '12.345.678-9',
  email: 'lostroncosderepil@gmail.com'
}

export const DEFAULT_RESTAURANT_SCHEDULES: RestaurantSchedules = {
  desayuno: { start: '08:30', end: '11:00', times: ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00'] },
  almuerzo: { start: '12:30', end: '14:00', times: ['12:30', '13:00', '13:30', '14:00'] },
  once: { start: '17:00', end: '19:30', times: ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30'] }
}

export const DEFAULT_CAMPING_SCHEDULES: CampingSchedules = {
  diario: { checkIn: '09:00', checkOut: '19:30', display: 'Día de ingreso (09:00 hrs) - Día de ingreso (19:30 hrs)' },
  pernoctar: { checkIn: '12:00', checkOut: '11:00', display: 'Día de ingreso (12:00 hrs) - Día de salida (11:00 hrs)' }
}

export const DEFAULT_CABIN_SCHEDULES: CabinSchedules = {
  checkIn: '15:00',
  checkOut: '11:00',
  display: 'Día de ingreso (15:00 hrs) - Día de salida (11:00 hrs)'
}

export const DEFAULT_PARAMS: BusinessParametersExtended = {
  defaultDepositPercentage: 30,
  depositDeadlineHours: DEFAULT_DEPOSIT_DEADLINE_HOURS,
  ivaPercentage: 19,
  poolEntryPrice: PRECIO_PISCINA_POR_DEFECTO,
  marginPercentage: 10,
  currentDate: '',
  isConnected: true,
  capacityRules: {
    maxRestaurantGroupsPerSlot: 8,
    restaurantSpaces: [
      { id: 'comedor-principal', nombre: 'Comedor principal', capacidad: 120 },
      { id: 'carpa', nombre: 'Carpa', capacidad: 50 },
      { id: 'comedor-secundario', nombre: 'Comedor secundario', capacidad: 30 }
    ],
    menuLargeGroupThreshold: 30,
    maxMenuVarietiesLargeGroup: 3,
    maxCampingPeopleCapacity: 150,
    marginPercentage: 10
  }
}
