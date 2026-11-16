import { describe, expect, it } from 'vitest'
import {
  getDayOccupancy,
  getDetalleDia,
  getResumenDia,
  reservasDeFranja,
  getRequestsForDay,
  getWeekDates,
  getWeekStart,
  requestOccupiesDay
} from '../src/services/availability'
import type { Cabin, ReservationRequest, ServiceType } from '../src/types/domain'

function solicitud(datos: Partial<ReservationRequest>): ReservationRequest {
  return {
    id: 'r1',
    type: 'cabana',
    status: 'confirmed',
    date: '2026-11-13',
    timeOrDuration: '2026-11-15',
    details: { startDate: '2026-11-13', endDate: '2026-11-15' },
    ...datos
  } as ReservationRequest
}

describe('calendario del administrador', () => {
  it('la semana empieza en lunes y el domingo pertenece a la semana que termina en él', () => {
    // 2026-11-08 es domingo
    expect(getWeekStart('2026-11-08')).toBe('2026-11-02')
    expect(getWeekStart('2026-11-09')).toBe('2026-11-09')
    const semana = getWeekDates('2026-11-08')
    expect(semana).toHaveLength(7)
    expect(semana[0]).toBe('2026-11-02')
    expect(semana[6]).toBe('2026-11-08')
  })

  it('el día de salida no cuenta como ocupado', () => {
    const r = solicitud({})
    expect(requestOccupiesDay(r, '2026-11-13')).toBe(true)
    expect(requestOccupiesDay(r, '2026-11-14')).toBe(true)
    expect(requestOccupiesDay(r, '2026-11-15')).toBe(false)
  })

  it('el restaurante ocupa solo su día aunque guarde una hora', () => {
    const r = solicitud({
      type: 'restaurante',
      date: '2026-11-13',
      timeOrDuration: '13:00',
      details: undefined
    })
    expect(requestOccupiesDay(r, '2026-11-13')).toBe(true)
    expect(requestOccupiesDay(r, '2026-11-14')).toBe(false)
  })

  it('las rechazadas y canceladas no ocupan el calendario', () => {
    const lista = [
      solicitud({ id: 'a', status: 'rejected' }),
      solicitud({ id: 'b', status: 'cancelled' }),
      solicitud({ id: 'c', status: 'pending' })
    ]
    expect(getRequestsForDay('2026-11-13', lista).map(r => r.id)).toEqual(['c'])
    expect(getDayOccupancy('2026-11-13', lista).pendingCount).toBe(1)
  })

  it('la ocupación respeta el filtro por servicio', () => {
    const lista = [solicitud({ type: 'cabana' })]
    expect(getDayOccupancy('2026-11-13', lista, ['camping']).status).toBe('disponible')
    expect(getDayOccupancy('2026-11-13', lista, ['cabana']).status).toBe('ocupado')
    expect(getDayOccupancy('2026-11-15', lista).status).toBe('disponible')
  })
})


// SCRUM-267: disponibilidad real por servicio
const LIMITES = { restaurantePersonas: 200, campingPersonas: 150 }

function cabana(id: string, enMantencion = false): Cabin {
  return { id, name: id, capacity: 6, pricePerNight: 1, isActive: true, enMantencion } as Cabin
}

const CABANAS = [cabana('c1'), cabana('c2')]
const CTX = { cabins: CABANAS, limites: LIMITES }

function enCabana(id: string, recurso: string, status: ReservationRequest['status'] = 'confirmed') {
  return solicitud({ id, status, details: { startDate: '2026-11-13', endDate: '2026-11-15', resourceId: recurso } })
}

function enRestaurante(id: string, personas: number, comidas: string[], status: ReservationRequest['status'] = 'confirmed') {
  return solicitud({
    id,
    type: 'restaurante',
    status,
    guestsCount: personas,
    timeOrDuration: '13:00',
    details: { startDate: '2026-11-13', selectedMealTypes: comidas }
  })
}

function enCamping(id: string, personas: number, campingType: 'diario' | 'pernoctar', status: ReservationRequest['status'] = 'confirmed') {
  return solicitud({
    id,
    type: 'camping',
    status,
    guestsCount: personas,
    timeOrDuration: '2026-11-14',
    details: { startDate: '2026-11-13', endDate: '2026-11-14', campingType }
  })
}

