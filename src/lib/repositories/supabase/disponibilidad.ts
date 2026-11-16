// src/lib/repositories/supabase/disponibilidad.ts
// Fechas ocupadas para el calendario del cliente: la función pública `fechas_ocupadas` (sin datos personales).

import type { FechasOcupadas } from '../../../types/disponibilidad'
import { supabase } from '../../supabase'
import type { AvailabilityRepository } from '../availabilityRepository'
import { datosOLanzar } from './errores'

export class SupabaseAvailabilityRepository implements AvailabilityRepository {
  async fechasOcupadas(desde: string, hasta: string): Promise<FechasOcupadas> {
    const datos = datosOLanzar(
      await supabase().rpc('fechas_ocupadas', { desde, hasta }),
      'No se pudo cargar la disponibilidad.'
    ) as Partial<FechasOcupadas> | null
    return { cabanas: datos?.cabanas ?? [], restaurante: datos?.restaurante ?? [], camping: datos?.camping ?? [] }
  }
}
