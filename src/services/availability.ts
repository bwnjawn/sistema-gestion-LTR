// src/services/availability.ts

import type { ReservationRequest, ServiceType } from '../types/domain'
import type { EspacioRestaurante, LimitesAforo } from '../types/settings'
import { addDays, isoToDate, isPastDate } from '../lib/dates'

/**
 * Evalúa si dos rangos de fechas se solapan en intervalo semiabierto [start, end).
 */
export function isDateRangeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  if (!startA || !endA || !startB || !endB) return false
  const aStart = new Date(startA).getTime()
  const aEnd = new Date(endA).getTime()
  const bStart = new Date(startB).getTime()
  const bEnd = new Date(endB).getTime()
  return aStart < bEnd && aEnd > bStart
}

/**
 * Verifica si una cabaña específica está libre en las fechas indicadas.
 */
export function isCabinAvailable(
  cabinId: string,
  checkInDate: string,
  checkOutDate: string,
  existingRequests: ReservationRequest[],
  /** Solicitud que se está modificando: no cuenta como conflicto consigo misma. */
  excludeRequestId?: string
): boolean {
  const activeBookings = existingRequests.filter(r => {
    if (excludeRequestId && r.id === excludeRequestId) return false
    const rawType = r.type as string
    const rawStatus = r.status as string
    const isCabina = rawType === 'cabana' || rawType === 'cabaña'
    const isActive = rawStatus === 'confirmed' || rawStatus === 'pending' || rawStatus === 'confirmada' || rawStatus === 'pendiente'
    return isCabina && isActive && r.details?.resourceId === cabinId
  })
  for (const booking of activeBookings) {
    const bStart = booking.details?.startDate || booking.date
    const bEnd = booking.details?.endDate || booking.timeOrDuration || ''
    if (isDateRangeOverlapping(checkInDate, checkOutDate, bStart, bEnd)) {
      return false
    }
  }
  return true
}

/**
 * Valida si la fecha solicitada es pasada respecto a hoy.
 */
export { isPastDate }

/**
 * Evalúa si un día específico debe estar deshabilitado para un recurso o servicio.
 */
export function isDateDisabled(
  dateStr: string,
  existingRequests: ReservationRequest[],
  serviceType: ServiceType,
  resourceId?: string
): boolean {
  if (isPastDate(dateStr)) return true
  const rawServiceType = serviceType as string
  if ((rawServiceType === 'cabana' || rawServiceType === 'cabaña') && resourceId) {
    // Si la cabaña tiene una reserva activa para esa noche
    const checkOutStr = addDays(dateStr, 1)
    return !isCabinAvailable(resourceId, dateStr, checkOutStr, existingRequests)
  }
  return false
}

/**
 * Valida si la cantidad de personas respeta el rango de aforo [minCapacity, maxCapacity].
 */
export function validateGuestCapacity(
  guestsCount: number,
  minCapacity: number,
  maxCapacity: number
): { isValid: boolean; message?: string } {
  if (guestsCount < minCapacity) {
    return {
      isValid: false,
      message: `El número mínimo de personas permitido para esta opción es ${minCapacity}.`
    }
  }
  if (guestsCount > maxCapacity) {
    return {
      isValid: false,
      message: `El número máximo de personas permitido para esta opción es ${maxCapacity}.`
    }
  }
  return { isValid: true }
}

/**
 * Genera bloques de horarios dinámicos entre dos horas dadas.
 */
export function generateTimeSlots(startHour: string, endHour: string, stepMinutes: number = 30): string[] {
  const slots: string[] = []
  if (!startHour || !endHour) return slots
  const [startH, startM] = startHour.split(':').map(Number)
  const [endH, endM] = endHour.split(':').map(Number)
  let current = startH * 60 + startM
  const end = endH * 60 + endM
  while (current <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0')
    const m = (current % 60).toString().padStart(2, '0')
    slots.push(`${h}:${m}`)
    current += stepMinutes
  }
  return slots
}

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/

/** Acepta los valores antiguos ('cabaña') que aún pueden estar guardados en el navegador. */
function normalizarServicio(tipo: string): ServiceType {
  return (tipo === 'cabaña' ? 'cabana' : tipo) as ServiceType
}

/** Una solicitud ocupa el calendario solo si está pendiente o confirmada (no rechazada ni cancelada). */
export function isRequestActive(req: Pick<ReservationRequest, 'status'>): boolean {
  const estado = req.status as string
  return estado === 'pending' || estado === 'confirmed' || estado === 'pendiente' || estado === 'confirmada'
}

