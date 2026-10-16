// src/services/availability.ts

import type { ReservationRequest, ServiceType } from '../types/domain'

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
  existingRequests: ReservationRequest[]
): boolean {
  const activeBookings = existingRequests.filter(r => {
    const rawType = r.type as string
    const rawStatus = r.status as string
    const isCabina = rawType === 'cabana' || rawType === 'cabaña'
    const isActive = rawStatus === 'confirmed' || rawStatus === 'pending' || rawStatus === 'confirmada' || rawStatus === 'pendiente'
    return isCabina && isActive && r.details?.resourceId === cabinId
  })
  for (const booking of activeBookings) {
    const bStart = booking.details?.startDate || booking.date
    const bEnd = booking.details?.endDate || booking.timeOrDuration
    if (isDateRangeOverlapping(checkInDate, checkOutDate, bStart, bEnd)) {
      return false
    }
  }
  return true
}

/**
 * Valida si la fecha solicitada es pasada respecto a hoy.
 */
export function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return target < today
}

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
    const checkOut = new Date(dateStr)
    checkOut.setDate(checkOut.getDate() + 1)
    const checkOutStr = checkOut.toISOString().split('T')[0]
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

/**
 * Calcula el estado de ocupación diaria global para el calendario administrativo.
 */
export function getDayOccupancy(
  dateStr: string,
  existingRequests: ReservationRequest[]
): { confirmedCount: number; pendingCount: number; status: 'disponible' | 'ocupado' | 'sobrecupo' } {
  const dayRequests = existingRequests.filter(r => {
    const start = r.details?.startDate || r.date
    const end = r.details?.endDate || r.timeOrDuration
    if (start === dateStr) return true
    if (r.details?.startDate && r.details?.endDate) {
      return isDateRangeOverlapping(dateStr, dateStr, start, end)
    }
    return false
  })

  const confirmedCount = dayRequests.filter(r => {
    const s = r.status as string
    return s === 'confirmed' || s === 'confirmada'
  }).length

  const pendingCount = dayRequests.filter(r => {
    const s = r.status as string
    return s === 'pending' || s === 'pendiente'
  }).length

  let status: 'disponible' | 'ocupado' | 'sobrecupo' = 'disponible'
  if (confirmedCount + pendingCount > 8) {
    status = 'sobrecupo'
  } else if (confirmedCount + pendingCount > 0) {
    status = 'ocupado'
  }

  return { confirmedCount, pendingCount, status }
}