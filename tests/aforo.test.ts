import { describe, expect, it } from 'vitest'
import {
  getDayOccupancy,
  getFullMeals,
  getRestaurantCapacity,
  isCabinNightBlocked,
  isCabinStayBlocked,
  isCampingDayBlocked,
  isCampingStayBlocked,
  isRestaurantDayBlocked
} from '../src/services/availability'
import type { Cabin, ReservationRequest } from '../src/types/domain'

const LIMITES = { restaurantePersonas: 200, campingPersonas: 150 }

function almuerzo(personas: number, id: string, comidas = ['almuerzo']): ReservationRequest {
  return {
    id,
    type: 'restaurante',
    status: 'confirmed',
    date: '2026-11-14',
    guestsCount: personas,
    details: { startDate: '2026-11-14', selectedMealTypes: comidas }
  } as ReservationRequest
}

describe('aforo configurable', () => {
  it('la capacidad del restaurante es la suma de sus espacios', () => {
    const espacios = [
      { id: 'a', nombre: 'Comedor principal', capacidad: 120 },
      { id: 'b', nombre: 'Carpa', capacidad: 50 },
      { id: 'c', nombre: 'Comedor secundario', capacidad: 30 }
    ]
    expect(getRestaurantCapacity(espacios)).toBe(200)
  })

  it('no hay sobrecupo mientras las personas de una comida no superen el aforo', () => {
    const lista = [almuerzo(120, 'a'), almuerzo(80, 'b')]
    expect(getDayOccupancy('2026-11-14', lista, undefined, LIMITES).status).toBe('ocupado')
  })

  it('hay sobrecupo al superar el aforo en una misma comida', () => {
    const lista = [almuerzo(120, 'a'), almuerzo(81, 'b')]
    expect(getDayOccupancy('2026-11-14', lista, undefined, LIMITES).status).toBe('sobrecupo')
  })

  it('comidas distintas no se suman entre sí', () => {
    const lista = [almuerzo(150, 'a', ['desayuno']), almuerzo(150, 'b', ['almuerzo'])]
    expect(getDayOccupancy('2026-11-14', lista, undefined, LIMITES).status).toBe('ocupado')
  })

  it('muchas solicitudes pequeñas ya no cuentan como sobrecupo por sí solas', () => {
    const lista = Array.from({ length: 12 }, (_, i) => almuerzo(5, `r${i}`))
    expect(getDayOccupancy('2026-11-14', lista, undefined, LIMITES).status).toBe('ocupado')
  })
})

