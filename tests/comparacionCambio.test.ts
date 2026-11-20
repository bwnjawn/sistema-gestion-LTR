import { describe, expect, it } from 'vitest'
import { compararCambio, mensajeDePrecio } from '../src/services/comparacionCambio'
import { applyRequestEdit, buildRequestFromDraft, toRequestEdit, type BorradorSolicitud } from '../src/services/requests'
import { calculateBookingPrice } from '../src/services/pricing'
import { formatCLP } from '../src/lib/format'
import type { Cabin, ReservationRequest } from '../src/types/domain'

const TASAS = { ivaPercentage: 19, depositPercentage: 30 }
const cabana: Cabin = { id: 'c1', name: 'Cabaña 1', capacity: 6, pricePerNight: 65000, isActive: true }

function dia(desfase: number): string {
  const d = new Date()
  d.setDate(d.getDate() + desfase)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const borrador = (entrada: string, salida: string): BorradorSolicitud => ({
  service: 'cabana',
  checkInDate: entrada,
  checkOutDate: salida,
  guestsCount: 4,
  campingType: 'pernoctar',
  restaurantTime: '',
  selectedMealTypes: [],
  mealTimes: {},
  selectedMeals: [],
  clientType: 'Particular',
  clientName: 'Ana Pérez',
  clientPhone: '+56 9 1234 5678',
  clientEmail: '',
  comments: '',
  resourceId: 'c1',
  resourceName: 'Cabaña 1'
})

function reservaDeCabana(entrada: string, salida: string): ReservationRequest {
  const price = calculateBookingPrice({
    ...TASAS,
    service: 'cabana',
    cabin: cabana,
    checkInDate: entrada,
    checkOutDate: salida,
    guestsCount: 4,
    campingType: 'pernoctar',
    meals: []
  })!
  const r = buildRequestFromDraft(borrador(entrada, salida), {
    origin: 'cliente',
    requestCode: 'SOL-1',
    price,
    ivaPercentage: 19,
    depositPercentage: 30,
    today: dia(0)
  })
  return { ...r, id: 'r1', status: 'confirmed' }
}

const ctx = (requests: ReservationRequest[] = []) => ({ requests, cabins: [cabana], campingSites: [], currentRates: TASAS })

describe('compararCambio — cabaña', () => {
  it('pasar de 3 a 2 noches baja el total y el abono, y muestra las noches', () => {
    const req = reservaDeCabana(dia(30), dia(33))
    const res = compararCambio(req, { ...toRequestEdit(req), startDate: dia(40), endDate: dia(42) }, ctx([req]))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    const c = res.comparacion
    expect(c.antes.noches).toBe(3)
    expect(c.ahora.noches).toBe(2)
    expect(c.precio).toBe('baja')
    expect(c.ahora.total).toBeLessThan(c.antes.total)
    expect(c.ahora.abono).toBeLessThan(c.antes.abono)
    expect(c.diferencia).toBe(c.ahora.total - c.antes.total)
    expect(c.mensajePrecio).toBe(`El total baja ${formatCLP(-c.diferencia)}`)
  })

  it('pasar de 2 a 4 noches sube el total', () => {
    const req = reservaDeCabana(dia(30), dia(32))
    const res = compararCambio(req, { ...toRequestEdit(req), startDate: dia(40), endDate: dia(44) }, ctx([req]))
    expect(res.ok && res.comparacion.precio).toBe('sube')
    expect(res.ok && res.comparacion.mensajePrecio).toMatch(/^El total sube \$/)
  })

  it('mover con las mismas noches: el precio no cambia', () => {
    const req = reservaDeCabana(dia(30), dia(33))
    const res = compararCambio(req, { ...toRequestEdit(req), startDate: dia(50), endDate: dia(53) }, ctx([req]))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.comparacion.precio).toBe('igual')
    expect(res.comparacion.diferencia).toBe(0)
    expect(res.comparacion.mensajePrecio).toBe('El precio no cambia')
    expect(res.comparacion.antes.fechas).not.toBe(res.comparacion.ahora.fechas)
  })

  it('lo que se muestra es exactamente lo que se guardaría con applyRequestEdit', () => {
    const req = reservaDeCabana(dia(30), dia(33))
    const edit = { ...toRequestEdit(req), startDate: dia(40), endDate: dia(42) }
    const vista = compararCambio(req, edit, ctx([req]))
    const guardado = applyRequestEdit(req, edit, ctx([req]))
    expect(vista.ok && guardado.ok).toBe(true)
    if (vista.ok && guardado.ok) {
      expect(vista.comparacion.ahora.total).toBe(guardado.request.totalAmount)
      expect(vista.comparacion.ahora.abono).toBe(guardado.request.depositRequired)
    }
  })

  it('no modifica la solicitud original', () => {
    const req = reservaDeCabana(dia(30), dia(33))
    const copia = JSON.stringify(req)
    compararCambio(req, { ...toRequestEdit(req), startDate: dia(40), endDate: dia(42) }, ctx([req]))
    expect(JSON.stringify(req)).toBe(copia)
  })

  it('si la fecha nueva está ocupada, devuelve el mismo error que el guardado', () => {
    const req = reservaDeCabana(dia(30), dia(33))
    const otra = { ...reservaDeCabana(dia(40), dia(43)), id: 'r2' }
    const res = compararCambio(req, { ...toRequestEdit(req), startDate: dia(41), endDate: dia(44) }, ctx([req, otra]))
    expect(res.ok).toBe(false)
  })

  it('no se compara con lo ya pagado: un abono pagado mayor al nuevo exigido no cambia la comparación', () => {
    const req = reservaDeCabana(dia(30), dia(33))
    const pagada: ReservationRequest = {
      ...req,
      payments: [{ id: 'p1', amount: req.depositRequired, date: dia(0), method: 'transferencia' } as never]
    }
    const res = compararCambio(pagada, { ...toRequestEdit(pagada), startDate: dia(40), endDate: dia(42) }, ctx([pagada]))
    expect(res.ok).toBe(true)
    if (res.ok) expect(Object.keys(res.comparacion).sort()).toEqual(['ahora', 'antes', 'diferencia', 'mensajePrecio', 'precio'])
  })
})

