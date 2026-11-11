import { describe, expect, it } from 'vitest'
import { diasEntre, getCrossedRequests, puedeConfirmarse } from '../src/services/cruces'
import { buildAsuntoFechaNoDisponible, buildMensajeFechaNoDisponible } from '../src/services/mensajesCliente'
import { buildMailtoUrl } from '../src/lib/contactLinks'
import type { ReservationRequest } from '../src/types/domain'

const LIMITES = { restaurantePersonas: 200, campingPersonas: 150 }
const HOY = '2027-03-01'

function cabana(id: string, cabinId: string, desde: string, hasta: string, status = 'pending'): ReservationRequest {
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

describe('cruces al confirmar (SCRUM-262)', () => {
  it('sin cruces no hay nada que decidir', () => {
    const lista = [cabana('a', '6', '2027-03-10', '2027-03-12'), cabana('b', '7', '2027-03-10', '2027-03-12')]
    expect(getCrossedRequests('a', lista, LIMITES, HOY)).toEqual([])
  })

  it('lista primero la solicitud propia y después las que se cruzan, con días y cercanía', () => {
    const lista = [cabana('a', '6', '2027-03-10', '2027-03-13'), cabana('b', '6', '2027-03-12', '2027-03-15')]
    const filas = getCrossedRequests('a', lista, LIMITES, HOY)
    expect(filas.map(f => f.solicitud.id)).toEqual(['a', 'b'])
    expect(filas[0].esLaPropia).toBe(true)
    expect(filas[1].dias).toEqual(['2027-03-12'])
    expect(filas[0].diasParaLaFecha).toBe(9)
    expect(filas[1].diasParaLaFecha).toBe(11)
  })

  it('dos pendientes cruzadas se pueden confirmar cualquiera de las dos', () => {
    const lista = [cabana('a', '6', '2027-03-10', '2027-03-13'), cabana('b', '6', '2027-03-12', '2027-03-15')]
    const filas = getCrossedRequests('a', lista, LIMITES, HOY)
    expect(filas.every(f => f.puedeConfirmarse)).toBe(true)
  })

  it('con una confirmada en el grupo, la pendiente ya no se puede confirmar', () => {
    const lista = [cabana('a', '6', '2027-03-10', '2027-03-13'), cabana('b', '6', '2027-03-12', '2027-03-15', 'confirmed')]
    const filas = getCrossedRequests('a', lista, LIMITES, HOY)
    expect(filas[0].puedeConfirmarse).toBe(false)
    expect(filas[1].confirmada).toBe(true)
    expect(puedeConfirmarse(lista[0], lista, LIMITES)).toBe(false)
  })

  it('una pendiente cruzada con dos confirmadas muestra a las tres', () => {
    const lista = [
      cabana('a', '6', '2027-03-10', '2027-03-16'),
      cabana('b', '6', '2027-03-10', '2027-03-12', 'confirmed'),
      cabana('c', '6', '2027-03-14', '2027-03-16', 'confirmed')
    ]
    const filas = getCrossedRequests('a', lista, LIMITES, HOY)
    expect(filas.map(f => f.solicitud.id)).toEqual(['a', 'b', 'c'])
    expect(filas[0].dias).toEqual(['2027-03-10', '2027-03-11', '2027-03-14', '2027-03-15'])
  })

  it('una solicitud rechazada no entra ni se puede confirmar', () => {
    const lista = [cabana('a', '6', '2027-03-10', '2027-03-13', 'rejected'), cabana('b', '6', '2027-03-12', '2027-03-15')]
    expect(getCrossedRequests('b', lista, LIMITES, HOY)).toEqual([])
    expect(puedeConfirmarse(lista[0], lista, LIMITES)).toBe(false)
  })

  it('salida y entrada el mismo día no son un cruce', () => {
    const lista = [cabana('a', '6', '2027-03-10', '2027-03-12'), cabana('b', '6', '2027-03-12', '2027-03-14', 'confirmed')]
    expect(getCrossedRequests('a', lista, LIMITES, HOY)).toEqual([])
    expect(puedeConfirmarse(lista[0], lista, LIMITES)).toBe(true)
  })

  it('sigue las cadenas: al aprobar A también aparece C, que solo choca con B', () => {
    const lista = [
      cabana('a', '6', '2027-03-10', '2027-03-13'),
      cabana('b', '6', '2027-03-12', '2027-03-16'),
      cabana('c', '6', '2027-03-15', '2027-03-18')
    ]
    const filas = getCrossedRequests('a', lista, LIMITES, HOY)
    expect(filas.map(f => f.solicitud.id)).toEqual(['a', 'b', 'c'])
    expect(filas[0].seCruzaConIds).toEqual(['b'])
    expect(filas[1].seCruzaConIds.sort()).toEqual(['a', 'c'])
    expect(filas[2].seCruzaConIds).toEqual(['b'])
  })

  it('no mezcla cabañas distintas ni solicitudes sin relación', () => {
    const lista = [
      cabana('a', '6', '2027-03-10', '2027-03-13'),
      cabana('b', '6', '2027-03-12', '2027-03-16'),
      cabana('x', '7', '2027-03-10', '2027-03-16')
    ]
    expect(getCrossedRequests('a', lista, LIMITES, HOY).map(f => f.solicitud.id)).toEqual(['a', 'b'])
  })

  it('una fecha pasada da una cercanía negativa', () => {
    expect(diasEntre('2027-03-10', '2027-03-08')).toBe(-2)
  })
})

describe('mensaje para el cliente cuya fecha ya no está disponible', () => {
  const solicitud = cabana('a', '6', '2027-03-10', '2027-03-12')

  it('nombra al cliente, el código y las fechas, sin proponer fechas nuevas', () => {
    const mensaje = buildMensajeFechaNoDisponible(solicitud)
    expect(mensaje).toContain('Hola Cliente a')
    expect(mensaje).toContain('LTR-a')
    expect(mensaje).toContain('ya no está disponible')
    expect(mensaje).toContain('¿Te acomoda otra fecha?')
  })

  it('el asunto del correo lleva el código', () => {
    expect(buildAsuntoFechaNoDisponible(solicitud)).toBe('Tu solicitud LTR-a - Los Troncos de Repil')
  })

  it('el enlace de correo incluye asunto y cuerpo codificados', () => {
    const url = buildMailtoUrl('a@b.cl', 'Asunto uno', 'Hola, ¿qué tal?')
    expect(url).toBe(`mailto:a@b.cl?subject=${encodeURIComponent('Asunto uno')}&body=${encodeURIComponent('Hola, ¿qué tal?')}`)
    expect(buildMailtoUrl('a@b.cl')).toBe('mailto:a@b.cl')
  })
})
