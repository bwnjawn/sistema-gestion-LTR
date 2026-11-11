import { describe, expect, it } from 'vitest'
import { bookingToRequest, requestToBooking } from '../src/services/adaptadoresReserva'
import { normalizeRequest } from '../src/services/requests'
import type { ReservationRequest } from '../src/types/domain'

const CABANA = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
const SITIO = 'c2fecb99-9c0b-4ef8-bb6d-6bb9bd380a33'
const PLATO_A = 'e4fecb99-9c0b-4ef8-bb6d-6bb9bd380a55'
const PLATO_B = 'd9fecb99-9c0b-4ef8-bb6d-6bb9bd380b00'

const catalogo = {
  cabins: [{ id: CABANA, name: 'Cabaña 6' }],
  campingSites: [{ id: SITIO, name: 'Camping Zona General' }]
}

const pago = {
  id: 'p-1',
  amount: 10000,
  method: 'transferencia' as const,
  paidOn: '2026-12-01',
  createdAt: '2026-12-01T12:00:00.000Z'
}

function base(): ReservationRequest {
  return {
    id: 'r-1',
    requestCode: 'SOL-123',
    clientName: 'Ana Pérez',
    clientPhone: '+56912345678',
    clientEmail: 'ana@correo.cl',
    type: 'cabana',
    resourceName: 'Cabaña 6',
    date: '2026-12-10',
    timeOrDuration: '2026-12-13',
    guestsCount: 4,
    totalAmount: 232050,
    depositRequired: 69615,
    payments: [pago],
    status: 'pending',
    createdAt: '2026-12-01T10:00:00.000Z',
    depositDueAt: '2026-12-03T10:00:00.000Z',
    details: {
      comments: 'Llegamos tarde',
      resourceId: CABANA,
      startDate: '2026-12-10',
      endDate: '2026-12-13',
      selectedMeals: [],
      selectedMealTypes: [],
      mealTimes: {},
      schedule: { checkIn: '15:00', checkOut: '11:00' },
      origin: 'cliente',
      pricing: { subtotal: 195000, ivaAmount: 37050, ivaPercentage: 19, depositPercentage: 30, nights: 3 }
    }
  }
}

function restaurante(): ReservationRequest {
  return {
    ...base(),
    id: 'r-2',
    requestCode: 'ADM-4821',
    type: 'restaurante',
    resourceName: 'Restaurante',
    date: '2026-12-20',
    timeOrDuration: '1 día',
    guestsCount: 12,
    details: {
      comments: '',
      resourceId: '',
      startDate: '2026-12-20',
      endDate: '',
      clientType: 'Institución',
      selectedMealTypes: ['almuerzo', 'once'],
      mealTimes: { almuerzo: '13:00', once: '17:30' },
      origin: 'admin',
      selectedMeals: [
        { id: PLATO_A, name: 'Asado', price: 20000, quantity: 12, mealType: 'almuerzo', sides: { 'Papas': 7, 'Ensalada': 5 } },
        { id: PLATO_B, name: 'Once Campestre', price: 12000, quantity: 12, mealType: 'once', fixedSide: 'Sopaipillas', sides: {} }
      ],
      pricing: { subtotal: 384000, ivaAmount: 72960, ivaPercentage: 19, depositPercentage: 30, nights: 1 }
    }
  }
}

function campingDiario(): ReservationRequest {
  return {
    ...base(),
    id: 'r-3',
    type: 'camping',
    resourceName: 'Camping Zona General',
    date: '2026-12-15',
    timeOrDuration: '1 día',
    details: {
      comments: '',
      resourceId: SITIO,
      startDate: '2026-12-15',
      endDate: '',
      campingType: 'diario',
      selectedMeals: [],
      selectedMealTypes: [],
      mealTimes: {},
      origin: 'cliente',
      schedule: { checkIn: '09:00', checkOut: '19:30' },
      pricing: { subtotal: 40000, ivaAmount: 7600, ivaPercentage: 19, depositPercentage: 30, nights: 1 }
    }
  }
}

describe('requestToBooking: cabaña', () => {
  const b = requestToBooking(base())

  it('copia los datos propios y pasa el recurso a su columna', () => {
    expect(b).toMatchObject({
      id: 'r-1',
      code: 'SOL-123',
      origin: 'cliente',
      type: 'cabana',
      status: 'pending',
      cabinId: CABANA,
      startDate: '2026-12-10',
      endDate: '2026-12-13',
      guestsCount: 4,
      checkInTime: '15:00',
      checkOutTime: '11:00',
      comments: 'Llegamos tarde',
      depositDueAt: '2026-12-03T10:00:00.000Z',
      inConflict: false
    })
    expect(b.campingSiteId).toBeUndefined()
    expect(b.campingModality).toBeUndefined()
    expect(b.clientType).toBeUndefined()
    expect(b.meals).toEqual([])
  })

  it('el precio sale del desglose guardado y los pagos se copian', () => {
    expect(b.pricing).toEqual({
      subtotal: 195000,
      ivaPercentage: 19,
      ivaAmount: 37050,
      total: 232050,
      depositPercentage: 30,
      depositRequired: 69615
    })
    expect(b.payments).toEqual([pago])
    expect(b.payments[0]).not.toBe(pago)
  })
})

