// Listas cortas del Inicio del panel en PC (SCRUM-278): lo que hay que resolver y lo que viene.
import type { ReservationRequest } from '../types/domain'

/** Solicitudes pendientes, las más recientes primero. */
export function pendientesRecientes(solicitudes: ReservationRequest[], cantidad: number): ReservationRequest[] {
  return solicitudes
    .filter(s => s.status === 'pending')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, cantidad)
}

/** Reservas confirmadas desde `hoy` (inclusive), las más cercanas primero. */
export function proximasReservas(solicitudes: ReservationRequest[], hoy: string, cantidad: number): ReservationRequest[] {
  return solicitudes
    .filter(s => s.status === 'confirmed' && s.date >= hoy)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, cantidad)
}
