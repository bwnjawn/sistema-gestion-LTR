// src/services/resumenSolicitud.ts
// Textos y orden de la lista de solicitudes del administrador: lo mínimo para decidir de un vistazo.
// Solo arma datos; los colores y el diseño viven en los componentes.

import type { BookingStatus, ReservationRequest } from '../types/domain'
import { formatCLP } from '../lib/format'
import { formatDateTime, isoToDate, nightsBetween, todayISO } from '../lib/dates'
import { getRequestDateRange } from './availability'
import { getPaymentSummary, isDepositOverdue } from './payments'
import { isSingleDayRequest, isStalePending } from './requests'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const DIAS_SEMANA = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

/** "12–14 nov", "28 oct – 2 nov" o "12 nov" (un solo día). */
export function rangoCorto(inicio: string, fin: string | null): string {
  const a = isoToDate(inicio)
  if (!a) return 'Sin fecha'
  const corta = (d: Date) => `${d.getDate()} ${MESES[d.getMonth()]}`
  const b = fin ? isoToDate(fin) : null
  if (!b) return corta(a)
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `${a.getDate()}–${b.getDate()} ${MESES[b.getMonth()]}`
  }
  return `${corta(a)} – ${corta(b)}`
}

/** Una fecha en partes, para mostrarla grande: { semana: 'vie', dia: '12', mes: 'nov' }. */
export function partesDeFecha(iso: string): { semana: string; dia: string; mes: string } {
  const d = isoToDate(iso)
  if (!d) return { semana: '', dia: '-', mes: '' }
  return { semana: DIAS_SEMANA[d.getDay()], dia: String(d.getDate()), mes: MESES[d.getMonth()] }
}

export interface ResumenSolicitud {
  recurso: string
  /** "12–14 nov" */
  fechas: string
  /** Noches de la estadía; 0 en visitas de un día. */
  noches: number
  personas: string
  inicio: string
  fin: string | null
  esVisitaDeUnDia: boolean
}

export function resumirSolicitud(req: ReservationRequest): ResumenSolicitud {
  const { start, end } = getRequestDateRange(req)
  const unDia = isSingleDayRequest(req)
  const fin = unDia ? null : end
  const noches = fin ? nightsBetween(start, fin) : 0
  const unidad = req.type === 'restaurante' ? (req.guestsCount === 1 ? 'comensal' : 'comensales') : req.guestsCount === 1 ? 'persona' : 'personas'
  return {
    recurso: req.resourceName,
    fechas: rangoCorto(start, fin),
    noches,
    personas: `${req.guestsCount} ${unidad}`,
    inicio: start,
    fin,
    esVisitaDeUnDia: unDia
  }
}

/** Por qué una solicitud necesita atención. De más a menos grave; la tarjeta muestra solo la primera. */
export type TipoSenal = 'bloqueo' | 'cruce' | 'vencido' | 'sin-gestionar' | 'plazo'

export interface Senal {
  tipo: TipoSenal
  texto: string
  /** Pide una decisión ahora (rojo) o solo informa (ámbar). */
  urgente: boolean
}

/**
 * La señal más importante de una solicitud pendiente, o null. Una sola por tarjeta:
 * 1. la fecha ya la ocupa una confirmada, 2. se cruza con otras pendientes, 3. abono vencido,
 * 4. más de 24 h sin gestionar, 5. plazo vigente para abonar.
 */
export function senalDeSolicitud(
  req: ReservationRequest,
  contexto: { bloqueo?: string; cruces?: number }
): Senal | null {
  if (req.status !== 'pending') return null
  if (contexto.bloqueo) return { tipo: 'bloqueo', texto: `Fecha ocupada por ${contexto.bloqueo}`, urgente: true }
  if (contexto.cruces) {
    return {
      tipo: 'cruce',
      texto: `Se cruza con ${contexto.cruces} ${contexto.cruces === 1 ? 'solicitud' : 'solicitudes'}`,
      urgente: true
    }
  }
  if (isDepositOverdue(req)) return { tipo: 'vencido', texto: 'Abono vencido', urgente: true }
  if (isStalePending(req)) return { tipo: 'sin-gestionar', texto: 'Más de 24 horas sin gestionar', urgente: false }
  const pago = getPaymentSummary(req)
  if (req.depositDueAt && pago.depositPending > 0) {
    return { tipo: 'plazo', texto: `Abono hasta el ${formatDateTime(req.depositDueAt)}`, urgente: false }
  }
  return null
}

/** Línea de dinero de la tarjeta: "Pagado $36.000 de $120.000" o "Sin abono exigido". */
export function describirPago(req: ReservationRequest): { texto: string; porcentaje: number } {
  const p = getPaymentSummary(req)
  const porcentaje = p.total > 0 ? Math.min(100, Math.round((p.totalPaid / p.total) * 100)) : 0
  if (p.state === 'pagado_total') return { texto: `Pagado completo · ${formatCLP(p.total)}`, porcentaje: 100 }
  return { texto: `Pagado ${formatCLP(p.totalPaid)} de ${formatCLP(p.total)}`, porcentaje }
}

const ORDEN_ESTADO: Record<BookingStatus, number> = { pending: 0, confirmed: 1, rejected: 2, cancelled: 3 }

/**
 * Orden de la lista: primero las pendientes, y dentro de cada estado lo que llega antes arriba
 * (lo ya pasado, al final). Las que piden decisión ahora (`urgentes`) van antes que el resto de su estado.
 */
export function ordenarSolicitudes(
  solicitudes: ReservationRequest[],
  urgentes: ReadonlySet<string> = new Set(),
  hoy: string = todayISO()
): ReservationRequest[] {
  const inicio = (r: ReservationRequest) => getRequestDateRange(r).start || '9999-12-31'
  return [...solicitudes].sort((a, b) => {
    if (a.status !== b.status) return ORDEN_ESTADO[a.status] - ORDEN_ESTADO[b.status]
    const ua = urgentes.has(a.id)
    const ub = urgentes.has(b.id)
    if (ua !== ub) return ua ? -1 : 1
    const pasadaA = inicio(a) < hoy
    const pasadaB = inicio(b) < hoy
    if (pasadaA !== pasadaB) return pasadaA ? 1 : -1
    return pasadaA ? inicio(b).localeCompare(inicio(a)) : inicio(a).localeCompare(inicio(b))
  })
}

/** Rechazada y cancelada se muestran juntas como "Descartada": en ambos casos ya no hay nada que hacer. */
export const ESTADOS_DESCARTADOS: BookingStatus[] = ['rejected', 'cancelled']

export function etiquetaEstado(status: BookingStatus): string {
  if (ESTADOS_DESCARTADOS.includes(status)) return 'Descartada'
  return status === 'confirmed' ? 'Confirmada' : 'Pendiente'
}

export type TonoEstado = 'pendiente' | 'por-mover' | 'confirmada' | 'descartada'

/** Familia de color de una solicitud: sirve para la insignia, el borde de la tarjeta y el ícono. */
export function tonoDeEstado(status: BookingStatus, porMover = false): TonoEstado {
  if (status === 'confirmed') return 'confirmada'
  if (ESTADOS_DESCARTADOS.includes(status)) return 'descartada'
  return porMover ? 'por-mover' : 'pendiente'
}