describe('requestToBooking: restaurante', () => {
  const b = requestToBooking(restaurante())

  it('agrupa los platos por comida con su hora, en el orden del día', () => {
    expect(b.meals.map(m => m.mealType)).toEqual(['almuerzo', 'once'])
    expect(b.meals[0].time).toBe('13:00')
    expect(b.meals[0].items).toEqual([
      { dishId: PLATO_A, name: 'Asado', unitPrice: 20000, quantity: 12, sides: { Papas: 7, Ensalada: 5 } }
    ])
    expect(b.meals[1].items[0]).toMatchObject({ fixedSide: 'Sopaipillas', sides: {} })
  })

  it('ocupa un solo día, guarda el tipo de cliente y no lleva recurso', () => {
    expect(b.endDate).toBe(b.startDate)
    expect(b.clientType).toBe('Institución')
    expect(b.cabinId).toBeUndefined()
    expect(b.origin).toBe('admin')
  })

  it('un plato antiguo sin comida toma la del catálogo', () => {
    const r = restaurante()
    delete r.details!.selectedMeals![1].mealType
    const conCatalogo = requestToBooking(r, { dishes: [{ id: PLATO_B, mealType: 'once' }] })
    expect(conCatalogo.meals[1].items).toHaveLength(1)
    // Sin catálogo cae en la primera comida elegida
    const sinCatalogo = requestToBooking(r)
    expect(sinCatalogo.meals[0].items).toHaveLength(2)
  })

  it('una comida con platos que no figuraba entre las elegidas igual se guarda', () => {
    const r = restaurante()
    r.details!.selectedMealTypes = ['almuerzo']
    delete r.details!.mealTimes!.once
    const res = requestToBooking(r)
    expect(res.meals.map(m => m.mealType)).toEqual(['almuerzo', 'once'])
    expect(res.meals[1].time).toBe('')
  })
})

describe('requestToBooking: camping y casos antiguos', () => {
  it('camping de día: modalidad, sitio y un solo día', () => {
    const b = requestToBooking(campingDiario())
    expect(b).toMatchObject({ campingSiteId: SITIO, campingModality: 'diario', startDate: '2026-12-15', endDate: '2026-12-15' })
  })

  it('camping sin modalidad guardada cuenta como pernoctar', () => {
    const r = campingDiario()
    delete r.details!.campingType
    r.details!.endDate = '2026-12-17'
    const b = requestToBooking(r)
    expect(b.campingModality).toBe('pernoctar')
    expect(b.endDate).toBe('2026-12-17')
  })

  it('una solicitud sin desglose de precio no inventa el IVA', () => {
    const r = base()
    delete r.details!.pricing
    const b = requestToBooking(r)
    expect(b.pricing).toMatchObject({ subtotal: 232050, ivaAmount: 0, ivaPercentage: 0, total: 232050, depositPercentage: 30 })
  })

  it('el origen sale del código si los datos no lo dicen', () => {
    const r = base()
    delete r.details!.origin
    r.requestCode = 'ADM-1001'
    expect(requestToBooking(r).origin).toBe('admin')
  })

  it('una solicitud con formato antiguo se adapta tras normalizarla', () => {
    const antigua = normalizeRequest({
      id: 'x',
      requestCode: 'SOL-555',
      clientName: 'A',
      clientPhone: '+56911111111',
      type: 'cabaña',
      status: 'confirmada',
      resourceName: 'Cabaña 6',
      date: '2026-12-01',
      timeOrDuration: '2026-12-03',
      guestsCount: 2,
      totalAmount: 100,
      depositAmount: 30,
      createdAt: '2026-11-01T00:00:00.000Z',
      details: { resourceId: CABANA }
    })
    const b = requestToBooking(antigua)
    expect(b).toMatchObject({ type: 'cabana', status: 'confirmed', startDate: '2026-12-01', endDate: '2026-12-03', cabinId: CABANA })
    expect(b.pricing.depositRequired).toBe(30)
  })
})

describe('ida y vuelta (ReservationRequest → Booking → ReservationRequest)', () => {
  it('la cabaña vuelve igual', () => {
    const r = base()
    expect(bookingToRequest(requestToBooking(r), catalogo)).toEqual(r)
  })

  it('el restaurante vuelve igual, con sus platos y horas', () => {
    const r = restaurante()
    const vuelta = bookingToRequest(requestToBooking(r), catalogo)
    expect(vuelta).toEqual(r)
  })

  it('el camping de día vuelve igual', () => {
    const r = campingDiario()
    expect(bookingToRequest(requestToBooking(r), catalogo)).toEqual(r)
  })

  it('el camping de varias noches vuelve igual', () => {
    const r = campingDiario()
    r.details!.campingType = 'pernoctar'
    r.details!.endDate = '2026-12-17'
    r.timeOrDuration = '2026-12-17'
    r.details!.pricing!.nights = 2
    expect(bookingToRequest(requestToBooking(r), catalogo)).toEqual(r)
  })

  it('el nombre del recurso sale del catálogo; sin catálogo, un nombre genérico', () => {
    const b = requestToBooking(base())
    expect(bookingToRequest(b, catalogo).resourceName).toBe('Cabaña 6')
    expect(bookingToRequest(b).resourceName).toBe('Cabaña')
  })

  it('un correo vacío no genera clientEmail en Booking y vuelve como texto vacío', () => {
    const r = base()
    r.clientEmail = ''
    const b = requestToBooking(r)
    expect(b.clientEmail).toBeUndefined()
    expect(bookingToRequest(b, catalogo).clientEmail).toBe('')
  })

  it('no modifica los objetos que recibe', () => {
    const r = restaurante()
    const copia = JSON.parse(JSON.stringify(r))
    const b = requestToBooking(r)
    const copiaB = JSON.parse(JSON.stringify(b))
    bookingToRequest(b, catalogo)
    expect(r).toEqual(copia)
    expect(b).toEqual(copiaB)
  })
})
