import { describe, expect, it } from 'vitest'
import { calculateBookingPrice, calculatePoolPrice } from '../src/services/pricing'
import { applyRequestEdit, buildRequestFromDraft, describeRequest, isSingleDayRequest, normalizeRequest, toRequestEdit } from '../src/services/requests'
import { bookingToRequest, requestToBooking } from '../src/services/adaptadoresReserva'
import { calculateInitialDepositDueAt, getPaymentSummary } from '../src/services/payments'
import { findConflicts, getDayOccupancy, getRequestsForDay } from '../src/services/availability'
import { puedeConfirmarseNueva } from '../src/services/cruces'
import { filterRequests } from '../src/services/requestFilters'
import { WIZARD_STEPS } from '../src/services/wizard'
import type { ReservationRequest } from '../src/types/domain'

const LIMITES = { restaurantePersonas: 200, campingPersonas: 150 }
const TASAS = { ivaPercentage: 19, depositPercentage: 30 }

function piscina(id: string, personas: number, dia: string, total = personas * 3000): ReservationRequest {
  return {
    id,
    requestCode: `SOL-${id}`,
    clientName: 'Ana Pérez',
    clientPhone: '+56 9 1234 5678',
    type: 'piscina',
    resourceName: 'Piscina',
    date: dia,
    timeOrDuration: '1 día',
    guestsCount: personas,
    totalAmount: total,
    depositRequired: 0,
    payments: [],
    status: 'confirmed',
    createdAt: '2027-03-01T12:00:00.000Z',
    details: {
      resourceId: '',
      startDate: dia,
      endDate: dia,
      pricing: { subtotal: total, ivaAmount: 0, ivaPercentage: 0, depositPercentage: 0, nights: 1 }
    }
  }
}

describe('piscina — precio', () => {
  it('cobra personas × precio de la entrada, sin IVA aparte ni abono', () => {
    expect(calculatePoolPrice(3000, 4)).toEqual({
      subtotal: 12000,
      ivaAmount: 0,
      totalWithIva: 12000,
      depositAmount: 0,
      nights: 1
    })
  })

  it('con el servicio piscina, el cálculo general no cae en el del restaurante', () => {
    const precio = calculateBookingPrice({
      ...TASAS,
      service: 'piscina',
      checkInDate: '2027-03-10',
      checkOutDate: '2027-03-10',
      guestsCount: 5,
      campingType: 'diario',
      meals: [{ id: 'x', name: 'Plato', price: 9999, quantity: 1 }],
      poolPrice: 2500
    })
    expect(precio?.totalWithIva).toBe(12500)
    expect(precio?.depositAmount).toBe(0)
  })

  it('una persona como mínimo y un precio inválido no da montos negativos', () => {
    expect(calculatePoolPrice(3000, 0).totalWithIva).toBe(3000)
    expect(calculatePoolPrice(-5, 2).totalWithIva).toBe(0)
  })
})

describe('piscina — solicitud', () => {
  const precio = calculatePoolPrice(3000, 3)
  const borrador = {
    service: 'piscina' as const,
    checkInDate: '2027-03-10',
    checkOutDate: '2027-03-10',
    guestsCount: 3,
    campingType: 'pernoctar' as const,
    restaurantTime: '',
    selectedMealTypes: [],
    mealTimes: {},
    selectedMeals: [],
    clientType: 'Particular' as const,
    clientName: 'Ana',
    clientPhone: '+56 9 1234 5678',
    clientEmail: '',
    comments: '',
    resourceId: '',
    resourceName: 'Piscina'
  }

  it('arma una solicitud sin abono y sin tipo de cliente', () => {
    const solicitud = buildRequestFromDraft(borrador, {
      origin: 'cliente',
      requestCode: 'SOL-123',
      price: precio,
      ivaPercentage: 19,
      depositPercentage: 30,
      today: '2027-03-01'
    })
    expect(solicitud.type).toBe('piscina')
    expect(solicitud.totalAmount).toBe(9000)
    expect(solicitud.depositRequired).toBe(0)
    expect(solicitud.details?.clientType).toBeUndefined()
  })

  it('confirmada y sin abono exigido: no tiene plazo ni queda "sin abono"', () => {
    const req = piscina('a', 3, '2027-03-10')
    expect(calculateInitialDepositDueAt(req, 48)).toBeUndefined()
    expect(getPaymentSummary(req).state).toBe('sin_abono_exigido')
  })

  it('se normaliza como piscina al leer datos guardados', () => {
    expect(normalizeRequest({ ...piscina('a', 2, '2027-03-10'), type: 'piscina' }).type).toBe('piscina')
  })

  it('el detalle no muestra IVA y es una visita de un día', () => {
    const vista = describeRequest(piscina('a', 3, '2027-03-10'))
    expect(vista.serviceLabel).toBe('Piscina')
    expect(vista.stayTitle).toBe('Fecha de la visita')
    expect(vista.guestsLabel).toBe('3 personas')
    expect(vista.priceRows.map(f => f.label)).toEqual(['Total'])
    expect(isSingleDayRequest(piscina('a', 3, '2027-03-10'))).toBe(true)
  })
})

