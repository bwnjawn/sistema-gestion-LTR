// src/services/disponibilidad.ts
// Disponibilidad que ve el cliente, calculada solo con las fechas ocupadas confirmadas (`FechasOcupadas`),
// sin ver ninguna solicitud. Las reglas son las mismas de `services/availability.ts` (que usa el administrador
// con la lista completa): tests/disponibilidad.test.ts comprueba que ambas dan el mismo resultado.

import type { Cabin, CampingModality, MealType, ReservationRequest } from '../types/domain'
import type { FechasOcupadas, NocheDeCabana, PersonasDelDia } from '../types/disponibilidad'
import { addDays, isPastDate } from '../lib/dates'
import { COMIDAS_RESTAURANTE, getBookableCabins, getRequestDateRange, isRequestConfirmed } from './availability'

// ---------------------------------------------------------------------------
// Solicitudes → fechas ocupadas (lo hace el repositorio local; en Supabase, `fechas_ocupadas`)
// ---------------------------------------------------------------------------

/** Días que ocupa una solicitud dentro de `[desde, hasta]`: [entrada, salida) o solo el día si no hay salida. */
function diasDentro(inicio: string, fin: string | null, desde: string, hasta: string): string[] {
  const dias: string[] = []
  const tope = fin ?? addDays(inicio, 1)
  for (let dia = inicio < desde ? desde : inicio; dia < tope && dia <= hasta; dia = addDays(dia, 1)) {
    dias.push(dia)
  }
  return dias
}

/**
 * Convierte las solicitudes en las fechas ocupadas confirmadas entre `desde` y `hasta` (ambas incluidas).
 * Solo cuentan las confirmadas (decisión del 10/11, SCRUM-263); las pendientes, rechazadas y canceladas no
 * bloquean nada, y la piscina (SCRUM-44) tampoco.
 */
export function calcularFechasOcupadas(
  solicitudes: ReservationRequest[],
  desde: string,
  hasta: string
): FechasOcupadas {
  const cabanas: NocheDeCabana[] = []
  const restaurante = new Map<string, PersonasDelDia<MealType>>()
  const camping = new Map<string, PersonasDelDia<CampingModality>>()

  function sumar<K extends string>(mapa: Map<string, PersonasDelDia<K>>, dia: string, tipo: K, personas: number) {
    const clave = `${dia}|${tipo}`
    const actual = mapa.get(clave)
    if (actual) actual.personas += personas
    else mapa.set(clave, { dia, tipo, personas })
  }

  for (const r of solicitudes) {
    if (!isRequestConfirmed(r)) continue
    const { start, end } = getRequestDateRange(r)
    if (!start) continue

    if (r.type === 'cabana') {
      const cabinId = r.details?.resourceId
      // Una cabaña sin salida válida no ocupa noches (igual que `isCabinAvailable`)
      if (!cabinId || !end) continue
      for (const noche of diasDentro(start, end, desde, hasta)) cabanas.push({ cabinId, noche })
    } else if (r.type === 'restaurante') {
      const comidas = (r.details?.selectedMealTypes ?? []).filter((c): c is MealType =>
        (COMIDAS_RESTAURANTE as readonly string[]).includes(c)
      )
      for (const dia of diasDentro(start, end, desde, hasta)) {
        for (const comida of comidas) sumar(restaurante, dia, comida, r.guestsCount)
      }
    } else if (r.type === 'camping') {
      const modalidad: CampingModality = r.details?.campingType ?? 'pernoctar'
      for (const dia of diasDentro(start, end, desde, hasta)) sumar(camping, dia, modalidad, r.guestsCount)
    }
  }

  const porDia = <T extends { dia: string; tipo: string }>(a: T, b: T) =>
    a.dia.localeCompare(b.dia) || a.tipo.localeCompare(b.tipo)

  return {
    cabanas: cabanas.sort((a, b) => a.noche.localeCompare(b.noche) || a.cabinId.localeCompare(b.cabinId)),
    restaurante: [...restaurante.values()].sort(porDia),
    camping: [...camping.values()].sort(porDia)
  }
}

// ---------------------------------------------------------------------------
// Consultas del cliente sobre las fechas ocupadas
// ---------------------------------------------------------------------------

