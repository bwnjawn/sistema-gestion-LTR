import { describe, expect, it } from 'vitest'
import { buildPayment, calculateInitialDepositDueAt, getPaymentSummary, isConfirmedWithoutDeposit, isDepositOverdue, validatePayment } from '../src/services/payments'
import type { Payment } from '../src/types/domain'

function pago(amount: number): Payment {
  return buildPayment({ amount, method: 'transferencia' })
}

describe('pagos', () => {
  it('sin pagos queda "sin abono"', () => {
    const r = getPaymentSummary({ totalAmount: 100000, depositRequired: 30000, payments: [] })
    expect(r.state).toBe('sin_abono')
    expect(r.balance).toBe(100000)
    expect(r.depositPending).toBe(30000)
  })

  it('abono parcial, completo y pagado total', () => {
    const base = { totalAmount: 100000, depositRequired: 30000 }
    expect(getPaymentSummary({ ...base, payments: [pago(10000)] }).state).toBe('abono_parcial')
    expect(getPaymentSummary({ ...base, payments: [pago(30000)] }).state).toBe('abono_completo')
    expect(getPaymentSummary({ ...base, payments: [pago(100000)] }).state).toBe('pagado_total')
  })

  it('rechaza montos inválidos o mayores al saldo', () => {
    const req = { totalAmount: 100000, depositRequired: 30000, payments: [pago(90000)] }
    expect(validatePayment(req, { amount: 0, method: 'efectivo' }).isValid).toBe(false)
    expect(validatePayment(req, { amount: 20000, method: 'efectivo' }).isValid).toBe(false)
    expect(validatePayment(req, { amount: 10000, method: 'efectivo' }).isValid).toBe(true)
  })

  it('redondea el monto y limpia la nota', () => {
    const p = buildPayment({ amount: 1000.6, method: 'debito', notes: '  ok  ' })
    expect(p.amount).toBe(1001)
    expect(p.notes).toBe('ok')
  })
})

describe('plazo del abono (SCRUM-264)', () => {
  const ahora = new Date('2026-11-11T12:00:00.000Z')
  const base = { totalAmount: 100000, depositRequired: 30000 }

  it('una pendiente tiene 48 horas desde que se envía', () => {
    expect(calculateInitialDepositDueAt({ ...base, status: 'pending', payments: [] }, 48, ahora)).toBe('2026-11-13T12:00:00.000Z')
  })

  it('no hay plazo si está confirmada, no exige abono o el abono ya está', () => {
    expect(calculateInitialDepositDueAt({ ...base, status: 'confirmed', payments: [] }, 48, ahora)).toBeUndefined()
    expect(calculateInitialDepositDueAt({ ...base, depositRequired: 0, status: 'pending', payments: [] }, 48, ahora)).toBeUndefined()
    expect(calculateInitialDepositDueAt({ ...base, status: 'pending', payments: [pago(30000)] }, 48, ahora)).toBeUndefined()
  })

  it('vence solo si está pendiente, falta abono y pasó el plazo', () => {
    const req = { ...base, status: 'pending' as const, payments: [], depositDueAt: '2026-11-13T12:00:00.000Z' }
    const antes = new Date('2026-11-13T11:59:00.000Z').getTime()
    const despues = new Date('2026-11-13T12:01:00.000Z').getTime()
    expect(isDepositOverdue(req, antes)).toBe(false)
    expect(isDepositOverdue(req, despues)).toBe(true)
    expect(isDepositOverdue({ ...req, payments: [pago(30000)] }, despues)).toBe(false)
    expect(isDepositOverdue({ ...req, status: 'confirmed' }, despues)).toBe(false)
    expect(isDepositOverdue({ ...req, depositDueAt: undefined }, despues)).toBe(false)
  })

  it('una reserva sin abono exigido queda "sin abono exigido"', () => {
    const r = getPaymentSummary({ totalAmount: 100000, depositRequired: 0, payments: [] })
    expect(r.state).toBe('sin_abono_exigido')
    expect(r.depositPending).toBe(0)
  })

  it('confirmada con abono pendiente se marca "sin abono"', () => {
    expect(isConfirmedWithoutDeposit({ ...base, status: 'confirmed', payments: [] })).toBe(true)
    expect(isConfirmedWithoutDeposit({ ...base, status: 'confirmed', payments: [pago(30000)] })).toBe(false)
    expect(isConfirmedWithoutDeposit({ ...base, depositRequired: 0, status: 'confirmed', payments: [] })).toBe(false)
    expect(isConfirmedWithoutDeposit({ ...base, status: 'pending', payments: [] })).toBe(false)
  })
})
