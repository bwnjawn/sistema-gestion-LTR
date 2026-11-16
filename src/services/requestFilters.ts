// src/services/requestFilters.ts
// Filtros de la lista de solicitudes del administrador (SCRUM-58).

import type { BookingStatus, ReservationRequest, ServiceType } from '../types/domain'

/** Estados que se pueden elegir como filtro: 'discarded' junta las rechazadas y las canceladas. */
export type FiltroEstado = 'pending' | 'confirmed' | 'discarded'

export interface RequestFilters {
  /** null = todas. 'discarded' junta las rechazadas y las canceladas. */
  status: FiltroEstado | BookingStatus | null
  type: ServiceType | 'all'
  /** Texto libre: código, cliente, teléfono o recurso. */
  query: string
}

/** Estados que el administrador puede elegir como filtro, en el orden en que se muestran. */
export const FILTERABLE_STATUSES: FiltroEstado[] = ['pending', 'confirmed', 'discarded']

/** Convierte un valor externo (por ejemplo ?estado= en la URL) en un estado válido, o null. */
export function parseStatusFilter(value: unknown): FiltroEstado | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (raw === 'rejected' || raw === 'cancelled') return 'discarded'
  return FILTERABLE_STATUSES.find(s => s === raw) ?? null
}

export function filterRequests(requests: ReservationRequest[], filters: RequestFilters): ReservationRequest[] {
  const q = filters.query.toLowerCase().trim()
  return requests.filter(req => {
    if (filters.status === 'discarded') {
      if (req.status !== 'rejected' && req.status !== 'cancelled') return false
    } else if (filters.status && req.status !== filters.status) return false
    if (filters.type !== 'all' && req.type !== filters.type) return false
    if (!q) return true
    return [req.requestCode, req.clientName, req.clientPhone, req.resourceName]
      .some(field => (field || '').toLowerCase().includes(q))
  })
}

/** Cuántas solicitudes hay en cada estado, para mostrarlo en los filtros. */
export function countByStatus(requests: ReservationRequest[]): Record<BookingStatus, number> {
  const counts: Record<BookingStatus, number> = { pending: 0, confirmed: 0, rejected: 0, cancelled: 0 }
  for (const req of requests) counts[req.status]++
  return counts
}

/** Cuántas solicitudes hay por cada filtro de estado (las descartadas suman rechazadas y canceladas). */
export function countByFilter(requests: ReservationRequest[]): Record<'pending' | 'confirmed' | 'discarded', number> {
  const c = countByStatus(requests)
  return { pending: c.pending, confirmed: c.confirmed, discarded: c.rejected + c.cancelled }
}
