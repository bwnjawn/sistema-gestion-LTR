import { describe, expect, it } from 'vitest'
import {
  construirHojas,
  hojaRegistros,
  hojaResumenPorEstado,
  hojaResumenPorMes,
  hojaResumenPorServicio,
  nombreArchivoExcel
} from '../src/services/exportacion'
import type { BookingStatus, ReservationRequest, ServiceType } from '../src/types/domain'

function solicitud(
  id: string,
  tipo: ServiceType,
  estado: BookingStatus,
  inicio: string,
  total: number,
  extra: Partial<ReservationRequest> = {}
): ReservationRequest {
  return {
    id,
    requestCode: `SOL-${id}`,
    clientName: `Cliente ${id}`,
    clientPhone: '+56 9 1234 5678',
    type: tipo,
    resourceName: tipo === 'cabana' ? 'Cabaña 1' : 'Recurso',
    date: inicio,
    guestsCount: 4,
    totalAmount: total,
    depositRequired: Math.round(total * 0.3),
    payments: [],
    status: estado,
    createdAt: '2026-11-01T15:00:00.000Z',
    details: { startDate: inicio },
    ...extra
  }
}

const IVA = 19
const lista: ReservationRequest[] = [
  solicitud('b', 'cabana', 'confirmed', '2027-03-10', 119000, {
    details: { startDate: '2027-03-10', endDate: '2027-03-12', clientType: 'Particular' },
    payments: [{ id: 'p', amount: 35700, method: 'transferencia', paidOn: '2026-11-02', createdAt: '2026-11-02T10:00:00.000Z' }]
  }),
  solicitud('a', 'restaurante', 'pending', '2026-12-05', 238000),
  solicitud('c', 'camping', 'rejected', '2027-03-20', 50000),
  solicitud('d', 'piscina', 'confirmed', '2027-01-15', 12000, { depositRequired: 0 }),
  solicitud('e', 'cabana', 'confirmed', '2027-03-25', 238000)
]

describe('exportación — hoja de registros', () => {
  const hoja = hojaRegistros(lista, IVA)
  const col = (titulo: string) => hoja.columnas.findIndex(c => c.titulo === titulo)

  it('una fila por solicitud, con filtros en los encabezados', () => {
    expect(hoja.filas).toHaveLength(5)
    expect(hoja.conFiltros).toBe(true)
    expect(hoja.filas.every(f => f.length === hoja.columnas.length)).toBe(true)
  })

  it('ordena por fecha del evento, de la más próxima a la más lejana', () => {
    expect(hoja.filas.map(f => f[col('Código')])).toEqual(['SOL-a', 'SOL-d', 'SOL-b', 'SOL-c', 'SOL-e'])
  })

  it('año y mes salen de la fecha del evento, no de la de creación', () => {
    const fila = hoja.filas.find(f => f[col('Código')] === 'SOL-b')!
    expect(fila[col('Año')]).toBe(2027)
    expect(fila[col('Mes')]).toBe(3)
    expect(fila[col('Nombre del mes')]).toBe('Marzo')
  })

  it('las fechas van a medianoche UTC para que Excel no las corra de día', () => {
    const fila = hoja.filas.find(f => f[col('Código')] === 'SOL-b')!
    expect((fila[col('Inicio')] as Date).toISOString()).toBe('2027-03-10T00:00:00.000Z')
    expect((fila[col('Fin')] as Date).toISOString()).toBe('2027-03-12T00:00:00.000Z')
    expect(fila[col('Noches')]).toBe(2)
  })

  it('una visita de un día no tiene fin ni noches', () => {
    const fila = hoja.filas.find(f => f[col('Código')] === 'SOL-a')!
    expect(fila[col('Fin')]).toBeNull()
    expect(fila[col('Noches')]).toBe(0)
  })

  it('montos: IVA desglosado, pagado y saldo', () => {
    const fila = hoja.filas.find(f => f[col('Código')] === 'SOL-b')!
    expect(fila[col('Subtotal')]).toBe(100000)
    expect(fila[col('IVA')]).toBe(19000)
    expect(fila[col('Total con IVA')]).toBe(119000)
    expect(fila[col('Pagado')]).toBe(35700)
    expect(fila[col('Saldo')]).toBe(83300)
  })

  it('la piscina no lleva IVA aparte', () => {
    const fila = hoja.filas.find(f => f[col('Código')] === 'SOL-d')!
    expect(fila[col('IVA')]).toBe(0)
    expect(fila[col('Subtotal')]).toBe(12000)
  })

  it('una solicitud sin fecha queda al final, sin año ni mes', () => {
    const sin = solicitud('z', 'cabana', 'pending', '', 1000, { date: '', details: {} })
    const h = hojaRegistros([sin, ...lista], IVA)
    const ultima = h.filas[h.filas.length - 1]
    expect(ultima[col('Código')]).toBe('SOL-z')
    expect(ultima[col('Año')]).toBeNull()
  })
})

