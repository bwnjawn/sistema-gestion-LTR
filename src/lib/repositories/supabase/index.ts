// src/lib/repositories/supabase/index.ts
// Todos los repositorios sobre Supabase. Se activan solos cuando `.env` tiene la URL y la clave pública
// (ver src/lib/repositories/index.ts).

import type { Repositorios } from '../index'
import { SupabaseSettingsRepository } from './ajustes'
import { SupabaseAuthRepository } from './autenticacion'
import { crearRepositoriosCatalogoSupabase } from './catalogo'
import { SupabaseAvailabilityRepository } from './disponibilidad'
import { SupabaseDocumentosRepository } from './documentos'
import { SupabasePaymentRepository } from './pagos'
import { SupabaseRequestRepository } from './solicitudes'
import { ColaEnvioIndexedDb } from '../colaEnvioRepository'
import { ColaCambiosIndexedDb } from '../colaCambiosRepository'
import { LocalPreferenciasRepository } from '../preferenciasRepository'

export function crearRepositoriosSupabase(): Repositorios {
  return {
    modo: 'supabase',
    ...crearRepositoriosCatalogoSupabase(),
    requests: new SupabaseRequestRepository(),
    payments: new SupabasePaymentRepository(),
    availability: new SupabaseAvailabilityRepository(),
    settings: new SupabaseSettingsRepository(),
    documents: new SupabaseDocumentosRepository(),
    auth: new SupabaseAuthRepository(),
    colaEnvio: new ColaEnvioIndexedDb(),
    colaCambios: new ColaCambiosIndexedDb(),
    // Las preferencias de pantalla son de cada dispositivo: no van a la base
    preferencias: new LocalPreferenciasRepository()
  }
}