describe('piscina — modificación por el administrador', () => {
  const ctx = {
    requests: [] as ReservationRequest[],
    cabins: [],
    campingSites: [],
    currentRates: TASAS
  }

  it('cambiar las personas recalcula el total con el mismo valor por persona', () => {
    const req = piscina('a', 3, '2027-03-10', 9000)
    const edit = { ...toRequestEdit(req), guestsCount: 5 }
    const res = applyRequestEdit(req, edit, ctx)
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.request.totalAmount).toBe(15000)
      expect(res.request.depositRequired).toBe(0)
      expect(res.request.details?.pricing?.ivaAmount).toBe(0)
    }
  })

  it('cambiar solo la fecha no cambia el precio', () => {
    const req = piscina('a', 3, '2027-03-10', 9000)
    const res = applyRequestEdit(req, { ...toRequestEdit(req), startDate: '2099-01-05' }, ctx)
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.request.totalAmount).toBe(9000)
  })
})

describe('piscina — no bloquea ni cruza nada', () => {
  const otras: ReservationRequest[] = [
    piscina('p1', 500, '2027-03-10'),
    piscina('p2', 500, '2027-03-10')
  ]

  it('no genera cruces aunque haya muchas personas el mismo día', () => {
    expect(findConflicts(otras, LIMITES)).toEqual([])
  })

  it('se puede cargar confirmada aunque haya otras confirmadas el mismo día', () => {
    expect(puedeConfirmarseNueva(piscina('nueva', 50, '2027-03-10'), otras, LIMITES)).toBe(true)
  })

  it('el calendario las cuenta solo si el filtro de piscina está activo y nunca como sobrecupo', () => {
    expect(getRequestsForDay('2027-03-10', otras, ['cabana', 'camping', 'restaurante'])).toHaveLength(0)
    expect(getRequestsForDay('2027-03-10', otras, ['piscina'])).toHaveLength(2)
    expect(getDayOccupancy('2027-03-10', otras, ['piscina'], LIMITES).status).toBe('ocupado')
  })

  it('se filtra por tipo en la lista del administrador', () => {
    const lista = [...otras, { ...piscina('c', 2, '2027-03-11'), type: 'cabana' as const }]
    expect(filterRequests(lista, { type: 'piscina', status: null, query: '' } as any)).toHaveLength(2)
  })
})

describe('piscina — modelo de base de datos', () => {
  it('ida y vuelta por Booking conserva tipo, fecha de un día y total', () => {
    const req = piscina('a', 4, '2027-03-10', 12000)
    const reserva = requestToBooking(req)
    expect(reserva.type).toBe('piscina')
    expect(reserva.startDate).toBe('2027-03-10')
    expect(reserva.endDate).toBe('2027-03-10')
    expect(reserva.pricing.depositRequired).toBe(0)
    expect(reserva.meals).toEqual([])

    const vuelta = bookingToRequest(reserva)
    expect(vuelta.type).toBe('piscina')
    expect(vuelta.resourceName).toBe('Piscina')
    expect(vuelta.totalAmount).toBe(12000)
    expect(vuelta.details?.endDate).toBe('')
  })
})

describe('piscina — pasos del cliente', () => {
  it('tiene fecha, datos y confirmación', () => {
    expect(WIZARD_STEPS.piscina.map(p => p.label)).toEqual(['Fecha', 'Datos', 'Confirmar'])
  })
})
