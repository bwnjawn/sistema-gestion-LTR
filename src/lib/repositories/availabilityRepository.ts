// src/lib/repositories/availabilityRepository.ts
// Disponibilidad para el cliente (SCRUM-246). El público no puede leer las solicitudes (ver "RLS" en
// docs/supabase-esquema.md), así que el calendario del cliente no recibe una lista de solicitudes: recibe solo
// las fechas ocupadas confirmadas, sin datos personales. En Supabase es la función `fechas_ocupadas`;
// el almacenamiento local las calcula desde las solicitudes.

import type { FechasOcupadas } from '../../types/disponibilidad'
import { calcularFechasOcupadas } from '../../services/disponibilidad'
import type { RequestRepository } from './requestsRepository'

export interface AvailabilityRepository {
  /** Fechas ocupadas confirmadas entre `desde` y `hasta` (`YYYY-MM-DD`, ambas incluidas). */
  fechasOcupadas(desde: string, hasta: string): Promise<FechasOcupadas>
}

export class LocalAvailabilityRepository implements AvailabilityRepository {
  private readonly solicitudes: RequestRepository

  constructor(solicitudes: RequestRepository) {
    this.solicitudes = solicitudes
  }

  async fechasOcupadas(desde: string, hasta: string): Promise<FechasOcupadas> {
    return calcularFechasOcupadas(await this.solicitudes.listByRange(desde, hasta), desde, hasta)
  }
}