export interface ConsultaDisponibilidad {
  /** La cabaña está libre todas las noches de [entrada, salida). */
  cabanaLibre(cabinId: string, entrada: string, salida: string): boolean
  /** Cabañas con capacidad para el grupo, fuera de mantención y libres toda la estadía. */
  cabanasDisponibles(cabins: Cabin[], personas: number, entrada: string, salida: string): Cabin[]
  /** Una noche se bloquea si no queda libre ninguna cabaña con capacidad para el grupo. */
  nocheCabanaBloqueada(dia: string, personas: number, cabins: Cabin[]): boolean
  /** Una estadía se bloquea si ninguna cabaña con capacidad está libre todas sus noches. */
  estadiaCabanaBloqueada(entrada: string, salida: string, personas: number, cabins: Cabin[]): boolean
  /** Comidas que no admiten al grupo ese día (confirmadas + grupo > capacidad). */
  comidasLlenas(dia: string, personas: number, capacidad: number): string[]
  /** El día del restaurante se bloquea solo si las tres comidas están llenas para el grupo. */
  diaRestauranteBloqueado(dia: string, personas: number, capacidad: number): boolean
  /** Un día (o noche, en pernoctar) de camping se bloquea si el cupo de esa modalidad no alcanza al grupo. */
  diaCampingBloqueado(dia: string, modalidad: CampingModality, personas: number, cupo: number): boolean
  /** Una estadía de pernoctar se bloquea si alguna de sus noches no tiene cupo. */
  estadiaCampingBloqueada(entrada: string, salida: string, personas: number, cupo: number): boolean
}

export function crearConsultaDisponibilidad(ocupadas: FechasOcupadas): ConsultaDisponibilidad {
  const nochesOcupadas = new Set(ocupadas.cabanas.map(n => `${n.cabinId}|${n.noche}`))
  const personasRestaurante = new Map(ocupadas.restaurante.map(p => [`${p.dia}|${p.tipo}`, p.personas]))
  const personasCamping = new Map(ocupadas.camping.map(p => [`${p.dia}|${p.tipo}`, p.personas]))

  const consulta: ConsultaDisponibilidad = {
    cabanaLibre(cabinId, entrada, salida) {
      for (let noche = entrada; noche < salida; noche = addDays(noche, 1)) {
        if (nochesOcupadas.has(`${cabinId}|${noche}`)) return false
      }
      return true
    },

    cabanasDisponibles(cabins, personas, entrada, salida) {
      return getBookableCabins(cabins).filter(c => c.capacity >= personas && consulta.cabanaLibre(c.id, entrada, salida))
    },

    nocheCabanaBloqueada(dia, personas, cabins) {
      if (isPastDate(dia)) return true
      return consulta.estadiaCabanaBloqueada(dia, addDays(dia, 1), personas, cabins)
    },

    estadiaCabanaBloqueada(entrada, salida, personas, cabins) {
      // Si ninguna cabaña alcanza para el grupo no se bloquea nada: lo resuelve el contacto directo (SCRUM-27)
      const queSirven = cabins.filter(c => c.capacity >= personas)
      if (queSirven.length === 0) return false
      return consulta.cabanasDisponibles(queSirven, personas, entrada, salida).length === 0
    },

    comidasLlenas(dia, personas, capacidad) {
      return COMIDAS_RESTAURANTE.filter(
        comida => (personasRestaurante.get(`${dia}|${comida}`) ?? 0) + personas > capacidad
      )
    },

    diaRestauranteBloqueado(dia, personas, capacidad) {
      if (isPastDate(dia)) return true
      return consulta.comidasLlenas(dia, personas, capacidad).length === COMIDAS_RESTAURANTE.length
    },

    diaCampingBloqueado(dia, modalidad, personas, cupo) {
      if (isPastDate(dia)) return true
      return (personasCamping.get(`${dia}|${modalidad}`) ?? 0) + personas > cupo
    },

    estadiaCampingBloqueada(entrada, salida, personas, cupo) {
      for (let dia = entrada; dia < salida; dia = addDays(dia, 1)) {
        if (consulta.diaCampingBloqueado(dia, 'pernoctar', personas, cupo)) return true
      }
      return false
    }
  }
  return consulta
}
