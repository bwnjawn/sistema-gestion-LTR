import { describe, expect, it } from 'vitest'
import { findConflicts, getCabinOverlaps, getDayOccupancy, getPendingCabinOverlaps, groupConflictsByRequest, initialStatusForAdminRequest, isCabinAvailable } from '../src/services/availability'
import type { ReservationRequest } from '../src/types/domain'

const LIMITES = { restaurantePersonas: 200, campingPersonas: 150 }

function cabana(id: string, cabinId: string, desde: string, hasta: string, status = 'pending'): ReservationRequest {
  return {
    id,
    type: 'cabana',
    status,
    resourceName: `Cabaña ${cabinId}`,
    date: desde,
    guestsCount: 2,
    details: { resourceId: cabinId, startDate: desde, endDate: hasta }
  } as ReservationRequest
}

function almuerzo(id: string, personas: number, dia: string, comidas = ['almuerzo']): ReservationRequest {
  return {
    id,
    type: 'restaurante',
    status: 'confirmed',
    resourceName: 'Restaurante',
    date: dia,
    guestsCount: personas,
    details: { startDate: dia, selectedMealTypes: comidas }
  } as ReservationRequest
}

function camping(id: string, modalidad: 'diario' | 'pernoctar', personas: number, desde: string, hasta: string): ReservationRequest {
  return {
    id,
    type: 'camping',
    status: 'pending',
    resourceName: 'Camping',
    date: desde,
    guestsCount: personas,
    details: { campingType: modalidad, startDate: desde, endDate: hasta }
  } as ReservationRequest
}

describe('detección de solapamientos', () => {
  it('detecta dos reservas de la misma cabaña con fechas cruzadas, aunque ambas estén pendientes', () => {
    const lista = [cabana('a', 'c8', '2027-03-10', '2027-03-13'), cabana('b', 'c8', '2027-03-12', '2027-03-15')]
    const conflictos = findConflicts(lista, LIMITES)
    expect(conflictos).toHaveLength(1)
    expect(conflictos[0].solicitudIds).toEqual(['a', 'b'])
    expect(conflictos[0].dias).toEqual(['2027-03-12'])
  })

  it('salida y entrada el mismo día no es conflicto', () => {
    const lista = [cabana('a', 'c8', '2027-03-10', '2027-03-12'), cabana('b', 'c8', '2027-03-12', '2027-03-14')]
    expect(findConflicts(lista, LIMITES)).toHaveLength(0)
  })

  it('cabañas distintas en las mismas fechas no se topan', () => {
    const lista = [cabana('a', 'c6', '2027-03-10', '2027-03-12'), cabana('b', 'c8', '2027-03-10', '2027-03-12')]
    expect(findConflicts(lista, LIMITES)).toHaveLength(0)
  })

  it('una solicitud rechazada deja de aparecer en conflicto', () => {
    const lista = [cabana('a', 'c8', '2027-03-10', '2027-03-13'), cabana('b', 'c8', '2027-03-12', '2027-03-15', 'rejected')]
    expect(findConflicts(lista, LIMITES)).toHaveLength(0)
  })

  it('una reserva larga que cruza a varias reservas cortas las marca a todas', () => {
    const lista = [
      cabana('larga', 'c8', '2027-03-01', '2027-03-20'),
      cabana('x', 'c8', '2027-03-05', '2027-03-06'),
      cabana('y', 'c8', '2027-03-10', '2027-03-11')
    ]
    const porSolicitud = groupConflictsByRequest(findConflicts(lista, LIMITES))
    expect(porSolicitud['larga']).toHaveLength(2)
    expect(porSolicitud['x']).toHaveLength(1)
    expect(porSolicitud['y']).toHaveLength(1)
  })

  it('restaurante: las solicitudes de una misma comida que juntas superan el aforo se marcan', () => {
    const lista = [almuerzo('a', 120, '2027-03-10'), almuerzo('b', 81, '2027-03-10')]
    const conflictos = findConflicts(lista, LIMITES)
    expect(conflictos).toHaveLength(1)
    expect(conflictos[0].solicitudIds).toEqual(['a', 'b'])
  })

  it('restaurante: comidas distintas o aforo justo no son conflicto', () => {
    expect(findConflicts([almuerzo('a', 150, '2027-03-10', ['desayuno']), almuerzo('b', 150, '2027-03-10')], LIMITES)).toHaveLength(0)
    expect(findConflicts([almuerzo('a', 120, '2027-03-10'), almuerzo('b', 80, '2027-03-10')], LIMITES)).toHaveLength(0)
  })

  it('camping: diario y pernoctar no se mezclan, y los días seguidos se agrupan en un solo conflicto', () => {
    const lista = [
      camping('a', 'pernoctar', 100, '2027-03-10', '2027-03-13'),
      camping('b', 'pernoctar', 60, '2027-03-11', '2027-03-14'),
      camping('c', 'diario', 140, '2027-03-11', '2027-03-11')
    ]
    const conflictos = findConflicts(lista, LIMITES)
    expect(conflictos).toHaveLength(1)
    expect(conflictos[0].solicitudIds).toEqual(['a', 'b'])
    expect(conflictos[0].dias).toEqual(['2027-03-11', '2027-03-12'])
  })

  it('el calendario marca como "se topan" un día con dos reservas de la misma cabaña', () => {
    const lista = [cabana('a', 'c8', '2027-03-10', '2027-03-13'), cabana('b', 'c8', '2027-03-12', '2027-03-15')]
    expect(getDayOccupancy('2027-03-12', lista, undefined, LIMITES).status).toBe('sobrecupo')
    expect(getDayOccupancy('2027-03-11', lista, undefined, LIMITES).status).toBe('ocupado')
  })
})

