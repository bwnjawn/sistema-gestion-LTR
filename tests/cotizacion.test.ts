import { describe, expect, it } from 'vitest'
import {
  buildAsuntoCotizacion,
  buildCotizacion,
  buildMensajeCotizacion,
  nombreArchivoCotizacion,
  puedeCotizarse
} from '../src/services/cotizacion'
import type { BusinessInfo, ReservationRequest, TransferInfo } from '../src/types/domain'

const NEGOCIO = { phone1: '+56 9 1111 2222', email: 'hola@troncos.cl' } as BusinessInfo
const TRANSFERENCIA = { bank: 'Banco Estado', accountNumber: '123' } as TransferInfo
const CTX = { negocio: NEGOCIO, transferencia: TRANSFERENCIA, ivaVigente: 19, hoy: '2027-03-01' }

function base(parcial: Partial<ReservationRequest>): ReservationRequest {
  return {
    id: 'a1',
    requestCode: 'SOL-AB12CD',
    clientName: 'Colegio San Pedro',
    clientPhone: '+56 9 1234 5678',
    type: 'cabana',
    resourceName: 'Cabaña 1',
    date: '2027-03-10',
    guestsCount: 4,
    totalAmount: 357000,
    depositRequired: 107100,
    payments: [],
    status: 'pending',
    createdAt: '2027-03-01T12:00:00.000Z',
    ...parcial
  }
}

describe('cotización — qué se puede cotizar', () => {
  it('solo pendientes y confirmadas', () => {
    expect(puedeCotizarse({ status: 'pending' })).toBe(true)
    expect(puedeCotizarse({ status: 'confirmed' })).toBe(true)
    expect(puedeCotizarse({ status: 'rejected' })).toBe(false)
    expect(puedeCotizarse({ status: 'cancelled' })).toBe(false)
  })
})

describe('cotización — cabaña', () => {
  const req = base({
    details: {
      startDate: '2027-03-10',
      endDate: '2027-03-13',
      pricing: { subtotal: 300000, ivaAmount: 57000, ivaPercentage: 19, depositPercentage: 30, nights: 3 }
    }
  })

  it('una línea con noches y precio por noche, y los totales guardados', () => {
    const c = buildCotizacion(req, CTX)
    expect(c.secciones).toHaveLength(1)
    expect(c.secciones[0].lineas[0]).toMatchObject({ concepto: 'Cabaña 1', cantidad: 3, precioUnitario: 100000, total: 300000 })
    expect(c.subtotal).toBe(300000)
    expect(c.iva).toBe(57000)
    expect(c.total).toBe(357000)
    expect(c.abono).toBe(107100)
    expect(c.codigo).toBe('SOL-AB12CD')
  })

  it('incluye los datos de transferencia solo si hay abono', () => {
    expect(buildCotizacion(req, CTX).transferencia).toEqual(TRANSFERENCIA)
    expect(buildCotizacion({ ...req, depositRequired: 0 }, CTX).transferencia).toBeUndefined()
  })
})

describe('cotización — camping', () => {
  it('pernoctar: personas × noches', () => {
    const req = base({
      type: 'camping',
      resourceName: 'Espacio 2',
      guestsCount: 5,
      totalAmount: 119000,
      details: {
        startDate: '2027-03-10',
        endDate: '2027-03-12',
        campingType: 'pernoctar',
        pricing: { subtotal: 100000, ivaAmount: 19000, ivaPercentage: 19, depositPercentage: 30, nights: 2 }
      }
    })
    const linea = buildCotizacion(req, CTX).secciones[0].lineas[0]
    expect(linea).toMatchObject({ cantidad: 10, precioUnitario: 10000, total: 100000 })
    expect(linea.detalle).toBe('5 personas x 2 noches')
  })

  it('de día: solo personas', () => {
    const req = base({
      type: 'camping',
      resourceName: 'Espacio 2',
      guestsCount: 5,
      totalAmount: 59500,
      details: {
        startDate: '2027-03-10',
        campingType: 'diario',
        pricing: { subtotal: 50000, ivaAmount: 9500, ivaPercentage: 19, depositPercentage: 30, nights: 1 }
      }
    })
    const linea = buildCotizacion(req, CTX).secciones[0].lineas[0]
    expect(linea).toMatchObject({ cantidad: 5, precioUnitario: 10000, total: 50000 })
  })
})

