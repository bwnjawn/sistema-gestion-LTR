import { formatDateLong, nightsBetween } from '../lib/dates'
import { formatCLP } from '../lib/format'
import {
  applyRequestEdit,
  isSingleDayRequest,
  type RequestEdit,
  type RequestEditContext
} from './requests'
import type { ReservationRequest } from '../types/domain'

/** Cómo queda una reserva en un momento: lo que el administrador compara antes de guardar (SCRUM-285). */
export interface InstantaneaDeReserva {
  /** Fechas ya escritas para mostrar: "10 dic – 13 dic" o un solo día. */
  fechas: string
  /** Noches de la estadía; null en las visitas de un solo día. */
  noches: number | null
  total: number
  abono: number
}

export type CambioDePrecio = 'igual' | 'sube' | 'baja'

export interface ComparacionDeCambio {
  antes: InstantaneaDeReserva
  ahora: InstantaneaDeReserva
  precio: CambioDePrecio
  /** Total nuevo menos total anterior (negativo si baja). */
  diferencia: number
  /** Frase lista para mostrar: "El precio no cambia" o "El total baja $77.350". */
  mensajePrecio: string
}

export type ResultadoDeComparacion =
  | { ok: true; comparacion: ComparacionDeCambio }
  | { ok: false; message: string }

function describirFechas(inicio: string, fin: string, unDia: boolean): string {
  if (!inicio) return 'sin fecha'
  if (unDia || !fin) return formatDateLong(inicio)
  return `${formatDateLong(inicio)} – ${formatDateLong(fin)}`
}

function instantanea(req: ReservationRequest, inicio: string, fin: string): InstantaneaDeReserva {
  const unDia = isSingleDayRequest(req)
  return {
    fechas: describirFechas(inicio, fin, unDia),
    noches: unDia || !fin ? null : nightsBetween(inicio, fin),
    total: req.totalAmount,
    abono: req.depositRequired
  }
}

export function mensajeDePrecio(diferencia: number): string {
  if (diferencia === 0) return 'El precio no cambia'
  return diferencia > 0 ? `El total sube ${formatCLP(diferencia)}` : `El total baja ${formatCLP(-diferencia)}`
}

/**
 * Compara la reserva como está con cómo quedaría al guardar el cambio. Usa el mismo `applyRequestEdit` que el
 * guardado, así lo que se muestra es exactamente lo que se aplica. No se compara con lo ya pagado: el abono
 * pagado cubre parte de la cuota general, por eso no se avisa si supera el abono exigido.
 */
export function compararCambio(
  req: ReservationRequest,
  edit: RequestEdit,
  ctx: RequestEditContext
): ResultadoDeComparacion {
  const resultado = applyRequestEdit(req, edit, ctx)
  if (!resultado.ok) return { ok: false, message: resultado.message }

  const nueva = resultado.request
  const unDia = isSingleDayRequest(req)
  const inicioAntes = req.details?.startDate || req.date
  const finAntes = unDia ? '' : req.details?.endDate || ''
  const inicioAhora = nueva.details?.startDate || nueva.date
  const finAhora = unDia ? '' : nueva.details?.endDate || ''

  const diferencia = nueva.totalAmount - req.totalAmount
  return {
    ok: true,
    comparacion: {
      antes: instantanea(req, inicioAntes, finAntes),
      ahora: instantanea(nueva, inicioAhora, finAhora),
      precio: diferencia === 0 ? 'igual' : diferencia > 0 ? 'sube' : 'baja',
      diferencia,
      mensajePrecio: mensajeDePrecio(diferencia)
    }
  }
}
