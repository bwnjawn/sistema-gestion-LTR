import { describe, expect, it } from 'vitest'
import { findConflicts, groupConflictsByRequest } from '../src/services/availability'
import { solicitudesPorMover } from '../src/services/cruces'
import { describirLlegada, resumirCruce, unirNombres } from '../src/services/resumenCruce'
import type { ReservationRequest } from '../src/types/domain'

const LIMITES = { restaurantePersonas: 200, campingPersonas: 150 }
const AHORA = new Date('2026-10-05T12:00:00').getTime()

function base(id: string, tipo: ReservationRequest['type'], nombre: string, personas: number, status: string, creada: string): ReservationRequest {
  return {
    id,
    requestCode: `SOL-${id}`,
    clientName: nombre,
    type: tipo,
    status,
    guestsCount: personas,
    createdAt: creada,
    payments: [],
    totalAmount: 100000,
    depositRequired: 30000,
    details: {}
  } as unknown as ReservationRequest
}

function cabana(id: string, nombre: string, desde: string, hasta: string, status = 'pending', creada = '2026-10-01T10:00:00'): ReservationRequest {
  const r = base(id, 'cabana', nombre, 4, status, creada)
  return { ...r, resourceName: 'Cabaña 6', date: desde, details: { resourceId: 'c6', startDate: desde, endDate: hasta } } as ReservationRequest
}

function almuerzo(id: string, nombre: string, personas: number, status = 'pending', creada = '2026-10-01T10:00:00'): ReservationRequest {
  const r = base(id, 'restaurante', nombre, personas, status, creada)
  return { ...r, resourceName: 'Restaurante', date: '2026-10-12', details: { startDate: '2026-10-12', selectedMealTypes: ['almuerzo'] } } as ReservationRequest
}

function camping(id: string, nombre: string, personas: number, desde: string, hasta: string, status = 'pending'): ReservationRequest {
  const r = base(id, 'camping', nombre, personas, status, '2026-10-01T10:00:00')
  return { ...r, resourceName: 'Camping', date: desde, details: { campingType: 'pernoctar', startDate: desde, endDate: hasta } } as ReservationRequest
}

function resumir(solicitudes: ReservationRequest[], id: string) {
  const conflictos = findConflicts(solicitudes, LIMITES)
  const porMover = solicitudesPorMover(solicitudes, LIMITES)
  return resumirCruce({
    solicitud: solicitudes.find(r => r.id === id) as ReservationRequest,
    solicitudes,
    conflictos: groupConflictsByRequest(conflictos)[id] ?? [],
    bloqueantes: porMover[id] ?? [],
    ahora: AHORA
  })
}