const detalle = (dia: string, lista: ReservationRequest[], servicio: ServiceType) =>
  getDetalleDia(dia, lista, [servicio], CTX)

describe('disponibilidad real por servicio (SCRUM-267)', () => {
  it('con una cabaña ocupada y otra libre el día es parcial, no completo', () => {
    expect(detalle('2026-11-13', [enCabana('a', 'c1')], 'cabana')[0]).toMatchObject({ estado: 'parcial', ocupado: 1, capacidad: 2 })
    const lleno = detalle('2026-11-13', [enCabana('a', 'c1'), enCabana('b', 'c2')], 'cabana')
    expect(lleno[0].estado).toBe('completo')
  })

  it('una cabaña en mantención se descuenta del total', () => {
    const ctx = { cabins: [cabana('c1'), cabana('c2', true)], limites: LIMITES }
    const d = getDetalleDia('2026-11-13', [enCabana('a', 'c1')], ['cabana'], ctx)
    expect(d[0]).toMatchObject({ estado: 'completo', ocupado: 1, capacidad: 1 })
  })

  it('el día de salida de una cabaña queda libre', () => {
    expect(detalle('2026-11-15', [enCabana('a', 'c1')], 'cabana')[0].estado).toBe('libre')
  })

  it('un día con solo pendientes se ve libre y cuenta las pendientes aparte', () => {
    expect(detalle('2026-11-13', [enCabana('a', 'c1', 'pending')], 'cabana')[0])
      .toMatchObject({ estado: 'libre', ocupado: 0, pendientes: 1 })
  })

  it('dos reservas de la misma cabaña se marcan como que se topan', () => {
    const lista = [enCabana('a', 'c1'), enCabana('b', 'c1', 'pending')]
    expect(detalle('2026-11-13', lista, 'cabana')[0].estado).toBe('sobrecupo')
  })

  it('el restaurante da tres franjas, una por comida', () => {
    const lista = [enRestaurante('a', 200, ['almuerzo']), enRestaurante('b', 40, ['desayuno'])]
    expect(detalle('2026-11-13', lista, 'restaurante').map(f => [f.clave, f.estado])).toEqual([
      ['desayuno', 'parcial'],
      ['almuerzo', 'completo'],
      ['once', 'libre']
    ])
  })

  it('el restaurante sobrepasado por la demanda se marca como que se topa', () => {
    const lista = [enRestaurante('a', 150, ['almuerzo']), enRestaurante('b', 100, ['almuerzo'], 'pending')]
    expect(detalle('2026-11-13', lista, 'restaurante').find(f => f.clave === 'almuerzo')?.estado).toBe('sobrecupo')
  })

  it('el camping separa diario y pernoctar y no los suma', () => {
    const lista = [enCamping('a', 150, 'diario'), enCamping('b', 20, 'pernoctar')]
    expect(detalle('2026-11-13', lista, 'camping').map(f => [f.clave, f.estado, f.ocupado])).toEqual([
      ['diario', 'completo', 150],
      ['pernoctar', 'parcial', 20]
    ])
  })

  it('el detalle de todos los servicios trae una fila por cabañas, comida, modalidad y piscina', () => {
    const filas = getDetalleDia('2026-11-13', [], undefined, CTX)
    expect(filas.map(f => `${f.servicio}:${f.etiqueta}`)).toEqual([
      'cabana:Cabañas',
      'restaurante:Desayuno',
      'restaurante:Almuerzo',
      'restaurante:Once',
      'camping:Diario',
      'camping:Pernoctar',
      'piscina:Piscina'
    ])
  })

  it('cada franja entrega solo las reservas que le tocan', () => {
    const lista = [
      enRestaurante('a', 20, ['desayuno', 'almuerzo']),
      enRestaurante('b', 30, ['once']),
      enCamping('c', 10, 'diario'),
      enCamping('d', 5, 'pernoctar')
    ]
    const ids = (servicio: ServiceType, clave: string) => {
      const franja = getDetalleDia('2026-11-13', lista, [servicio], CTX).find(f => f.clave === clave)!
      return reservasDeFranja(franja, getRequestsForDay('2026-11-13', lista, [servicio])).map(r => r.id)
    }
    expect(ids('restaurante', 'almuerzo')).toEqual(['a'])
    expect(ids('restaurante', 'once')).toEqual(['b'])
    expect(ids('camping', 'diario')).toEqual(['c'])
    expect(ids('camping', 'pernoctar')).toEqual(['d'])
  })
})