describe('exportación — resumen por mes', () => {
  const hoja = hojaResumenPorMes(lista)
  const fila = (anio: number | null, mes: number | null) => hoja.filas.find(f => f[0] === anio && f[1] === mes)!

  it('un renglón por mes, en orden cronológico, y al final el total', () => {
    expect(hoja.filas.map(f => f[2])).toEqual(['Diciembre', 'Enero', 'Marzo', 'Total'])
    expect(hoja.filaTotal).toBe(true)
  })

  it('cuenta por estado y suma solo el dinero de las confirmadas y pendientes', () => {
    // Marzo 2027: confirmadas b y e, rechazada c
    const marzo = fila(2027, 3)
    expect(marzo.slice(3, 7)).toEqual([3, 2, 0, 1])
    expect(marzo[7]).toBe(119000 + 238000) // monto confirmado
    expect(marzo[8]).toBe(0) // monto pendiente
    expect(marzo[9]).toBe(35700) // pagado
  })

  it('reparte el monto confirmado por servicio', () => {
    const marzo = fila(2027, 3)
    const titulos = hoja.columnas.map(c => c.titulo)
    expect(marzo[titulos.indexOf('Confirmado en cabaña')]).toBe(357000)
    expect(marzo[titulos.indexOf('Confirmado en camping')]).toBe(0)
  })

  it('la fila de totales suma todas las solicitudes', () => {
    const total = hoja.filas[hoja.filas.length - 1]
    // Año y mes no se suman
    expect(total.slice(0, 3)).toEqual([null, null, 'Total'])
    expect(total[3]).toBe(5)
    expect(total[7]).toBe(119000 + 12000 + 238000)
    expect(total[8]).toBe(238000)
  })
})

describe('exportación — resumen por servicio y por estado', () => {
  it('por servicio: una fila por servicio más el total', () => {
    const hoja = hojaResumenPorServicio(lista)
    expect(hoja.filas.map(f => f[0])).toEqual(['Cabaña', 'Camping', 'Restaurante', 'Piscina', 'Total'])
    expect(hoja.filas[0].slice(1, 5)).toEqual([2, 2, 0, 0])
    expect(hoja.filas[1].slice(1, 5)).toEqual([1, 0, 0, 1])
  })

  it('por estado: rechazada y cancelada van separadas', () => {
    const hoja = hojaResumenPorEstado([...lista, solicitud('f', 'camping', 'cancelled', '2027-04-01', 1000)])
    expect(hoja.filas.map(f => f[0])).toEqual(['Pendiente', 'Confirmada', 'Rechazada', 'Cancelada', 'Total'])
    expect(hoja.filas.map(f => f[1])).toEqual([1, 3, 1, 1, 6])
  })
})

describe('exportación — libro completo', () => {
  it('registros primero y luego los tres resúmenes', () => {
    expect(construirHojas(lista, IVA).map(h => h.nombre)).toEqual([
      'Registros', 'Resumen por mes', 'Resumen por servicio', 'Resumen por estado'
    ])
  })

  it('sin solicitudes no falla', () => {
    const hojas = construirHojas([], IVA)
    expect(hojas[0].filas).toHaveLength(0)
    expect(hojas[1].filas).toHaveLength(1) // solo el total
  })

  it('el nombre del archivo lleva la fecha y marca las filtradas', () => {
    expect(nombreArchivoExcel(false, '2026-11-18')).toBe('Solicitudes-Los-Troncos-2026-11-18.xlsx')
    expect(nombreArchivoExcel(true, '2026-11-18')).toBe('Solicitudes-Los-Troncos-2026-11-18-filtradas.xlsx')
  })
})
