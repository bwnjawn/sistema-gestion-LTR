import { describe, expect, it } from 'vitest'
import { getDayOccupancy, getRestaurantCapacity } from '../src/services/availability'
import type { ReservationRequest } from '../src/types/domain'

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
