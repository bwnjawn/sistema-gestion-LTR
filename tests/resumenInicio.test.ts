import { describe, expect, it } from 'vitest'
import { pendientesRecientes, proximasReservas } from '../src/services/resumenInicio'
import type { ReservationRequest } from '../src/types/domain'

function sol(id: string, status: ReservationRequest['status'], date: string, createdAt: string): ReservationRequest {
  return {
    id, requestCode: id, clientName: id, clientPhone: '', type: 'cabana', resourceName: 'Cabaña 6', date,
    guestsCount: 2, totalAmount: 0, depositRequired: 0, payments: [], status, createdAt
  }
}

describe('resumenInicio', () => {
  const lista = [
    sol('a', 'pending', '2026-12-10', '2026-11-01T10:00:00Z'),
    sol('b', 'pending', '2026-12-11', '2026-11-03T10:00:00Z'),
    sol('c', 'confirmed', '2026-12-20', '2026-11-02T10:00:00Z'),
    sol('d', 'confirmed', '2026-11-01', '2026-10-01T10:00:00Z'),
    sol('e', 'confirmed', '2026-12-05', '2026-10-05T10:00:00Z')
  ]

  it('lista las pendientes más recientes primero y respeta la cantidad', () => {
    expect(pendientesRecientes(lista, 5).map(s => s.id)).toEqual(['b', 'a'])
    expect(pendientesRecientes(lista, 1).map(s => s.id)).toEqual(['b'])
  })

  it('lista las confirmadas desde hoy, la más cercana primero, sin las pasadas', () => {
    expect(proximasReservas(lista, '2026-11-20', 5).map(s => s.id)).toEqual(['e', 'c'])
  })

  it('incluye las que empiezan hoy y no modifica la lista original', () => {
    const copia = [...lista]
    expect(proximasReservas(lista, '2026-12-20', 5).map(s => s.id)).toEqual(['c'])
    expect(lista).toEqual(copia)
  })
})
