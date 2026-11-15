import { describe, expect, it } from 'vitest'
import { calcularFechasOcupadas, crearConsultaDisponibilidad } from '../src/services/disponibilidad'
import {
  getAvailableCabinsForStay,
  getFullMeals,
  isCabinNightBlocked,
  isCabinStayBlocked,
  isCampingDayBlocked,
  isCampingStayBlocked,
  isRestaurantDayBlocked
} from '../src/services/availability'
import { addDays } from '../src/lib/dates'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales } from '../src/lib/repositories'
import type { Cabin, ReservationRequest } from '../src/types/domain'

// Fechas muy futuras: ninguna cae en el pasado y el resultado no depende del día en que se corre la prueba
const D = (dia: number) => `2099-03-${String(dia).padStart(2, '0')}`

function base(id: string, type: ReservationRequest['type'], status: ReservationRequest['status'], desde: string, extra: Partial<ReservationRequest> = {}): ReservationRequest {
  return {
    id,
    requestCode: `SOL-${id}`,
    clientName: 'Nombre Privado',
    clientPhone: '+56 9 9999 9999',
    type,
    resourceName: 'x',
    date: desde,
    guestsCount: 2,
    totalAmount: 1,
    depositRequired: 0,
    payments: [],
    status,
    createdAt: '2099-01-01T00:00:00.000Z',
    ...extra
  } as ReservationRequest
}

const cabana = (id: string, cabinId: string, status: ReservationRequest['status'], desde: string, hasta: string) =>
  base(id, 'cabana', status, desde, { details: { resourceId: cabinId, startDate: desde, endDate: hasta } })
const restaurante = (id: string, status: ReservationRequest['status'], dia: string, personas: number, comidas: string[]) =>
  base(id, 'restaurante', status, dia, { guestsCount: personas, details: { startDate: dia, selectedMealTypes: comidas } })
const camping = (id: string, status: ReservationRequest['status'], modalidad: 'diario' | 'pernoctar', desde: string, hasta: string, personas: number) =>
  base(id, 'camping', status, desde, { guestsCount: personas, details: { campingType: modalidad, startDate: desde, endDate: hasta } })

const CABANAS: Cabin[] = [
  { id: 'c1', name: 'Cabaña 1', capacity: 4, pricePerNight: 1, isActive: true },
  { id: 'c2', name: 'Cabaña 2', capacity: 6, pricePerNight: 1, isActive: true },
  { id: 'c3', name: 'Cabaña 3', capacity: 8, pricePerNight: 1, isActive: true, enMantencion: true }
]

const SOLICITUDES: ReservationRequest[] = [
  cabana('a', 'c1', 'confirmed', D(10), D(13)),
  cabana('b', 'c1', 'pending', D(20), D(22)),
  cabana('c', 'c2', 'confirmed', D(11), D(12)),
  cabana('d', 'c2', 'cancelled', D(14), D(16)),
  cabana('e', 'c1', 'confirmed', D(25), ''),
  restaurante('f', 'confirmed', D(10), 180, ['almuerzo', 'once']),
  restaurante('g', 'confirmed', D(10), 30, ['almuerzo']),
  restaurante('h', 'pending', D(10), 100, ['desayuno']),
  restaurante('i', 'confirmed', D(12), 200, ['desayuno', 'almuerzo', 'once']),
  camping('j', 'confirmed', 'pernoctar', D(10), D(14), 100),
  camping('k', 'confirmed', 'diario', D(10), D(10), 50),
  camping('l', 'pending', 'pernoctar', D(10), D(12), 100),
  base('m', 'piscina', 'confirmed', D(10), { guestsCount: 500, details: { startDate: D(10), endDate: D(10) } })
]

const DESDE = D(1)
const HASTA = D(31)
const ocupadas = calcularFechasOcupadas(SOLICITUDES, DESDE, HASTA)
const consulta = crearConsultaDisponibilidad(ocupadas)

