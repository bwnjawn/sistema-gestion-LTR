import { describe, expect, it } from 'vitest'
import {
  calculateBookingPrice,
  calculateCabinPrice,
  calculateCampingPrice,
  calculateRestaurantPrice
} from '../src/services/pricing'
import type { Cabin, CampingSite } from '../src/types/domain'

const tarifas = { depositPercentage: 30, ivaPercentage: 19 }
const cabana = { pricePerNight: 50000 } as Cabin
const sitio = { pricePerPerson: 10000 } as CampingSite

describe('precios', () => {
  it('cabaña: precio por noche × noches, con IVA y abono', () => {
    const r = calculateCabinPrice(cabana, '2026-11-13', '2026-11-15', tarifas)
    expect(r.nights).toBe(2)
    expect(r.subtotal).toBe(100000)
    expect(r.ivaAmount).toBe(19000)
    expect(r.totalWithIva).toBe(119000)
    expect(r.depositAmount).toBe(35700)
  })

  it('cabaña: falla si no existe', () => {
    expect(() => calculateCabinPrice(null, '2026-11-13', '2026-11-15', tarifas)).toThrow()
  })

  it('camping diario cuenta una sola noche', () => {
    const r = calculateCampingPrice(sitio, '2026-11-13', '2026-11-13', 4, 'diario', tarifas)
    expect(r.nights).toBe(1)
    expect(r.subtotal).toBe(40000)
  })

  it('camping pernoctar: personas × noches', () => {
    const r = calculateCampingPrice(sitio, '2026-11-13', '2026-11-15', 3, 'pernoctar', tarifas)
    expect(r.subtotal).toBe(60000)
  })

  it('restaurante: suma platos × cantidad', () => {
    const r = calculateRestaurantPrice(
      [
        { id: 'a', name: 'Asado', price: 12000, quantity: 2 },
        { id: 'b', name: 'Postre', price: 3000, quantity: 1 }
      ],
      tarifas
    )
    expect(r.subtotal).toBe(27000)
  })

  it('reserva sin cabaña no inventa un precio', () => {
    const r = calculateBookingPrice({
      ...tarifas,
      service: 'cabana',
      cabin: null,
      checkInDate: '2026-11-13',
      checkOutDate: '2026-11-15',
      guestsCount: 2,
      campingType: 'diario',
      meals: []
    })
    expect(r).toBeNull()
  })

  describe('exención de abono (SCRUM-264)', () => {
    const pedido = (service: 'restaurante' | 'cabana', clientType: 'Institución' | 'Paseo escolar' | 'Organización' | 'Empresa') => ({
      ...tarifas,
      service,
      clientType,
      cabin: cabana,
      checkInDate: '2026-11-13',
      checkOutDate: '2026-11-15',
      guestsCount: 2,
      campingType: 'diario' as const,
      meals: [{ id: 'a', name: 'Plato', price: 10000, quantity: 10 }]
    })

    it('Institución en restaurante no paga abono, pero el total no cambia', () => {
      const r = calculateBookingPrice(pedido('restaurante', 'Institución'))!
      expect(r.depositAmount).toBe(0)
      expect(r.totalWithIva).toBe(119000)
    })

    it('Paseo escolar, Organización y Empresa en restaurante sí pagan abono', () => {
      expect(calculateBookingPrice(pedido('restaurante', 'Paseo escolar'))!.depositAmount).toBe(35700)
      expect(calculateBookingPrice(pedido('restaurante', 'Organización'))!.depositAmount).toBe(35700)
      expect(calculateBookingPrice(pedido('restaurante', 'Empresa'))!.depositAmount).toBe(35700)
    })

    it('la exención no aplica fuera del restaurante', () => {
      expect(calculateBookingPrice(pedido('cabana', 'Institución'))!.depositAmount).toBeGreaterThan(0)
    })
  })
})
