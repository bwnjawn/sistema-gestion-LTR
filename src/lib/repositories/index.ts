// src/lib/repositories/index.ts
// Punto único donde los stores obtienen sus repositorios. Con la URL y la clave de Supabase en `.env` son los de
// Supabase; sin ellas (desarrollo sin configurar, pruebas) son los locales (`localStorage`). Las pruebas los
// reemplazan con `usarRepositorios`.

import { almacenamientoLocal, type Almacenamiento } from '../persistence'
import { supabaseConfigurado } from '../supabase'
import { crearRepositoriosSupabase } from './supabase'
import { conCacheSinConexion } from './conCacheSinConexion'
import type { ColaEnvioRepository } from './colaEnvioRepository'
import { ColaEnvioIndexedDb } from './colaEnvioRepository'
import type { ColaCambiosRepository } from './colaCambiosRepository'
import type { PreferenciasRepository } from './preferenciasRepository'
import { LocalPreferenciasRepository } from './preferenciasRepository'
import { ColaCambiosIndexedDb } from './colaCambiosRepository'
import type { AuthRepository } from './authRepository'
import type { AvailabilityRepository } from './availabilityRepository'
import { LocalAvailabilityRepository } from './availabilityRepository'
import { LocalAuthRepository } from './authRepository'
import type { CabinRepository, CampingSiteRepository, DishRepository, GlobalSideRepository } from './catalogRepository'
import { crearRepositoriosCatalogoLocales } from './catalogRepository'
import type { DocumentosRepository } from './documentosRepository'
import { LocalDocumentosRepository } from './documentosRepository'
import type { PaymentRepository } from './paymentsRepository'
import { LocalPaymentRepository } from './paymentsRepository'
import type { RequestRepository } from './requestsRepository'
import { LocalRequestRepository } from './requestsRepository'
import type { SettingsRepository } from './settingsRepository'
import { LocalSettingsRepository } from './settingsRepository'

export interface Repositorios {
  /** De dónde salen los datos: `local` (el navegador) o `supabase` (compartidos entre dispositivos). */
  modo: 'local' | 'supabase'
  cabins: CabinRepository
  campingSites: CampingSiteRepository
  dishes: DishRepository
  globalSides: GlobalSideRepository
  requests: RequestRepository
  payments: PaymentRepository
  availability: AvailabilityRepository
  settings: SettingsRepository
  documents: DocumentosRepository
  auth: AuthRepository
  /** Solicitudes del cliente que esperan señal para enviarse (SCRUM-250). Viven en el dispositivo. */
  colaEnvio: ColaEnvioRepository
  /** Cambios del administrador hechos sin conexión que esperan enviarse (SCRUM-250). Viven en el dispositivo. */
  colaCambios: ColaCambiosRepository
  /** Preferencias de pantalla de este dispositivo, como el tamaño de la letra (SCRUM-276). */
  preferencias: PreferenciasRepository
}

/** Todos los repositorios sobre un almacenamiento local (el real o uno en memoria para pruebas). */
export function crearRepositoriosLocales(almacenamiento: Almacenamiento = almacenamientoLocal): Repositorios {
  const requests = new LocalRequestRepository(almacenamiento)
  return {
    modo: 'local',
    ...crearRepositoriosCatalogoLocales(almacenamiento),
    requests,
    payments: new LocalPaymentRepository(requests),
    availability: new LocalAvailabilityRepository(requests),
    settings: new LocalSettingsRepository(almacenamiento),
    documents: new LocalDocumentosRepository(),
    auth: new LocalAuthRepository(almacenamiento),
    colaEnvio: new ColaEnvioIndexedDb(),
    colaCambios: new ColaCambiosIndexedDb(),
    preferencias: new LocalPreferenciasRepository(almacenamiento)
  }
}

let actuales: Repositorios | null = null

/** Los repositorios en uso. Se crean la primera vez que se piden. */
export function repositorios(): Repositorios {
  if (!actuales) actuales = supabaseConfigurado ? conCacheSinConexion(crearRepositoriosSupabase()) : crearRepositoriosLocales()
  return actuales
}

/** Reemplaza los repositorios (pruebas, o la implementación de Supabase). */
export function usarRepositorios(nuevos: Repositorios | null): void {
  actuales = nuevos
}
