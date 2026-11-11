import { describe, expect, it } from 'vitest'
import {
  buildRequestFromDraft,
  generateRequestCode,
  type BorradorSolicitud,
  type ContextoSolicitud
} from '../src/services/requests'

const borrador: BorradorSolicitud = {
  service: 'cabana',
  checkInDate: '2026-12-10',
  checkOutDate: '2026-12-12',
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
}

const contexto: ContextoSolicitud = {
  origin: 'cliente',
  requestCode: 'SOL-123',
  price: { subtotal: 100000, ivaAmount: 19000, totalWithIva: 119000, depositAmount: 35700, nights: 2 },
  ivaPercentage: 19,
  depositPercentage: 30,
  today: '2026-11-10'
}

describe('generateRequestCode', () => {
  it('usa SOL para el cliente y ADM para el administrador', () => {
    expect(generateRequestCode([], 'cliente')).toMatch(/^SOL-\d{3}$/)
    expect(generateRequestCode([], 'admin')).toMatch(/^ADM-\d{3}$/)
  })

  it('no repite un código existente', () => {
    // El azar siempre da 100, luego 101: el primero ya existe
    const valores = [0, 0.002]
    const codigo = generateRequestCode(['SOL-100'], 'cliente', () => valores.shift() ?? 0.5)
    expect(codigo).toBe('SOL-101')
  })

  it('pasa a 4 cifras si los de 3 cifras chocan siempre', () => {
    expect(generateRequestCode(['SOL-100'], 'cliente', () => 0)).toBe('SOL-1000')
  })
})

describe('buildRequestFromDraft', () => {
  it('toma los montos del precio calculado y no registra pagos', () => {
    const r = buildRequestFromDraft(borrador, contexto)
    expect(r.totalAmount).toBe(119000)
    expect(r.depositRequired).toBe(35700)
    expect(r.payments).toEqual([])
    expect(r.requestCode).toBe('SOL-123')
    expect(r.details?.origin).toBe('cliente')
    expect(r.details?.pricing?.nights).toBe(2)
  })

  it('la reserva del administrador marca el origen y el evento especial', () => {
    const r = buildRequestFromDraft(
      { ...borrador, isSpecialEvent: true },
      { ...contexto, origin: 'admin', requestCode: 'ADM-456' }
    )
    expect(r.details?.origin).toBe('admin')
    expect(r.details?.isSpecialEvent).toBe(true)
  })

  it('sin evento especial no deja la marca', () => {
    const r = buildRequestFromDraft(borrador, contexto)
    expect(r.details?.isSpecialEvent).toBeUndefined()
  })

  it('completa los datos que faltan', () => {
    const r = buildRequestFromDraft(
      { ...borrador, clientName: '', clientPhone: '', checkInDate: '', checkOutDate: '' },
      contexto
    )
    expect(r.clientName).toBe('Cliente Web')
    expect(r.date).toBe('2026-11-10')
    expect(r.timeOrDuration).toBe('1 día')
  })

  it('el cliente de restaurante guarda su categoría; las cabañas no', () => {
    expect(buildRequestFromDraft(borrador, contexto).details?.clientType).toBeUndefined()
    const rest = buildRequestFromDraft({ ...borrador, service: 'restaurante', clientType: 'Paseo escolar' }, contexto)
    expect(rest.details?.clientType).toBe('Paseo escolar')
  })
})
