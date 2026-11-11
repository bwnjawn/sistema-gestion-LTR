import { describe, expect, it } from 'vitest'
import {
  getAvailableCabinsForStay,
  getBookableCabins,
  getUpcomingCabinRequests,
  isCabinInMaintenance,
  isCabinNightBlocked,
  isCabinStayBlocked
} from '../src/services/availability'
import type { Cabin, ReservationRequest } from '../src/types/domain'

function cabina(id: string, capacity: number, enMantencion?: boolean): Cabin {
  return { id, name: `Cabaña ${id}`, capacity, pricePerNight: 50000, enMantencion }
}

function reserva(id: string, cabinId: string, desde: string, hasta: string, status = 'confirmed'): ReservationRequest {
  return {
    id,
    requestCode: `LTR-${id}`,
    clientName: `Cliente ${id}`,
    type: 'cabana',
    status,
    resourceName: `Cabaña ${cabinId}`,
    date: desde,
    guestsCount: 2,
    totalAmount: 100000,
    details: { resourceId: cabinId, startDate: desde, endDate: hasta }
  } as ReservationRequest
}

const C6 = cabina('6', 6)
const C8 = cabina('8', 8)

describe('cabañas en mantención (SCRUM-266)', () => {
  it('la marca solo está activa con enMantencion verdadero', () => {
    expect(isCabinInMaintenance(cabina('x', 4, true))).toBe(true)
    expect(isCabinInMaintenance(cabina('x', 4, false))).toBe(false)
    expect(isCabinInMaintenance(cabina('x', 4))).toBe(false)
  })

  it('las cabañas en mantención no se ofrecen', () => {
    const lista = [C6, cabina('8', 8, true)]
    expect(getBookableCabins(lista).map(c => c.id)).toEqual(['6'])
    expect(getAvailableCabinsForStay(lista, 2, '2027-03-10', '2027-03-12', []).map(c => c.id)).toEqual(['6'])
  })

  it('una cabaña vuelve a ofrecerse al desactivar la marca', () => {
    expect(getAvailableCabinsForStay([cabina('8', 8, false)], 2, '2027-03-10', '2027-03-12', []).length).toBe(1)
  })

  it('si todas las cabañas que le sirven están en mantención, la estadía se bloquea', () => {
    const lista = [C6, cabina('8', 8, true)]
    // 7 personas solo caben en la 8, que está en mantención
    expect(isCabinStayBlocked('2027-03-10', '2027-03-12', 7, lista, [])).toBe(true)
    expect(isCabinNightBlocked('2027-03-10', 7, lista, [])).toBe(true)
    // 2 personas caben en la 6, que está libre
    expect(isCabinStayBlocked('2027-03-10', '2027-03-12', 2, lista, [])).toBe(false)
  })

  it('con un grupo que no cabe en ninguna cabaña no se bloquea nada (lo resuelve SCRUM-27)', () => {
    expect(isCabinStayBlocked('2027-03-10', '2027-03-12', 20, [C6, C8], [])).toBe(false)
  })

  it('las reservas por venir de una cabaña se avisan, sin cambiarlas', () => {
    const reservas = [
      reserva('a', '6', '2027-03-10', '2027-03-12', 'confirmed'),
      reserva('b', '6', '2027-04-01', '2027-04-03', 'pending'),
      reserva('c', '6', '2027-01-01', '2027-01-03', 'confirmed'), // ya terminó
      reserva('d', '6', '2027-03-20', '2027-03-22', 'rejected'),
      reserva('e', '8', '2027-03-10', '2027-03-12', 'confirmed') // otra cabaña
    ]
    const r = getUpcomingCabinRequests('6', reservas, '2027-03-01')
    expect(r.map(x => x.id)).toEqual(['a', 'b'])
    expect(reservas[0].status).toBe('confirmed')
  })

  it('una estadía que termina hoy ya no cuenta como por venir', () => {
    const reservas = [reserva('a', '6', '2027-02-27', '2027-03-01')]
    expect(getUpcomingCabinRequests('6', reservas, '2027-03-01')).toEqual([])
  })
})
