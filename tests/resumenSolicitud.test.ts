import { describe, expect, it } from 'vitest'
import {
  describirPago,
  ordenarSolicitudes,
  partesDeFecha,
  rangoCorto,
  resumirSolicitud,
  senalDeSolicitud
} from '../src/services/resumenSolicitud'
import type { ReservationRequest } from '../src/types/domain'

const HOY = '2027-03-01'

function cabana(id: string, desde: string, hasta: string, extra: Partial<ReservationRequest> = {}): ReservationRequest {
  return {
    id,
    requestCode: `LTR-${id}`,
    clientName: `Cliente ${id}`,
    clientPhone: '+56 9 1234 5678',
    type: 'cabana',
    status: 'pending',
    resourceName: 'Cabaña 6',
    date: desde,
    guestsCount: 4,
    totalAmount: 120000,
    depositRequired: 36000,
    payments: [],
    createdAt: new Date().toISOString(),
    details: { resourceId: '6', startDate: desde, endDate: hasta },
    ...extra
  } as ReservationRequest
}

describe('textos cortos de la lista de solicitudes', () => {
  it('el rango corto junta el mes cuando es el mismo', () => {
    expect(rangoCorto('2027-03-12', '2027-03-14')).toBe('12–14 mar')
    expect(rangoCorto('2027-03-30', '2027-04-02')).toBe('30 mar – 2 abr')
    expect(rangoCorto('2027-03-12', null)).toBe('12 mar')
  })

  it('parte una fecha para mostrarla grande', () => {
    expect(partesDeFecha('2027-03-12')).toEqual({ semana: 'vie', dia: '12', mes: 'mar' })
  })

  it('resume una estadía con noches y una visita de un día sin ellas', () => {
    const estadia = resumirSolicitud(cabana('a', '2027-03-12', '2027-03-14'))
    expect(estadia).toMatchObject({ fechas: '12–14 mar', noches: 2, personas: '4 personas', recurso: 'Cabaña 6' })
    const comida = resumirSolicitud({
      ...cabana('b', '2027-03-12', ''),
      type: 'restaurante',
      guestsCount: 1,
      timeOrDuration: '13:00',
      details: { startDate: '2027-03-12', selectedMealTypes: ['almuerzo'] }
    } as ReservationRequest)
    expect(comida).toMatchObject({ fechas: '12 mar', noches: 0, personas: '1 comensal', esVisitaDeUnDia: true })
  })
})

describe('una sola señal por solicitud', () => {
  const horas = (h: number) => new Date(Date.now() + h * 3600000).toISOString()

  it('sin nada especial no hay señal', () => {
    expect(senalDeSolicitud(cabana('a', '2027-03-12', '2027-03-14', { depositDueAt: undefined, depositRequired: 0 }), {})).toBeNull()
  })

  it('la fecha ocupada gana sobre el cruce y el abono vencido', () => {
    const vencida = cabana('a', '2027-03-12', '2027-03-14', { createdAt: horas(-80), depositDueAt: horas(-30) })
    expect(senalDeSolicitud(vencida, { bloqueo: 'Pedro Soto (12 al 14 mar)', cruces: 2 })).toMatchObject({ tipo: 'bloqueo', urgente: true })
    expect(senalDeSolicitud(vencida, { cruces: 2 })).toMatchObject({ tipo: 'cruce', texto: 'Se cruza con 2 solicitudes' })
    expect(senalDeSolicitud(vencida, {})).toMatchObject({ tipo: 'vencido', urgente: true })
  })

  it('un plazo vigente solo informa', () => {
    const conPlazo = cabana('a', '2027-03-12', '2027-03-14', { createdAt: horas(-2), depositDueAt: horas(40) })
    expect(senalDeSolicitud(conPlazo, {})).toMatchObject({ tipo: 'plazo', urgente: false })
  })

  it('las confirmadas no llevan señal', () => {
    expect(senalDeSolicitud(cabana('a', '2027-03-12', '2027-03-14', { status: 'confirmed' }), { cruces: 1 })).toBeNull()
  })
})

describe('línea de dinero', () => {
  it('muestra lo pagado y el porcentaje', () => {
    const pago = { id: 'p', amount: 36000, method: 'transferencia', paidOn: '2027-03-01', notes: '' } as ReservationRequest['payments'][number]
    const r = describirPago(cabana('a', '2027-03-12', '2027-03-14', { payments: [pago] }))
    expect(r.porcentaje).toBe(30)
    expect(r.texto).toContain('de')
  })
})

describe('orden de la lista', () => {
  it('pendientes primero, luego por llegada más cercana y lo ya pasado al final', () => {
    const lista = [
      cabana('lejana', '2027-05-01', '2027-05-03'),
      cabana('confirmada', '2027-03-05', '2027-03-07', { status: 'confirmed' }),
      cabana('cercana', '2027-03-10', '2027-03-12'),
      cabana('pasada', '2027-02-01', '2027-02-03')
    ]
    expect(ordenarSolicitudes(lista, new Set(), HOY).map(r => r.id)).toEqual(['cercana', 'lejana', 'pasada', 'confirmada'])
  })

  it('las urgentes van antes que el resto de su estado', () => {
    const lista = [cabana('cercana', '2027-03-10', '2027-03-12'), cabana('lejana', '2027-05-01', '2027-05-03')]
    expect(ordenarSolicitudes(lista, new Set(['lejana']), HOY).map(r => r.id)).toEqual(['lejana', 'cercana'])
  })
})
