import { describe, expect, it } from 'vitest'
import {
  getDayOccupancy,
  getRequestsForDay,
  getWeekDates,
  getWeekStart,
  requestOccupiesDay
} from '../src/services/availability'
import type { ReservationRequest } from '../src/types/domain'

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