describe('getCabinOverlaps (SCRUM-260)', () => {
  it('devuelve las solicitudes activas de la misma cabaña que se cruzan', () => {
    const reservas = [
      cabana('a', '6', '2026-12-20', '2026-12-22'),
      cabana('b', '7', '2026-12-20', '2026-12-22'),
      cabana('c', '6', '2026-12-20', '2026-12-22', 'rejected')
    ]
    const cruces = getCabinOverlaps('6', '2026-12-21', '2026-12-23', reservas)
    expect(cruces.map(r => r.id)).toEqual(['a'])
  })

  it('salida y entrada el mismo día no se cruzan', () => {
    const reservas = [cabana('a', '6', '2026-12-20', '2026-12-22')]
    expect(getCabinOverlaps('6', '2026-12-22', '2026-12-24', reservas)).toEqual([])
  })
})

describe('Cabañas ofrecidas y estado de la reserva del admin (SCRUM-260)', () => {
  it('una cabaña con una confirmada en esas fechas no se ofrece', () => {
    const reservas = [cabana('a', '6', '2026-12-20', '2026-12-22', 'confirmed')]
    expect(isCabinAvailable('6', '2026-12-21', '2026-12-23', reservas)).toBe(false)
  })

  it('una cabaña con solo pendientes se ofrece y las pendientes se avisan', () => {
    const reservas = [cabana('a', '6', '2026-12-20', '2026-12-22', 'pending')]
    expect(isCabinAvailable('6', '2026-12-21', '2026-12-23', reservas)).toBe(true)
    expect(getPendingCabinOverlaps('6', '2026-12-21', '2026-12-23', reservas).map(r => r.id)).toEqual(['a'])
  })

  it('una cabaña con una confirmada y una pendiente no se ofrece', () => {
    const reservas = [
      cabana('a', '6', '2026-12-20', '2026-12-22', 'pending'),
      cabana('b', '6', '2026-12-20', '2026-12-22', 'confirmed')
    ]
    expect(isCabinAvailable('6', '2026-12-20', '2026-12-22', reservas)).toBe(false)
  })

  it('salida y entrada el mismo día no cuentan como cruce', () => {
    const reservas = [cabana('a', '6', '2026-12-20', '2026-12-22', 'confirmed')]
    expect(isCabinAvailable('6', '2026-12-22', '2026-12-24', reservas)).toBe(true)
  })

  it('la reserva del admin entra confirmada si no se cruza con nada', () => {
    const nueva = cabana('x', '6', '2026-12-20', '2026-12-22')
    const { id, status, ...sinId } = nueva as any
    expect(initialStatusForAdminRequest(sinId, [cabana('a', '7', '2026-12-20', '2026-12-22')], LIMITES)).toBe('confirmed')
  })

  it('la reserva del admin entra pendiente si se cruza con una pendiente', () => {
    const nueva = cabana('x', '6', '2026-12-20', '2026-12-22')
    const { id, status, ...sinId } = nueva as any
    const existentes = [cabana('a', '6', '2026-12-21', '2026-12-23', 'pending')]
    expect(initialStatusForAdminRequest(sinId, existentes, LIMITES)).toBe('pending')
  })
})