describe('resumirCruce', () => {
  it('no devuelve nada cuando no hay cruces', () => {
    const solicitudes = [cabana('a', 'Ana', '2026-10-12', '2026-10-14'), cabana('b', 'Luis', '2026-10-20', '2026-10-22')]
    expect(resumir(solicitudes, 'a')).toBeNull()
  })

  it('cabaña bloqueada por una confirmada: nivel bloqueo, la confirmada primero y un hueco libre para mover', () => {
    const solicitudes = [
      cabana('a', 'Ana', '2026-10-12', '2026-10-14'),
      cabana('p', 'Pedro', '2026-10-11', '2026-10-13', 'confirmed'),
      cabana('l', 'Luis', '2026-10-13', '2026-10-15')
    ]
    const resumen = resumir(solicitudes, 'a')
    expect(resumen?.nivel).toBe('bloqueo')
    expect(resumen?.titulo).toBe('Fecha ocupada · 1 reserva confirmada')
    expect(resumen?.otras.map(f => f.nombre)).toEqual(['Pedro', 'Luis'])
    expect(resumen?.otras[0].nochesQueSePisan).toBe(1)
    expect(resumen?.siApruebas).toBeNull()
    // 12 y 13 están ocupados por Pedro hasta el 13 (sale el 13): libre desde el 13
    expect(resumen?.paraMover).toContain('queda libre del 13 Oct al 15 Oct')
  })

  it('dos pendientes en la misma cabaña: nivel cruce y la otra se queda sin lugar si se aprueba esta', () => {
    const solicitudes = [cabana('a', 'Ana', '2026-10-12', '2026-10-14'), cabana('l', 'Luis', '2026-10-13', '2026-10-16')]
    const resumen = resumir(solicitudes, 'a')
    expect(resumen?.nivel).toBe('cruce')
    expect(resumen?.titulo).toBe('Se cruza con 1 solicitud')
    expect(resumen?.siApruebas).toEqual({ sinLugar: ['Luis'], siguenCabiendo: [], porCupo: false })
    expect(resumen?.cupo).toEqual([])
  })

  it('ordena las demás: confirmadas primero y luego por orden de llegada', () => {
    const solicitudes = [
      cabana('a', 'Ana', '2026-10-12', '2026-10-16'),
      cabana('n', 'Nueva', '2026-10-13', '2026-10-14', 'pending', '2026-10-05T11:00:00'),
      cabana('v', 'Vieja', '2026-10-13', '2026-10-14', 'pending', '2026-10-02T11:00:00')
    ]
    expect(resumir(solicitudes, 'a')?.otras.map(f => f.nombre)).toEqual(['Vieja', 'Nueva'])
  })

  it('restaurante: muestra el cupo del almuerzo y quién sigue cabiendo si se aprueba esta', () => {
    const solicitudes = [
      almuerzo('a', 'Colegio', 40),
      almuerzo('p', 'Pedro', 120, 'confirmed'),
      almuerzo('e', 'Empresa', 70),
      almuerzo('f', 'Familia', 12)
    ]
    const resumen = resumir(solicitudes, 'a')
    expect(resumen?.nivel).toBe('cruce')
    expect(resumen?.cupo).toEqual([{ cuando: 'Almuerzo del 12 Oct', pedidas: 242, limite: 200, confirmadas: 120, libres: 80 }])
    expect(resumen?.frase).toBe('Entre todas piden 242 personas y el cupo es de 200.')
    // Con Pedro (120) y Colegio (40) quedan 40 libres: Familia (12) cabe, Empresa (70) no
    expect(resumen?.siApruebas).toEqual({ sinLugar: ['Empresa'], siguenCabiendo: ['Familia'], porCupo: true })
  })

  it('camping por varias noches: lista solo las noches que pasan del cupo', () => {
    const solicitudes = [
      camping('a', 'Reyes', 30, '2026-10-12', '2026-10-14'),
      camping('s', 'Scouts', 90, '2026-10-12', '2026-10-14'),
      camping('c', 'Club', 40, '2026-10-13', '2026-10-15')
    ]
    const resumen = resumir(solicitudes, 'a')
    // Noche 12: 120 (cabe). Noche 13: 160 (pasa por 10)
    expect(resumen?.cupo).toHaveLength(1)
    expect(resumen?.cupo[0]).toMatchObject({ cuando: 'Noche del 13 Oct', pedidas: 160, limite: 150 })
  })

  it('restaurante bloqueado por confirmadas: dice cuánto cupo queda libre', () => {
    const solicitudes = [almuerzo('a', 'Colegio', 90), almuerzo('p', 'Pedro', 120, 'confirmed')]
    const resumen = resumir(solicitudes, 'a')
    expect(resumen?.nivel).toBe('bloqueo')
    expect(resumen?.paraMover).toBe('Cupo libre en esas fechas: 80 personas.')
  })

  it('una reserva confirmada que se topa con pendientes tiene nivel confirmada y nada que decidir', () => {
    const solicitudes = [cabana('p', 'Pedro', '2026-10-11', '2026-10-13', 'confirmed'), cabana('a', 'Ana', '2026-10-12', '2026-10-14')]
    const resumen = resumir(solicitudes, 'p')
    expect(resumen?.nivel).toBe('confirmada')
    expect(resumen?.siApruebas).toBeNull()
    expect(resumen?.paraMover).toBe('')
  })

  it('una confirmación hecha sin conexión que chocó tiene nivel sin-conexion', () => {
    const solicitudes = [
      { ...cabana('a', 'Marta', '2026-10-20', '2026-10-22'), enConflicto: true } as ReservationRequest,
      cabana('r', 'Rosa', '2026-10-21', '2026-10-24', 'confirmed')
    ]
    const resumen = resumir(solicitudes, 'a')
    expect(resumen?.nivel).toBe('sin-conexion')
    expect(resumen?.titulo).toBe('Se confirmó sin conexión y chocó')
  })

  it('el abono se resume en pagado, pendiente o no exige', () => {
    const conAbono = { ...cabana('l', 'Luis', '2026-10-13', '2026-10-16'), payments: [{ id: 'x', amount: 30000, method: 'transferencia', paidOn: '2026-10-02' }] } as unknown as ReservationRequest
    const sinExigir = { ...cabana('s', 'Sara', '2026-10-13', '2026-10-16'), depositRequired: 0 } as ReservationRequest
    const resumen = resumir([cabana('a', 'Ana', '2026-10-12', '2026-10-14'), conAbono, sinExigir], 'a')
    const abonos = Object.fromEntries((resumen?.otras ?? []).map(f => [f.nombre, f.abono]))
    expect(abonos).toEqual({ Luis: 'pagado', Sara: 'no-exige' })
    expect(resumen?.propia.abono).toBe('pendiente')
  })
})

describe('describirLlegada y unirNombres', () => {
  it('describe cuánto hace que llegó', () => {
    expect(describirLlegada('2026-10-05T11:50:00', AHORA)).toBe('hace unos minutos')
    expect(describirLlegada('2026-10-05T09:00:00', AHORA)).toBe('hace 3 h')
    expect(describirLlegada('2026-10-04T12:00:00', AHORA)).toBe('hace 1 día')
    expect(describirLlegada('2026-10-01T12:00:00', AHORA)).toBe('hace 4 días')
  })

  it('une nombres con comas y "y"', () => {
    expect(unirNombres([])).toBe('')
    expect(unirNombres(['Ana'])).toBe('Ana')
    expect(unirNombres(['Ana', 'Luis'])).toBe('Ana y Luis')
    expect(unirNombres(['Ana', 'Luis', 'Pedro'])).toBe('Ana, Luis y Pedro')
  })
})