describe('compararCambio — visitas de un día', () => {
  const restaurante: ReservationRequest = {
    id: 'rest',
    requestCode: 'SOL-2',
    clientName: 'Luis',
    clientPhone: '+56 9 1234 5678',
    type: 'restaurante',
    resourceName: 'Restaurante',
    date: dia(30),
    timeOrDuration: '13:00',
    guestsCount: 10,
    totalAmount: 85000,
    depositRequired: 25500,
    payments: [],
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    details: { resourceId: '', startDate: dia(30), endDate: dia(30) }
  }

  it('restaurante: cambiar el día no cambia el precio y no muestra noches', () => {
    const res = compararCambio(restaurante, { ...toRequestEdit(restaurante), startDate: dia(31) }, ctx([restaurante]))
    expect(res.ok).toBe(true)
    if (!res.ok) return
    expect(res.comparacion.precio).toBe('igual')
    expect(res.comparacion.antes.noches).toBeNull()
    expect(res.comparacion.ahora.noches).toBeNull()
    expect(res.comparacion.antes.total).toBe(85000)
    expect(res.comparacion.ahora.abono).toBe(25500)
    expect(res.comparacion.antes.fechas).not.toContain('–')
  })
})

describe('mensajeDePrecio', () => {
  it('dice si sube, baja o no cambia', () => {
    expect(mensajeDePrecio(0)).toBe('El precio no cambia')
    expect(mensajeDePrecio(60000)).toBe(`El total sube ${formatCLP(60000)}`)
    expect(mensajeDePrecio(-77350)).toBe(`El total baja ${formatCLP(77350)}`)
  })
})
