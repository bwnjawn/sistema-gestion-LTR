// src/services/cambiosAdmin.ts
// Reglas de los cambios del administrador hechos sin conexión (SCRUM-250). Cada cambio (crear o guardar una
// reserva, agregar o quitar un pago) se guarda en el dispositivo, se ve de inmediato en pantalla y se envía en orden
// al volver la señal. El servidor decide:
//  - Una confirmación que choca con otra reserva (o supera un cupo) NO se pisa ni se pierde: queda pendiente y
//    marcada "En conflicto" para que un administrador la resuelva.
//  - Cualquier otro rechazo deja el cambio como "rechazado", con el motivo, hasta que el administrador lo descarte.
//  - Reenviar un cambio nunca duplica: guardar una reserva y agregar un pago son idempotentes por id.

import type { Payment, ReservationRequest } from '../types/domain'
import { ErrorDeAlmacenamiento, esErrorDeRed } from '../lib/errores'
import { MOTIVO_RECHAZO_POR_DEFECTO } from './colaEnvio'

export type CambioAdmin =
  /** Crear una reserva nueva (`esNueva`) o reemplazar una existente por esta versión completa. */
  | { tipo: 'guardar'; solicitud: ReservationRequest; esNueva: boolean }
  | { tipo: 'pago-agregar'; solicitudId: string; pago: Payment }
  | { tipo: 'pago-quitar'; solicitudId: string; pagoId: string }

export type EstadoCambio = 'pendiente' | 'rechazado'

export interface CambioEnCola {
  /** Identifica el cambio en la cola (no es el id de la reserva). */
  id: string
  cambio: CambioAdmin
  /** Texto corto para la lista de "cambios sin sincronizar". */
  resumen: string
  creadoEn: string
  estado: EstadoCambio
  /** Por qué el servidor lo rechazó (solo si `estado` es `rechazado`). */
  motivo?: string
}

const VERBO_DE_ESTADO: Record<string, string> = {
  confirmed: 'Confirmar',
  rejected: 'Rechazar',
  cancelled: 'Cancelar',
  pending: 'Dejar pendiente'
}

/** Texto corto de un guardado, para la lista de cambios sin sincronizar. */
export function resumenDeGuardado(previa: ReservationRequest | undefined, nueva: ReservationRequest): string {
  const quien = `${nueva.clientName} (${nueva.resourceName})`
  if (!previa) return `Reserva nueva: ${quien}`
  if (previa.status !== nueva.status) return `${VERBO_DE_ESTADO[nueva.status] ?? 'Cambiar'} la reserva de ${quien}`
  return `Cambios en la reserva de ${quien}`
}

export function resumenDePago(accion: 'agregar' | 'quitar', solicitud: ReservationRequest, monto?: number): string {
  const importe = monto ? ` de $${monto.toLocaleString('es-CL')}` : ''
  return `${accion === 'agregar' ? 'Registrar pago' : 'Quitar pago'}${importe} de ${solicitud.clientName}`
}

export type ResultadoDeCambio =
  | { tipo: 'enviado' }
  | { tipo: 'sin-red' }
  /** Una confirmación chocó: se reenvía como pendiente y "en conflicto". */
  | { tipo: 'conflicto' }
  | { tipo: 'rechazado'; motivo: string }

/** El id de la reserva a la que afecta el cambio. */
export function solicitudDelCambio(c: CambioAdmin): string {
  return c.tipo === 'guardar' ? c.solicitud.id : c.solicitudId
}

export function crearCambioEnCola(cambio: CambioAdmin, resumen: string, id: string, ahora: Date = new Date()): CambioEnCola {
  return { id, cambio, resumen, creadoEn: ahora.toISOString(), estado: 'pendiente' }
}

/** Qué hacer con un cambio cuyo envío falló. */
export function clasificarFalloDeCambio(cambio: CambioAdmin, error: unknown): ResultadoDeCambio {
  if (esErrorDeRed(error)) return { tipo: 'sin-red' }
  const causa = error instanceof ErrorDeAlmacenamiento ? error.causa : undefined
  if (causa === 'conflicto' && cambio.tipo === 'guardar' && cambio.solicitud.status === 'confirmed') return { tipo: 'conflicto' }
  const motivo = error instanceof ErrorDeAlmacenamiento && error.message ? error.message : MOTIVO_RECHAZO_POR_DEFECTO
  return { tipo: 'rechazado', motivo }
}

/** La misma reserva, pero pendiente y marcada en conflicto (el plazo del abono no corre: el admin decide). */
export function comoEnConflicto(solicitud: ReservationRequest): ReservationRequest {
  return { ...solicitud, status: 'pending', enConflicto: true }
}

export function aplicarResultadoDeCambio(cola: CambioEnCola[], id: string, resultado: ResultadoDeCambio): CambioEnCola[] {
  if (resultado.tipo === 'enviado') return cola.filter(c => c.id !== id)
  return cola.map(c => {
    if (c.id !== id) return c
    if (resultado.tipo === 'rechazado') return { ...c, estado: 'rechazado' as const, motivo: resultado.motivo }
    if (resultado.tipo === 'conflicto' && c.cambio.tipo === 'guardar') {
      return { ...c, cambio: { ...c.cambio, solicitud: comoEnConflicto(c.cambio.solicitud) } }
    }
    return c
  })
}

export const cambiosPendientes = (cola: CambioEnCola[]): CambioEnCola[] => cola.filter(c => c.estado === 'pendiente')
export const cambiosRechazados = (cola: CambioEnCola[]): CambioEnCola[] => cola.filter(c => c.estado === 'rechazado')

/** Ids de las reservas con algún cambio por sincronizar. */
export function idsSinSincronizar(cola: CambioEnCola[]): Set<string> {
  return new Set(cambiosPendientes(cola).map(c => solicitudDelCambio(c.cambio)))
}

/**
 * La lista del servidor con los cambios pendientes encima: es lo que ve el administrador. Los rechazados no se
 * aplican (el servidor no los tiene).
 */
export function aplicarCambios(lista: ReservationRequest[], cola: CambioEnCola[]): ReservationRequest[] {
  let resultado = lista
  for (const { cambio } of cambiosPendientes(cola)) {
    const id = solicitudDelCambio(cambio)
    const indice = resultado.findIndex(r => r.id === id)
    if (cambio.tipo === 'guardar') {
      const solicitud = cambio.solicitud
      if (indice === -1) resultado = [solicitud, ...resultado]
      else resultado = resultado.map((r, i) => (i === indice ? solicitud : r))
    } else if (indice !== -1) {
      const actual = resultado[indice]
      const pagos = cambio.tipo === 'pago-agregar'
        ? [...actual.payments.filter(p => p.id !== cambio.pago.id), cambio.pago]
        : actual.payments.filter(p => p.id !== cambio.pagoId)
      resultado = resultado.map((r, i) => (i === indice ? { ...actual, payments: pagos } : r))
    }
  }
  return resultado
}