describe('resumen del día para la casilla (SCRUM-267)', () => {
  const resumen = (lista: ReservationRequest[], servicios?: ServiceType[]) =>
    getResumenDia('2026-11-13', lista, servicios, CTX)

  it('el número cuenta reservas confirmadas y no suma las pendientes', () => {
    const lista = [enCabana('a', 'c1'), enCabana('b', 'c2', 'pending'), enRestaurante('c', 10, ['almuerzo'])]
    expect(resumen(lista)).toMatchObject({ confirmadas: 2, hayPorResolver: true, lleno: false })
  })

  it('un día sin reservas no muestra nada', () => {
    expect(resumen([])).toEqual({ confirmadas: 0, hayPorResolver: false, lleno: false })
  })

  it('un día con solo pendientes tiene aviso pero no número ni lleno', () => {
    expect(resumen([enCabana('a', 'c1', 'pending')])).toEqual({ confirmadas: 0, hayPorResolver: true, lleno: false })
  })

  it('rechazadas y canceladas no cuentan ni avisan', () => {
    const lista = [enCabana('a', 'c1', 'rejected'), enRestaurante('b', 50, ['almuerzo'], 'cancelled')]
    expect(resumen(lista)).toEqual({ confirmadas: 0, hayPorResolver: false, lleno: false })
  })

  it('la misma cabaña con dos reservas avisa que hay algo por resolver', () => {
    expect(resumen([enCabana('a', 'c1'), enCabana('b', 'c1', 'pending')], ['cabana']).hayPorResolver).toBe(true)
  })

  it('con solo cabañas, está lleno cuando todas las reservables están confirmadas', () => {
    expect(resumen([enCabana('a', 'c1')], ['cabana']).lleno).toBe(false)
    expect(resumen([enCabana('a', 'c1'), enCabana('b', 'c2')], ['cabana']).lleno).toBe(true)
  })

  it('con solo restaurante, está lleno solo si las tres comidas están llenas', () => {
    expect(resumen([enRestaurante('a', 200, ['almuerzo'])], ['restaurante']).lleno).toBe(false)
    expect(resumen([enRestaurante('a', 200, ['desayuno', 'almuerzo', 'once'])], ['restaurante']).lleno).toBe(true)
  })

  it('con solo camping, está lleno si diario y pernoctar están llenos', () => {
    expect(resumen([enCamping('a', 150, 'diario')], ['camping']).lleno).toBe(false)
    expect(resumen([enCamping('a', 150, 'diario'), enCamping('b', 150, 'pernoctar')], ['camping']).lleno).toBe(true)
  })

  it('en "Todo" un servicio lleno no basta: deben estar llenos todos los que tienen tope', () => {
    const cabanasLlenas = [enCabana('a', 'c1'), enCabana('b', 'c2')]
    expect(resumen(cabanasLlenas).lleno).toBe(false)
    const todoLleno = [
      ...cabanasLlenas,
      enRestaurante('c', 200, ['desayuno', 'almuerzo', 'once']),
      enCamping('d', 150, 'diario'),
      enCamping('e', 150, 'pernoctar')
    ]
    expect(resumen(todoLleno).lleno).toBe(true)
  })

  it('la piscina no cuenta en "Todo", pero sí cuando es el único servicio, y nunca se llena', () => {
    const piscina = solicitud({ id: 'p', type: 'piscina', guestsCount: 300, timeOrDuration: '', details: { startDate: '2026-11-13' } })
    expect(resumen([piscina])).toEqual({ confirmadas: 0, hayPorResolver: false, lleno: false })
    expect(resumen([piscina], ['piscina'])).toEqual({ confirmadas: 1, hayPorResolver: false, lleno: false })
  })
})
