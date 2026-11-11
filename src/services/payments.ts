// src/services/payments.ts
// Reglas de pagos: cuánto se ha pagado, cuánto falta y en qué estado está el abono.

import type { Payment, PaymentMethod, ReservationRequest } from '../types/domain'
import { generateUUID } from '../lib/id'
import { todayISO } from '../lib/dates'

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  debito: 'Débito'
}

/** Horas que tiene el cliente para abonar desde la aprobación (provisorio, editable en Ajustes; D8/D10). */
export const DEFAULT_DEPOSIT_DEADLINE_HOURS = 48

export type PaymentState = 'sin_abono' | 'abono_parcial' | 'abono_completo' | 'pagado_total' | 'sin_abono_exigido'

export interface PaymentSummary {
  total: number
  depositRequired: number
  totalPaid: number
  /** Lo que falta para completar el abono exigido (0 si ya se cubrió). */
  depositPending: number
  /** Saldo total que falta pagar. */
  balance: number
  state: PaymentState
  label: string
  tone: 'rose' | 'amber' | 'emerald'
}

export function getPaymentSummary(
  req: Pick<ReservationRequest, 'totalAmount' | 'depositRequired' | 'payments'>
): PaymentSummary {
  const total = req.totalAmount || 0
  const depositRequired = req.depositRequired || 0
  const totalPaid = (req.payments || []).reduce((sum, p) => sum + p.amount, 0)
  const balance = Math.max(0, total - totalPaid)
  const depositPending = Math.max(0, depositRequired - totalPaid)

  let state: PaymentState = 'sin_abono'
  if (total > 0 && totalPaid >= total) state = 'pagado_total'
  else if (totalPaid > 0 && totalPaid >= depositRequired) state = 'abono_completo'
  else if (totalPaid > 0) state = 'abono_parcial'
  // Sin abono exigido (por ejemplo, una institución en restaurante): no hay nada que esperar
  else if (total > 0 && depositRequired === 0) state = 'sin_abono_exigido'

  const presentation: Record<PaymentState, Pick<PaymentSummary, 'label' | 'tone'>> = {
    sin_abono_exigido: { label: 'Sin abono exigido', tone: 'emerald' },
    sin_abono: { label: 'Sin abono', tone: 'rose' },
    abono_parcial: { label: 'Abono incompleto', tone: 'amber' },
    abono_completo: { label: 'Abono recibido', tone: 'emerald' },
    pagado_total: { label: 'Pagado total', tone: 'emerald' }
  }

  return { total, depositRequired, totalPaid, depositPending, balance, state, ...presentation[state] }
}

// ---------------------------------------------------------------------------
// Plazo del abono (SCRUM-264)
// ---------------------------------------------------------------------------

const MS_POR_HORA = 3600 * 1000

/** Límite para abonar: `horas` después del momento indicado, como ISO. */
export function calculateDepositDueAt(desde: Date | string, horas: number): string {
  const inicio = typeof desde === 'string' ? new Date(desde) : desde
  return new Date(inicio.getTime() + horas * MS_POR_HORA).toISOString()
}

/**
 * Límite para abonar de una solicitud que queda pendiente: `horas` desde que se envía (o que el admin
 * la carga). Solo hay plazo si la solicitud está pendiente y falta abono: una confirmada no tiene plazo
 * y una sin abono exigido (institución) tampoco.
 */
export function calculateInitialDepositDueAt(
  req: Pick<ReservationRequest, 'status' | 'depositRequired' | 'payments'>,
  horas: number,
  desde: Date = new Date()
): string | undefined {
  if (req.status !== 'pending') return undefined
  const pendiente = getPaymentSummary({ totalAmount: 1, ...req }).depositPending > 0
  return pendiente ? calculateDepositDueAt(desde, horas) : undefined
}

/**
 * "Abono vencido": la solicitud sigue pendiente, falta abono y pasó el plazo.
 * Solo es una marca para el admin (cancelar, esperar o contactar); nunca se cancela sola.
 */
export function isDepositOverdue(
  req: Pick<ReservationRequest, 'status' | 'totalAmount' | 'depositRequired' | 'payments' | 'depositDueAt'>,
  ahora: number = Date.now()
): boolean {
  if (req.status !== 'pending' || !req.depositDueAt) return false
  if (getPaymentSummary(req).depositPending <= 0) return false
  const limite = new Date(req.depositDueAt).getTime()
  return !isNaN(limite) && ahora > limite
}

/** Confirmada por decisión del admin aunque falte abono: se muestra "Confirmada sin abono". */
export function isConfirmedWithoutDeposit(
  req: Pick<ReservationRequest, 'status' | 'totalAmount' | 'depositRequired' | 'payments'>
): boolean {
  return req.status === 'confirmed' && getPaymentSummary(req).depositPending > 0
}

export interface PaymentInput {
  amount: number
  method: PaymentMethod
  paidOn?: string
  notes?: string
}

/** Valida un pago contra el saldo pendiente de la solicitud. */
export function validatePayment(
  req: Pick<ReservationRequest, 'totalAmount' | 'depositRequired' | 'payments'>,
  input: PaymentInput
): { isValid: boolean; message?: string } {
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { isValid: false, message: 'Ingresa un monto mayor a cero.' }
  }
  const { balance } = getPaymentSummary(req)
  if (input.amount > balance) {
    return { isValid: false, message: 'El monto supera el saldo pendiente de la reserva.' }
  }
  return { isValid: true }
}

export function buildPayment(input: PaymentInput): Payment {
  return {
    id: generateUUID(),
    amount: Math.round(input.amount),
    method: input.method,
    paidOn: input.paidOn || todayISO(),
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString()
  }
}
