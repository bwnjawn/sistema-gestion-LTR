// src/lib/repositories/index.ts
// Punto único donde los stores obtienen sus repositorios. Hoy son los locales (`localStorage`); con Supabase
// (SCRUM-248) se cambia aquí por los de Supabase y nada más. Las pruebas los reemplazan con `usarRepositorios`.

import { almacenamientoLocal, type Almacenamiento } from '../persistence'
import type { AuthRepository } from './authRepository'
import type { AvailabilityRepository } from './availabilityRepository'
import { LocalAvailabilityRepository } from './availabilityRepository'
import { LocalAuthRepository } from './authRepository'
import type { CabinRepository, CampingSiteRepository, DishRepository, GlobalSideRepository } from './catalogRepository'
import { crearRepositoriosCatalogoLocales } from './catalogRepository'
import type { PaymentRepository } from './paymentsRepository'
import { LocalPaymentRepository } from './paymentsRepository'
import type { RequestRepository } from './requestsRepository'
import { LocalRequestRepository } from './requestsRepository'
import type { SettingsRepository } from './settingsRepository'
import { LocalSettingsRepository } from './settingsRepository'

export interface Repositorios {
  cabins: CabinRepository
  campingSites: CampingSiteRepository
  dishes: DishRepository
  globalSides: GlobalSideRepository
  requests: RequestRepository
  payments: PaymentRepository
  availability: AvailabilityRepository
  settings: SettingsRepository
  auth: AuthRepository
}

/** Todos los repositorios sobre un almacenamiento local (el real o uno en memoria para pruebas). */
export function crearRepositoriosLocales(almacenamiento: Almacenamiento = almacenamientoLocal): Repositorios {
  const requests = new LocalRequestRepository(almacenamiento)
  return {
    ...crearRepositoriosCatalogoLocales(almacenamiento),
    requests,
    payments: new LocalPaymentRepository(requests),
    availability: new LocalAvailabilityRepository(requests),
    settings: new LocalSettingsRepository(almacenamiento),
    auth: new LocalAuthRepository(almacenamiento)
  }
}

let actuales: Repositorios | null = null

/** Los repositorios en uso. Se crean la primera vez que se piden. */
export function repositorios(): Repositorios {
  if (!actuales) actuales = crearRepositoriosLocales()
  return actuales
}

/** Reemplaza los repositorios (pruebas, o la implementación de Supabase). */
export function usarRepositorios(nuevos: Repositorios | null): void {
  actuales = nuevos
}
