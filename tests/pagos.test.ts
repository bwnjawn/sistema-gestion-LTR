import { describe, expect, it } from 'vitest'
import { buildPayment, getPaymentSummary, validatePayment } from '../src/services/payments'
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
