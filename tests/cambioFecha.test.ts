import { describe, expect, it } from 'vitest'
import { hasPendingOnMoveDay, isMoveDayBlocked, isMoveStayBlocked } from '../src/services/cambioFecha'
import type { ReservationRequest } from '../src/types/domain'

const CAP = { restaurante: 200, camping: 150 }

function cabana(id: string, cabinId: string, desde: string, hasta: string, status = 'pending'): ReservationRequest {
  return {
    id, requestCode: `LTR-${id}`, clientName: id, type: 'cabana', status, resourceName: `Cabaña ${cabinId}`,
    date: desde, guestsCount: 2, totalAmount: 1,
    details: { resourceId: cabinId, startDate: desde, endDate: hasta }
  } as ReservationRequest
}

function almuerzo(id: string, personas: number, dia: string, status = 'confirmed'): ReservationRequest {
  return {
    id, type: 'restaurante', status, resourceName: 'Restaurante', date: dia, guestsCount: personas,
    details: { startDate: dia, selectedMealTypes: ['almuerzo'] }
  } as ReservationRequest
}

describe('cambio de fecha: qué días se pueden elegir (SCRUM-262)', () => {
  it('una cabaña con una confirmada bloquea esas noches, pero no las de la propia solicitud', () => {
    const propia = cabana('a', '6', '2027-03-10', '2027-03-12', 'confirmed')
    const otra = cabana('b', '6', '2027-03-14', '2027-03-16', 'confirmed')
    const lista = [propia, otra]
    expect(isMoveDayBlocked(propia, '2027-03-14', lista, CAP)).toBe(true)
    expect(isMoveDayBlocked(propia, '2027-03-10', lista, CAP)).toBe(false)
    expect(isMoveStayBlocked(propia, '2027-03-13', '2027-03-15', lista, CAP)).toBe(true)
    expect(isMoveStayBlocked(propia, '2027-03-12', '2027-03-14', lista, CAP)).toBe(false)
  })

  it('una pendiente de otro no bloquea, solo se marca', () => {
    const propia = cabana('a', '6', '2027-03-10', '2027-03-12')
    const pendiente = cabana('b', '6', '2027-03-14', '2027-03-16')
    const lista = [propia, pendiente]
    expect(isMoveDayBlocked(propia, '2027-03-14', lista, CAP)).toBe(false)
    expect(hasPendingOnMoveDay(propia, '2027-03-14', lista)).toBe(true)
    expect(hasPendingOnMoveDay(propia, '2027-03-20', lista)).toBe(false)
  })

  it('otra cabaña no marca ni bloquea', () => {
    const propia = cabana('a', '6', '2027-03-10', '2027-03-12')
    const otra = cabana('b', '7', '2027-03-14', '2027-03-16', 'confirmed')
    expect(isMoveDayBlocked(propia, '2027-03-14', [propia, otra], CAP)).toBe(false)
    expect(hasPendingOnMoveDay(propia, '2027-03-14', [propia, otra])).toBe(false)
  })

  it('restaurante: bloquea el día si la comida de la solicitud ya no tiene cupo con confirmadas', () => {
    const propia = almuerzo('a', 50, '2027-03-10', 'pending')
    const llena = almuerzo('b', 180, '2027-03-14')
    expect(isMoveDayBlocked(propia, '2027-03-14', [propia, llena], CAP)).toBe(true)
    expect(isMoveDayBlocked(propia, '2027-03-15', [propia, llena], CAP)).toBe(false)
  })
})
