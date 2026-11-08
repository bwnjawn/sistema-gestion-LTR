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

export type PaymentState = 'sin_abono' | 'abono_parcial' | 'abono_completo' | 'pagado_total'

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

  const presentation: Record<PaymentState, Pick<PaymentSummary, 'label' | 'tone'>> = {
    sin_abono: { label: 'Sin abono', tone: 'rose' },
    abono_parcial: { label: 'Abono incompleto', tone: 'amber' },
    abono_completo: { label: 'Abono recibido', tone: 'emerald' },
    pagado_total: { label: 'Pagado total', tone: 'emerald' }
  }

  return { total, depositRequired, totalPaid, depositPending, balance, state, ...presentation[state] }
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
