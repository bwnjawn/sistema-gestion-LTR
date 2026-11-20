// src/services/colaEnvio.ts
// Reglas de la cola de envío del modo sin conexión (SCRUM-250). Cuando el cliente envía una solicitud sin señal,
// queda guardada en su teléfono con el id que ya tiene y se reenvía sola al volver la conexión.
//  - Solo un error de red deja la solicitud en espera. Una regla del negocio ("sin cupo", "fecha no disponible")
//    la marca como rechazada, con el motivo, para que el cliente lo vea y decida.
//  - Reenviar nunca duplica: el servidor reconoce el id.

import type { ReservationRequest } from '../types/domain'
import { ErrorDeAlmacenamiento, esErrorDeRed } from '../lib/errores'

export type EstadoEnCola = 'pendiente' | 'rechazada'

export interface SolicitudEnCola {
  /** Igual al id de la solicitud. */
  id: string
  solicitud: ReservationRequest
  /** Cuándo se guardó en el teléfono (ISO). */
  encoladaEn: string
  /** Cuántas veces se intentó enviar sin éxito por falta de señal. */
  intentos: number
  estado: EstadoEnCola
  /** Por qué el servidor la rechazó (solo si `estado` es `rechazada`). */
  motivo?: string
}

export type ResultadoDeEnvio =
  | { tipo: 'enviada' }
  | { tipo: 'sin-red' }
  | { tipo: 'rechazada'; motivo: string }

export const MOTIVO_RECHAZO_POR_DEFECTO = 'El servidor no pudo aceptar la solicitud.'

export function crearEntradaDeCola(solicitud: ReservationRequest, ahora: Date = new Date()): SolicitudEnCola {
  return { id: solicitud.id, solicitud, encoladaEn: ahora.toISOString(), intentos: 0, estado: 'pendiente' }
}

/** Qué hacer con una solicitud cuyo envío falló. */
export function clasificarFalloDeEnvio(error: unknown): ResultadoDeEnvio {
  if (esErrorDeRed(error)) return { tipo: 'sin-red' }
  const motivo = error instanceof ErrorDeAlmacenamiento && error.message ? error.message : MOTIVO_RECHAZO_POR_DEFECTO
  return { tipo: 'rechazada', motivo }
}

/** Agrega la solicitud a la cola sin repetirla (mismo id = misma solicitud). */
export function agregarACola(cola: SolicitudEnCola[], entrada: SolicitudEnCola): SolicitudEnCola[] {
  return cola.some(e => e.id === entrada.id) ? cola : [...cola, entrada]
}

export function aplicarResultado(cola: SolicitudEnCola[], id: string, resultado: ResultadoDeEnvio): SolicitudEnCola[] {
  if (resultado.tipo === 'enviada') return cola.filter(e => e.id !== id)
  return cola.map(e => {
    if (e.id !== id) return e
    return resultado.tipo === 'sin-red'
      ? { ...e, intentos: e.intentos + 1 }
      : { ...e, estado: 'rechazada' as const, motivo: resultado.motivo }
  })
}

export function quitarDeCola(cola: SolicitudEnCola[], id: string): SolicitudEnCola[] {
  return cola.filter(e => e.id !== id)
}

export const pendientesDeEnvio = (cola: SolicitudEnCola[]): SolicitudEnCola[] => cola.filter(e => e.estado === 'pendiente')
export const rechazadasEnCola = (cola: SolicitudEnCola[]): SolicitudEnCola[] => cola.filter(e => e.estado === 'rechazada')