/**
 * Rango de fechas que ocupa una solicitud: `end` es null cuando ocupa un solo día
 * (restaurante, camping por el día o sin fecha de salida).
 */
export function getRequestDateRange(req: ReservationRequest): { start: string; end: string | null } {
  const start = req.details?.startDate || req.date || ''
  const candidato = req.details?.endDate || req.timeOrDuration || ''
  // timeOrDuration del restaurante es una hora ('13:00'), no una fecha.
  const end = FORMATO_FECHA.test(candidato) && candidato > start ? candidato : null
  return { start, end }
}

/**
 * Indica si la solicitud ocupa el día indicado. Usa el intervalo [entrada, salida):
 * el día de salida queda libre.
 */
export function requestOccupiesDay(req: ReservationRequest, dateStr: string): boolean {
  const { start, end } = getRequestDateRange(req)
  if (!start) return false
  if (!end) return start === dateStr
  return dateStr >= start && dateStr < end
}

/** Solicitudes activas que ocupan un día, limitadas a los servicios elegidos (todos si no se indica). */
export function getRequestsForDay(
  dateStr: string,
  existingRequests: ReservationRequest[],
  services?: ServiceType[]
): ReservationRequest[] {
  return existingRequests.filter(r =>
    isRequestActive(r) &&
    (!services || services.includes(normalizarServicio(r.type))) &&
    requestOccupiesDay(r, dateStr)
  )
}

/** Lunes de la semana que contiene la fecha (la semana va de lunes a domingo). */
export function getWeekStart(dateStr: string): string {
  const fecha = isoToDate(dateStr)
  if (!fecha) return ''
  const diasDesdeLunes = (fecha.getDay() + 6) % 7
  return addDays(dateStr, -diasDesdeLunes)
}

/** Las siete fechas (lunes a domingo) de la semana que contiene la fecha. */
export function getWeekDates(dateStr: string): string[] {
  const lunes = getWeekStart(dateStr)
  if (!lunes) return []
  return Array.from({ length: 7 }, (_, i) => addDays(lunes, i))
}

/** Capacidad total del restaurante: suma de la capacidad de sus espacios. */
export function getRestaurantCapacity(espacios: EspacioRestaurante[]): number {
  return espacios.reduce((total, e) => total + Math.max(0, e.capacidad || 0), 0)
}

/** Topes por defecto si no se entregan (200 en el restaurante, 150 en el camping). */
export const LIMITES_AFORO_POR_DEFECTO: LimitesAforo = { restaurantePersonas: 200, campingPersonas: 150 }

/** Personas del restaurante en cada comida del día; una solicitud sin comida definida cuenta aparte. */
function personasRestaurantePorComida(solicitudes: ReservationRequest[]): number {
  const porComida: Record<string, number> = {}
  for (const r of solicitudes) {
    const comidas = r.details?.selectedMealTypes?.length ? r.details.selectedMealTypes : ['sin-comida']
    for (const comida of comidas) {
      porComida[comida] = (porComida[comida] || 0) + r.guestsCount
    }
  }
  return Math.max(0, ...Object.values(porComida))
}

/**
 * Calcula el estado de ocupación diaria para el calendario administrativo.
 * Solo cuenta solicitudes activas y respeta los servicios elegidos.
 * "Sobrecupo" significa superar el aforo permitido: personas por comida en el restaurante
 * (provisorio hasta definir con el cliente si se mide por comida u hora) y personas por día en el camping.
 */
export function getDayOccupancy(
  dateStr: string,
  existingRequests: ReservationRequest[],
  services?: ServiceType[],
  limites: LimitesAforo = LIMITES_AFORO_POR_DEFECTO
): { confirmedCount: number; pendingCount: number; status: 'disponible' | 'ocupado' | 'sobrecupo' } {
  const dayRequests = getRequestsForDay(dateStr, existingRequests, services)
  const confirmedCount = dayRequests.filter(r => (r.status as string) === 'confirmed' || (r.status as string) === 'confirmada').length
  const pendingCount = dayRequests.length - confirmedCount

  const restaurante = dayRequests.filter(r => normalizarServicio(r.type) === 'restaurante')
  const camping = dayRequests.filter(r => normalizarServicio(r.type) === 'camping')
  const superaAforo =
    personasRestaurantePorComida(restaurante) > limites.restaurantePersonas ||
    camping.reduce((total, r) => total + r.guestsCount, 0) > limites.campingPersonas

  let status: 'disponible' | 'ocupado' | 'sobrecupo' = 'disponible'
  if (superaAforo) {
    status = 'sobrecupo'
  } else if (dayRequests.length > 0) {
    status = 'ocupado'
  }

  return { confirmedCount, pendingCount, status }
}