describe('bloqueo de fechas del cliente', () => {
  const cabanas = [
    { id: 'c6', name: 'Cabaña 6', capacity: 6, pricePerNight: 1 },
    { id: 'c8', name: 'Cabaña 8', capacity: 8, pricePerNight: 1 }
  ] as Cabin[]

  function reservaCabana(cabinId: string, desde: string, hasta: string): ReservationRequest {
    return {
      id: `${cabinId}-${desde}`,
      type: 'cabana',
      status: 'confirmed',
      date: desde,
      guestsCount: 2,
      details: { resourceId: cabinId, startDate: desde, endDate: hasta }
    } as ReservationRequest
  }

  it('cabañas: una noche con la cabaña de 8 ocupada se bloquea para 7 personas pero no para 4', () => {
    const lista = [reservaCabana('c8', '2027-03-10', '2027-03-12')]
    expect(isCabinNightBlocked('2027-03-10', 7, cabanas, lista)).toBe(true)
    expect(isCabinNightBlocked('2027-03-10', 4, cabanas, lista)).toBe(false)
  })

  it('cabañas: la noche de salida de otra reserva queda libre', () => {
    const lista = [reservaCabana('c8', '2027-03-10', '2027-03-12')]
    expect(isCabinNightBlocked('2027-03-12', 7, cabanas, lista)).toBe(false)
  })

  it('cabañas: con más personas que la cabaña más grande no se bloquea nada', () => {
    expect(isCabinNightBlocked('2027-03-10', 9, cabanas, [])).toBe(false)
  })

  it('cabañas: una estadía que cruza una noche ocupada se bloquea si no hay una cabaña libre todas las noches', () => {
    const lista = [reservaCabana('c8', '2027-03-11', '2027-03-12'), reservaCabana('c6', '2027-03-12', '2027-03-13')]
    // Para 4 personas: la de 6 falla la noche del 12 y la de 8 la noche del 11
    expect(isCabinStayBlocked('2027-03-10', '2027-03-14', 4, cabanas, lista)).toBe(true)
    // Cada noche por separado sí tiene alguna cabaña libre
    expect(isCabinNightBlocked('2027-03-11', 4, cabanas, lista)).toBe(false)
    expect(isCabinNightBlocked('2027-03-12', 4, cabanas, lista)).toBe(false)
  })

  it('restaurante: el día se bloquea solo si las tres comidas están llenas', () => {
    const llenar = (comida: string, id: string) => {
      const r = almuerzo(200, id, [comida])
      r.date = '2027-03-10'
      r.details = { ...r.details, startDate: '2027-03-10' }
      return r
    }
    const soloAlmuerzo = [llenar('almuerzo', 'a')]
    expect(getFullMeals('2027-03-10', 10, soloAlmuerzo, 200)).toEqual(['almuerzo'])
    expect(isRestaurantDayBlocked('2027-03-10', 10, soloAlmuerzo, 200)).toBe(false)

    const todas = [llenar('desayuno', 'a'), llenar('almuerzo', 'b'), llenar('once', 'c')]
    expect(isRestaurantDayBlocked('2027-03-10', 10, todas, 200)).toBe(true)
  })

  function camping(modalidad: 'diario' | 'pernoctar', personas: number, desde: string, hasta: string): ReservationRequest {
    return {
      id: `${modalidad}-${desde}`,
      type: 'camping',
      status: 'confirmed',
      date: desde,
      guestsCount: personas,
      details: { campingType: modalidad, startDate: desde, endDate: hasta }
    } as ReservationRequest
  }

  it('camping: diario y pernoctar tienen cupos separados', () => {
    const lista = [camping('pernoctar', 140, '2027-03-10', '2027-03-12')]
    expect(isCampingDayBlocked('2027-03-10', 'pernoctar', 20, lista, 150)).toBe(true)
    expect(isCampingDayBlocked('2027-03-10', 'pernoctar', 10, lista, 150)).toBe(false)
    expect(isCampingDayBlocked('2027-03-10', 'diario', 150, lista, 150)).toBe(false)
  })

  it('camping: una estancia de pernoctar se bloquea si una de sus noches no tiene cupo', () => {
    const lista = [camping('pernoctar', 140, '2027-03-11', '2027-03-12')]
    expect(isCampingStayBlocked('2027-03-10', '2027-03-13', 20, lista, 150)).toBe(true)
    expect(isCampingStayBlocked('2027-03-12', '2027-03-14', 20, lista, 150)).toBe(false)
  })

  it('el calendario del admin no suma diario y pernoctar para marcar sobrecupo', () => {
    const lista = [camping('diario', 100, '2027-03-10', '2027-03-10'), camping('pernoctar', 100, '2027-03-10', '2027-03-11')]
    expect(getDayOccupancy('2027-03-10', lista, undefined, LIMITES).status).toBe('ocupado')
  })
})

describe('solo las confirmadas bloquean; las pendientes solo avisan (SCRUM-263)', () => {
  const cabanas = [{ id: 'c8', name: 'Cabaña 8', capacity: 8, pricePerNight: 1 }] as Cabin[]
  const pendiente = (r: ReservationRequest) => ({ ...r, status: 'pending' }) as ReservationRequest

  it('cabañas: una pendiente no bloquea la noche ni la estadía, pero una confirmada sí', () => {
    const base = {
      id: 'a', type: 'cabana', date: '2027-03-10', guestsCount: 2,
      details: { resourceId: 'c8', startDate: '2027-03-10', endDate: '2027-03-12' }
    } as ReservationRequest
    expect(isCabinNightBlocked('2027-03-10', 4, cabanas, [pendiente(base)])).toBe(false)
    expect(isCabinStayBlocked('2027-03-10', '2027-03-12', 4, cabanas, [pendiente(base)])).toBe(false)
    expect(isCabinStayBlocked('2027-03-10', '2027-03-12', 4, cabanas, [{ ...base, status: 'confirmed' } as ReservationRequest])).toBe(true)
  })

  it('restaurante: las pendientes no llenan la comida, las confirmadas sí', () => {
    const llena = almuerzo(200, 'a')
    expect(getFullMeals('2026-11-14', 10, [pendiente(llena)], 200)).toEqual([])
    expect(getFullMeals('2026-11-14', 10, [llena], 200)).toEqual(['almuerzo'])
  })

  it('camping: las pendientes no consumen cupo, las confirmadas sí', () => {
    const grande = {
      id: 'c', type: 'camping', status: 'pending', date: '2027-03-10', guestsCount: 150,
      details: { campingType: 'pernoctar', startDate: '2027-03-10', endDate: '2027-03-11' }
    } as ReservationRequest
    expect(isCampingDayBlocked('2027-03-10', 'pernoctar', 10, [grande], 150)).toBe(false)
    expect(isCampingDayBlocked('2027-03-10', 'pernoctar', 10, [{ ...grande, status: 'confirmed' } as ReservationRequest], 150)).toBe(true)
  })

  it('el aviso del admin sigue contando pendientes: sobrecupo con una pendiente y una confirmada', () => {
    const lista = [almuerzo(120, 'a'), pendiente(almuerzo(81, 'b'))]
    expect(getDayOccupancy('2026-11-14', lista, undefined, LIMITES).status).toBe('sobrecupo')
  })
})
