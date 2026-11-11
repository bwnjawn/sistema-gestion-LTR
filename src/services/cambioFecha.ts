// src/services/cambioFecha.ts
// Qué días se pueden elegir al mover la fecha de una solicitud (SCRUM-262).
// Usa las mismas reglas que el cliente (solo las confirmadas bloquean), pero la solicitud que se mueve
// no cuenta contra sí misma. Las pendientes de otros no bloquean: solo se marcan.

import type { ReservationRequest } from '../types/domain'
import { addDays } from '../lib/dates'
import {
  COMIDAS_RESTAURANTE,
  getFullMeals,
  getRequestsForDay,
  isCabinAvailable,
  isCampingDayBlocked,
  isCampingStayBlocked,
  isRequestConfirmed
} from './availability'

/** Cupos totales con los que se comparan las solicitudes de restaurante y camping. */
export interface CapacidadesCambioFecha {
  restaurante: number
  camping: number
}

function sinLaPropia(solicitud: ReservationRequest, todas: ReservationRequest[]): ReservationRequest[] {
  return todas.filter(r => r.id !== solicitud.id)
}

function modalidad(solicitud: ReservationRequest) {
  return solicitud.details?.campingType ?? 'pernoctar'
}

/** Un día (o la noche de llegada, en cabañas y pernoctar) no se puede elegir por una reserva confirmada. */
export function isMoveDayBlocked(
  solicitud: ReservationRequest,
  dia: string,
  todas: ReservationRequest[],
  capacidades: CapacidadesCambioFecha
): boolean {
  const otras = sinLaPropia(solicitud, todas)
  const tipo = solicitud.type as string

  if ((tipo === 'cabana' || tipo === 'cabaña') && solicitud.details?.resourceId) {
    return !isCabinAvailable(solicitud.details.resourceId, dia, addDays(dia, 1), todas, solicitud.id)
  }

  if (tipo === 'restaurante') {
    const comidas = solicitud.details?.selectedMealTypes ?? []
    const llenas = getFullMeals(dia, solicitud.guestsCount, otras, capacidades.restaurante)
    // La solicitud necesita todas sus comidas: basta con que una esté llena. Sin comidas definidas, solo si lo están las tres.
    return comidas.length > 0
      ? comidas.some(comida => llenas.includes(comida))
      : llenas.length === COMIDAS_RESTAURANTE.length
  }

  if (tipo === 'camping') {
    return isCampingDayBlocked(dia, modalidad(solicitud), solicitud.guestsCount, otras, capacidades.camping)
  }

  return false
}

/** Una estadía [entrada, salida) no se puede elegir si alguna de sus noches está ocupada por una confirmada. */
export function isMoveStayBlocked(
  solicitud: ReservationRequest,
  entrada: string,
  salida: string,
  todas: ReservationRequest[],
  capacidades: CapacidadesCambioFecha
): boolean {
  const tipo = solicitud.type as string

  if ((tipo === 'cabana' || tipo === 'cabaña') && solicitud.details?.resourceId) {
    return !isCabinAvailable(solicitud.details.resourceId, entrada, salida, todas, solicitud.id)
  }

  if (tipo === 'camping' && modalidad(solicitud) === 'pernoctar') {
    return isCampingStayBlocked(entrada, salida, solicitud.guestsCount, sinLaPropia(solicitud, todas), capacidades.camping)
  }

  return false
}

/** El día se puede elegir pero ya tiene otra solicitud pendiente del mismo recurso (se marca, no se bloquea). */
export function hasPendingOnMoveDay(
  solicitud: ReservationRequest,
  dia: string,
  todas: ReservationRequest[]
): boolean {
  const tipo = solicitud.type as string
  const delMismoServicio = getRequestsForDay(dia, sinLaPropia(solicitud, todas), [solicitud.type]).filter(
    r => !isRequestConfirmed(r)
  )

  if (tipo === 'cabana' || tipo === 'cabaña') {
    return delMismoServicio.some(r => r.details?.resourceId === solicitud.details?.resourceId)
  }
  if (tipo === 'camping') {
    return delMismoServicio.some(r => modalidad(r) === modalidad(solicitud))
  }
  return delMismoServicio.length > 0
}
