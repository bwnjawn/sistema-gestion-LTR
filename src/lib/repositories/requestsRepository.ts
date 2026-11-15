// src/lib/repositories/requestsRepository.ts
// Solicitudes de reserva. Con Supabase (SCRUM-248) cada una es una fila de `reservas`.

import type { ReservationRequest } from '../../types/domain'
import type { Almacenamiento } from '../persistence'
import { almacenamientoLocal } from '../persistence'
import { ColeccionLocal } from './coleccionLocal'
import type { Repositorio } from './repositorio'

export interface RequestRepository extends Repositorio<ReservationRequest> {
  /**
   * Solicitudes que tocan el rango de fechas `[desde, hasta]` (ambas incluidas, `YYYY-MM-DD`).
   * Sirve para pedir solo un mes al calendario en vez de toda la lista.
   */
  listByRange(desde: string, hasta: string): Promise<ReservationRequest[]>
}

/** Fechas que ocupa una solicitud: de la entrada a la salida, o solo el día si es una visita de un día. */
function rangoDe(req: ReservationRequest): { inicio: string; fin: string } {
  const inicio = req.details?.startDate || req.date || ''
  const salida = req.details?.endDate || ''
  return { inicio, fin: /^\d{4}-\d{2}-\d{2}$/.test(salida) && salida > inicio ? salida : inicio }
}

export class LocalRequestRepository extends ColeccionLocal<ReservationRequest> implements RequestRepository {
  constructor(almacenamiento: Almacenamiento = almacenamientoLocal) {
    // La solicitud más reciente va primero
    super('requests', almacenamiento, { insertar: 'al-principio', entidad: 'la solicitud' })
  }

  async listByRange(desde: string, hasta: string): Promise<ReservationRequest[]> {
    return this.leerTodo().filter(req => {
      const { inicio, fin } = rangoDe(req)
      return !!inicio && inicio <= hasta && fin >= desde
    })
  }
}