describe('cotización — restaurante', () => {
  const req = base({
    type: 'restaurante',
    resourceName: 'Restaurante',
    guestsCount: 20,
    totalAmount: 238000,
    depositRequired: 0,
    details: {
      clientType: 'Institución',
      startDate: '2027-03-10',
      mealTimes: { almuerzo: '13:30', desayuno: '09:00' },
      pricing: { subtotal: 200000, ivaAmount: 38000, ivaPercentage: 19, depositPercentage: 30, nights: 1 },
      selectedMeals: [
        { id: '1', name: 'Pollo asado', price: 8000, quantity: 20, mealType: 'almuerzo', sides: { 'Papas fritas': 12, Ensalada: 8 } },
        { id: '2', name: 'Desayuno campesino', price: 2000, quantity: 20, mealType: 'desayuno' }
      ]
    }
  })

  it('una sección por comida, en orden, con hora y acompañamientos', () => {
    const c = buildCotizacion(req, CTX)
    expect(c.secciones.map(s => s.titulo)).toEqual(['Desayuno · 09:00 hrs', 'Almuerzo · 13:30 hrs'])
    expect(c.secciones[1].lineas[0]).toMatchObject({ concepto: 'Pollo asado', cantidad: 20, precioUnitario: 8000, total: 160000 })
    expect(c.secciones[1].lineas[0].detalle).toBe('Papas fritas x12, Ensalada x8')
  })

  it('las líneas suman el subtotal', () => {
    const c = buildCotizacion(req, CTX)
    const suma = c.secciones.flatMap(s => s.lineas).reduce((a, l) => a + l.total, 0)
    expect(suma).toBe(c.subtotal)
  })

  it('un cliente sin abono (Institución) no lleva datos de transferencia', () => {
    const c = buildCotizacion(req, CTX)
    expect(c.abono).toBe(0)
    expect(c.transferencia).toBeUndefined()
  })
})

describe('cotización — piscina', () => {
  it('sin IVA aparte: el total es el valor final', () => {
    const req = base({
      type: 'piscina',
      resourceName: 'Piscina',
      guestsCount: 4,
      totalAmount: 12000,
      depositRequired: 0,
      details: { startDate: '2027-03-10', pricing: { subtotal: 12000, ivaAmount: 0, ivaPercentage: 0, depositPercentage: 0, nights: 1 } }
    })
    const c = buildCotizacion(req, CTX)
    expect(c.ivaPorcentaje).toBe(0)
    expect(c.iva).toBe(0)
    expect(c.total).toBe(12000)
    expect(c.secciones[0].lineas[0]).toMatchObject({ concepto: 'Entrada a la piscina', cantidad: 4, precioUnitario: 3000 })
  })
})

describe('cotización — solicitud antigua sin desglose', () => {
  it('deduce el subtotal con el IVA vigente', () => {
    const c = buildCotizacion(base({ totalAmount: 119000, details: { startDate: '2027-03-10', endDate: '2027-03-11' } }), CTX)
    expect(c.subtotal).toBe(100000)
    expect(c.iva).toBe(19000)
  })
})

describe('cotización — envío', () => {
  const req = base({})

  it('el nombre del archivo es seguro', () => {
    expect(nombreArchivoCotizacion('SOL-AB12CD')).toBe('Cotizacion-SOL-AB12CD.pdf')
    expect(nombreArchivoCotizacion(' ../x y ')).toBe('Cotizacion-x-y.pdf')
    expect(nombreArchivoCotizacion('')).toBe('Cotizacion-solicitud.pdf')
  })

  it('el mensaje nombra al cliente, el código y el total', () => {
    const msg = buildMensajeCotizacion(req)
    expect(msg).toContain('Colegio San Pedro')
    expect(msg).toContain('SOL-AB12CD')
    expect(msg).toContain('357.000')
    expect(buildAsuntoCotizacion(req)).toBe('Cotización SOL-AB12CD - Los Troncos de Repil')
  })
})