describe('fechas ocupadas (SCRUM-246)', () => {
  it('solo cuentan las confirmadas y cada noche de cabaña sale una vez', () => {
    expect(ocupadas.cabanas.filter(n => n.cabinId === 'c1').map(n => n.noche)).toEqual([D(10), D(11), D(12)])
    expect(ocupadas.cabanas.filter(n => n.cabinId === 'c2').map(n => n.noche)).toEqual([D(11)])
  })

  it('una cabaña sin fecha de salida válida no ocupa noches', () => {
    expect(ocupadas.cabanas.some(n => n.noche === D(25))).toBe(false)
  })

  it('suma las personas confirmadas por día y comida', () => {
    const almuerzo = ocupadas.restaurante.find(p => p.dia === D(10) && p.tipo === 'almuerzo')
    expect(almuerzo?.personas).toBe(210)
    expect(ocupadas.restaurante.find(p => p.dia === D(10) && p.tipo === 'desayuno')).toBeUndefined()
  })

  it('suma el camping por modalidad y cuenta cada noche de la estadía', () => {
    const pernoctar = ocupadas.camping.filter(p => p.tipo === 'pernoctar').map(p => [p.dia, p.personas])
    expect(pernoctar).toEqual([[D(10), 100], [D(11), 100], [D(12), 100], [D(13), 100]])
    expect(ocupadas.camping.find(p => p.tipo === 'diario')).toMatchObject({ dia: D(10), personas: 50 })
  })

  it('la piscina no bloquea nada', () => {
    expect(JSON.stringify(ocupadas)).not.toContain('piscina')
    expect(ocupadas.camping.some(p => p.personas >= 500)).toBe(false)
  })

  it('no trae ningún dato personal: ni nombres, ni teléfonos, ni códigos', () => {
    const texto = JSON.stringify(ocupadas)
    expect(texto).not.toContain('Nombre Privado')
    expect(texto).not.toContain('9999')
    expect(texto).not.toContain('SOL-')
  })

  it('recorta al rango pedido', () => {
    const recorte = calcularFechasOcupadas(SOLICITUDES, D(11), D(11))
    expect(recorte.cabanas.map(n => `${n.cabinId}|${n.noche}`).sort()).toEqual([`c1|${D(11)}`, `c2|${D(11)}`])
    expect(recorte.camping.every(p => p.dia === D(11))).toBe(true)
    expect(calcularFechasOcupadas(SOLICITUDES, D(28), D(31))).toEqual({ cabanas: [], restaurante: [], camping: [] })
  })

  it('el repositorio local entrega lo mismo calculado desde sus solicitudes', async () => {
    const mem = crearAlmacenamientoEnMemoria({ requests: SOLICITUDES })
    const repos = crearRepositoriosLocales(mem)
    expect(await repos.availability.fechasOcupadas(DESDE, HASTA)).toEqual(ocupadas)
  })
})

describe('la disponibilidad del cliente da lo mismo que las reglas con la lista completa', () => {
  const dias = Array.from({ length: 10 }, (_, i) => D(8 + i))
  const personas = [1, 3, 5, 7, 9, 30, 40, 60, 150, 190]

  it('cabañas: noche, estadía y cabañas disponibles', () => {
    for (const dia of dias) {
      for (const p of personas) {
        expect(consulta.nocheCabanaBloqueada(dia, p, CABANAS), `noche ${dia} ${p}p`).toBe(isCabinNightBlocked(dia, p, CABANAS, SOLICITUDES))
        const salida = addDays(dia, 2)
        expect(consulta.estadiaCabanaBloqueada(dia, salida, p, CABANAS), `estadía ${dia} ${p}p`).toBe(isCabinStayBlocked(dia, salida, p, CABANAS, SOLICITUDES))
        expect(consulta.cabanasDisponibles(CABANAS, p, dia, salida).map(c => c.id)).toEqual(
          getAvailableCabinsForStay(CABANAS, p, dia, salida, SOLICITUDES).map(c => c.id)
        )
      }
    }
  })

  it('restaurante: comidas llenas y día bloqueado, con distintos aforos', () => {
    for (const dia of dias) {
      for (const p of personas) {
        for (const capacidad of [120, 200]) {
          expect(consulta.comidasLlenas(dia, p, capacidad), `${dia} ${p}p ${capacidad}`).toEqual(getFullMeals(dia, p, SOLICITUDES, capacidad))
          expect(consulta.diaRestauranteBloqueado(dia, p, capacidad)).toBe(isRestaurantDayBlocked(dia, p, SOLICITUDES, capacidad))
        }
      }
    }
  })

  it('camping: día y estadía por modalidad', () => {
    for (const dia of dias) {
      for (const p of personas) {
        for (const modalidad of ['diario', 'pernoctar'] as const) {
          expect(consulta.diaCampingBloqueado(dia, modalidad, p, 150), `${dia} ${modalidad} ${p}p`).toBe(
            isCampingDayBlocked(dia, modalidad, p, SOLICITUDES, 150)
          )
        }
        const salida = addDays(dia, 3)
        expect(consulta.estadiaCampingBloqueada(dia, salida, p, 150)).toBe(isCampingStayBlocked(dia, salida, p, SOLICITUDES, 150))
      }
    }
  })

  it('una fecha pasada siempre está bloqueada', () => {
    expect(consulta.nocheCabanaBloqueada('2000-01-01', 2, CABANAS)).toBe(true)
    expect(consulta.diaRestauranteBloqueado('2000-01-01', 2, 200)).toBe(true)
    expect(consulta.diaCampingBloqueado('2000-01-01', 'diario', 2, 150)).toBe(true)
  })

  it('con la cabaña en mantención y un grupo grande, el comportamiento es el de siempre', () => {
    // 7 personas: solo sirve la cabaña 3 (en mantención): la estadía se bloquea, igual que antes
    expect(consulta.estadiaCabanaBloqueada(D(15), D(17), 7, CABANAS)).toBe(true)
    // 20 personas: ninguna alcanza, no se bloquea nada (lo resuelve el contacto directo)
    expect(consulta.estadiaCabanaBloqueada(D(15), D(17), 20, CABANAS)).toBe(false)
  })
})
