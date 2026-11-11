// src/services/cruces.ts
// Datos para resolver los cruces al confirmar una solicitud (SCRUM-262).
// No cambia ni rechaza nada: solo entrega la información que el administrador necesita para decidir.

import type { ReservationRequest } from '../types/domain'
import type { LimitesAforo } from '../types/settings'
import { isoToDate, todayISO } from '../lib/dates'
import {
  findConflicts,
  getRequestDateRange,
  isRequestActive,
  isRequestConfirmed,
  LIMITES_AFORO_POR_DEFECTO
} from './availability'

/** Una solicitud del grupo que se cruza, con lo que el administrador compara para elegir cuál confirmar. */
export interface SolicitudEnCruce {
  solicitud: ReservationRequest
  /** True para la solicitud que el administrador quiere aprobar. */
  esLaPropia: boolean
  /** Días en que esta solicitud se topa con otras del grupo. */
  dias: string[]
  /** Solicitudes del grupo con las que se cruza directamente (para explicar las cadenas). */
  seCruzaConIds: string[]
  /** Días desde hoy hasta la entrada; negativo si la fecha ya pasó. */
  diasParaLaFecha: number
  confirmada: boolean
  /** Se puede confirmar sin chocar con ninguna reserva ya confirmada. */
  puedeConfirmarse: boolean
}

/** Días completos entre dos fechas ISO (hasta - desde). */
export function diasEntre(desde: string, hasta: string): number {
  const a = isoToDate(desde)
  const b = isoToDate(hasta)
  if (!a || !b) return 0
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** Cercanía de la fecha en palabras, para comparar solicitudes en el diálogo. */
export function describirCercania(diasParaLaFecha: number): string {
  if (diasParaLaFecha < 0) return 'La fecha ya pasó'
  if (diasParaLaFecha === 0) return 'Es hoy'
  if (diasParaLaFecha === 1) return 'Es mañana'
  return `Faltan ${diasParaLaFecha} días`
}

/**
 * Una solicitud se puede confirmar si, junto a las ya confirmadas, no se topa con ninguna.
 * Así nunca quedan dos confirmadas cruzadas (decisión del 10/11).
 */
export function puedeConfirmarse(
  solicitud: ReservationRequest,
  existentes: ReservationRequest[],
  limites: LimitesAforo = LIMITES_AFORO_POR_DEFECTO
): boolean {
  if (!isRequestActive(solicitud)) return false
  const confirmadas = existentes.filter(r => r.id !== solicitud.id && isRequestConfirmed(r))
  const candidata = { ...solicitud, status: 'confirmed' } as ReservationRequest
  return !findConflicts([...confirmadas, candidata], limites).some(c => c.solicitudIds.includes(solicitud.id))
}

/**
 * Grupo completo de solicitudes que compiten con la indicada, para el diálogo de confirmación.
 * Incluye las cadenas: si A choca con B y B choca con C, al aprobar A también se ve C,
 * porque confirmar A deja a B sin lugar y eso cambia lo que pasa con C.
 * La primera es la propia; las demás van de la entrada más cercana a la más lejana.
 * Si no hay cruces devuelve una lista vacía y se puede aprobar directo.
 */
export function getCrossedRequests(
  solicitudId: string,
  solicitudes: ReservationRequest[],
  limites: LimitesAforo = LIMITES_AFORO_POR_DEFECTO,
  hoy: string = todayISO()
): SolicitudEnCruce[] {
  const propia = solicitudes.find(r => r.id === solicitudId)
  if (!propia) return []

  // Quién choca con quién y en qué días, entre todas las solicitudes activas
  const vecinos = new Map<string, Set<string>>()
  const diasPorId = new Map<string, Set<string>>()
  for (const conflicto of findConflicts(solicitudes, limites)) {
    for (const id of conflicto.solicitudIds) {
      const cercanos = vecinos.get(id) ?? new Set<string>()
      conflicto.solicitudIds.filter(otro => otro !== id).forEach(otro => cercanos.add(otro))
      vecinos.set(id, cercanos)
      const dias = diasPorId.get(id) ?? new Set<string>()
      conflicto.dias.forEach(d => dias.add(d))
      diasPorId.set(id, dias)
    }
  }
  if (!vecinos.get(solicitudId)?.size) return []

  // Grupo = todas las solicitudes alcanzables desde la propia siguiendo los cruces
  const grupo = new Set<string>([solicitudId])
  const porVisitar = [solicitudId]
  while (porVisitar.length > 0) {
    const actual = porVisitar.pop() as string
    for (const otro of vecinos.get(actual) ?? []) {
      if (grupo.has(otro)) continue
      grupo.add(otro)
      porVisitar.push(otro)
    }
  }

  const armar = (solicitud: ReservationRequest): SolicitudEnCruce => ({
    solicitud,
    esLaPropia: solicitud.id === solicitudId,
    dias: [...(diasPorId.get(solicitud.id) ?? [])].sort(),
    seCruzaConIds: [...(vecinos.get(solicitud.id) ?? [])],
    diasParaLaFecha: diasEntre(hoy, getRequestDateRange(solicitud).start),
    confirmada: isRequestConfirmed(solicitud),
    puedeConfirmarse: !isRequestConfirmed(solicitud) && puedeConfirmarse(solicitud, solicitudes, limites)
  })

  const otras = [...grupo]
    .filter(id => id !== solicitudId)
    .map(id => solicitudes.find(r => r.id === id))
    .filter((r): r is ReservationRequest => !!r)
    .sort((a, b) => getRequestDateRange(a).start.localeCompare(getRequestDateRange(b).start))

  return [armar(propia), ...otras.map(armar)]
}
