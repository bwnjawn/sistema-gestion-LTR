import { describe, expect, it } from 'vitest'
import { countByFilter, countByStatus, filterRequests, parseStatusFilter } from '../src/services/requestFilters'
import type { ReservationRequest } from '../src/types/domain'

function solicitud(datos: Partial<ReservationRequest>): ReservationRequest {
  return {
    requestCode: 'A1',
    clientName: 'Ana',
    clientPhone: '+56912345678',
    resourceName: 'Cabaña 1',
    status: 'pending',
    type: 'cabana',
    ...datos
  } as ReservationRequest
}

const lista = [
  solicitud({ requestCode: 'A1', status: 'pending' }),
  solicitud({ requestCode: 'B2', clientName: 'Beto', status: 'confirmed', type: 'restaurante' }),
  solicitud({ requestCode: 'C3', status: 'rejected' })
]

describe('filtros de solicitudes', () => {
  it('filtra por estado, tipo y texto', () => {
    expect(filterRequests(lista, { status: 'confirmed', type: 'all', query: '' })).toHaveLength(1)
    expect(filterRequests(lista, { status: null, type: 'restaurante', query: '' })).toHaveLength(1)
    expect(filterRequests(lista, { status: null, type: 'all', query: ' beto ' })).toHaveLength(1)
    expect(filterRequests(lista, { status: null, type: 'all', query: '' })).toHaveLength(3)
  })

  it('cuenta por estado', () => {
    expect(countByStatus(lista)).toEqual({ pending: 1, confirmed: 1, rejected: 1, cancelled: 0 })
  })

  it('junta rechazadas y canceladas en descartadas', () => {
    expect(countByFilter(lista)).toEqual({ pending: 1, confirmed: 1, discarded: 1 })
    expect(filterRequests(lista, { status: 'discarded', type: 'all', query: '' })).toHaveLength(1)
  })

  it('interpreta el estado de la URL', () => {
    expect(parseStatusFilter('pending')).toBe('pending')
    expect(parseStatusFilter(['rejected'])).toBe('discarded')
    expect(parseStatusFilter('cancelled')).toBe('discarded')
    expect(parseStatusFilter('otro')).toBeNull()
  })
})
