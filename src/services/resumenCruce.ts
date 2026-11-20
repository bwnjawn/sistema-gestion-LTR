// src/services/resumenCruce.ts
// Datos del bloque "Se cruza con…" del detalle de una solicitud (SCRUM-287).
// Responde las tres preguntas del administrador: cuáles se topan, cuál conviene elegir y qué hacer con las que quedan.
// Solo arma información: no cambia ni rechaza nada, y los colores y el diseño viven en el componente.

import type { BookingStatus, ReservationRequest } from '../types/domain'
import { addDays, formatDateShort, nightsBetween } from '../lib/dates'
import {
  getRequestDateRange,
  isRequestConfirmed,
  requestOccupiesDay,
  type Conflicto
} from './availability'
import { getPaymentSummary } from './payments'
import { describirFechasSolicitud } from './mensajesCliente'

/**
 * - bloqueo: la fecha ya la ocupa una confirmada; no se puede aprobar.
 * - sin-conexion: se confirmó sin internet y chocó al sincronizar (SCRUM-250).
 * - cruce: se topa con otras que aún no están confirmadas; el administrador elige.
 * - confirmada: esta reserva ya está confirmada; las que se topan con ella son las que pierden.
 */
export type NivelCruce = 'bloqueo' | 'sin-conexion' | 'cruce' | 'confirmada'

export type EstadoAbono = 'pagado' | 'pendiente' | 'no-exige'

/** Una solicitud del grupo, con lo que el administrador compara para decidir. */
export interface FilaCruce {
  id: string
  nombre: string
  codigo: string
  estado: BookingStatus
  esLaPropia: boolean
  fechas: string
  personas: number
  abono: EstadoAbono
  /** "hace 3 días", "hace 2 h"… */
  llegada: string
  /** Noches (o días) que comparte con la solicitud que se está viendo; 0 en la propia y en el restaurante. */
  nochesQueSePisan: number
}

/** Cupo de una comida, un día o una noche que se pasa (restaurante y camping). */
export interface LineaCupo {
  cuando: string
  pedidas: number
  limite: number
  confirmadas: number
  libres: number
}

export interface ResumenCruce {
  nivel: NivelCruce
  titulo: string
  subtitulo: string
  frase: string
  propia: FilaCruce
  /** Las demás: primero las confirmadas, luego las pendientes de la más antigua a la más nueva. */
  otras: FilaCruce[]
  /** Vacío en cabañas. */
  cupo: LineaCupo[]
  /** Qué pasa con las pendientes si se aprueba esta. Solo cuando hay algo que decidir (nivel "cruce"). */
  siApruebas: { sinLugar: string[]; siguenCabiendo: string[]; porCupo: boolean } | null
  /** Fechas o cupo libres para mover la solicitud. Solo en "bloqueo" y "sin-conexion". */
  paraMover: string
}

export interface EntradaResumenCruce {
  solicitud: ReservationRequest
  solicitudes: ReservationRequest[]
  /** Conflictos de esta solicitud (ya filtrados). */
  conflictos: Conflicto[]
  /** Confirmadas que ocupan su fecha (la hace "por mover"). */
  bloqueantes: ReservationRequest[]
  ahora?: number
}

const ETIQUETA_COMIDA: Record<string, string> = { desayuno: 'Desayuno', almuerzo: 'Almuerzo', once: 'Once' }
const MS_POR_HORA = 3_600_000
/** Cuántos días hacia adelante se busca un hueco libre para mover una cabaña. */
const DIAS_DE_BUSQUEDA = 90

/** "hace 3 días", "hace 2 h" o "hace unos minutos". */
export function describirLlegada(creadaEn: string, ahora: number = Date.now()): string {
  const horas = (ahora - new Date(creadaEn).getTime()) / MS_POR_HORA
  if (!Number.isFinite(horas) || horas < 1) return 'hace unos minutos'
  if (horas < 24) return `hace ${Math.round(horas)} h`
  const dias = Math.round(horas / 24)
  return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`
}

/** "Ana, Luis y Pedro". */
export function unirNombres(nombres: string[]): string {
  if (nombres.length <= 1) return nombres.join('')
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

/** Hasta tres nombres y "y N más". */
function nombresCortos(nombres: string[]): string {
  if (nombres.length <= 3) return unirNombres(nombres)
  return `${nombres.slice(0, 3).join(', ')} y ${nombres.length - 3} más`
}

/** Días [entrada, salida) que dos solicitudes comparten; un solo día si no tienen salida. */
function diasEnComun(a: ReservationRequest, b: ReservationRequest): number {
  const ra = getRequestDateRange(a)
  const rb = getRequestDateRange(b)
  if (!ra.start || !rb.start) return 0
  const finA = ra.end ?? addDays(ra.start, 1)
  const finB = rb.end ?? addDays(rb.start, 1)
  const desde = ra.start > rb.start ? ra.start : rb.start
  const hasta = finA < finB ? finA : finB
  let total = 0
  for (let dia = desde; dia < hasta && total < 400; dia = addDays(dia, 1)) total++
  return total
}

function estadoDelAbono(r: ReservationRequest): EstadoAbono {
  const pago = getPaymentSummary(r)
  if (pago.state === 'sin_abono_exigido') return 'no-exige'
  return pago.depositPending > 0 ? 'pendiente' : 'pagado'
}

function armarFila(r: ReservationRequest, propia: ReservationRequest, ahora: number): FilaCruce {
  const esLaPropia = r.id === propia.id
  return {
    id: r.id,
    nombre: r.clientName,
    codigo: r.requestCode,
    estado: r.status,
    esLaPropia,
    fechas: describirFechasSolicitud(r),
    personas: r.guestsCount,
    abono: estadoDelAbono(r),
    llegada: describirLlegada(r.createdAt, ahora),
    nochesQueSePisan: !esLaPropia && r.type === 'cabana' ? diasEnComun(propia, r) : 0
  }
}

/** Confirmadas primero (son las que bloquean); luego, por orden de llegada. */
function ordenar(solicitudes: ReservationRequest[]): ReservationRequest[] {
  return [...solicitudes].sort((a, b) => {
    const ca = isRequestConfirmed(a)
    if (ca !== isRequestConfirmed(b)) return ca ? -1 : 1
    return (a.createdAt || '').localeCompare(b.createdAt || '')
  })
}

function sumaPersonas(solicitudes: ReservationRequest[]): number {
  return solicitudes.reduce((total, r) => total + r.guestsCount, 0)
}

/** "Almuerzo del 12 oct", "Noche del 13 oct", "Noches del 12 al 14 oct". */
function describirCuando(c: Conflicto): string {
  const primero = c.dias[0]
  const ultimo = c.dias[c.dias.length - 1]
  const mismoDia = primero === ultimo
  if (c.servicio === 'restaurante') {
    const comida = ETIQUETA_COMIDA[c.cupo?.comida ?? ''] ?? 'Restaurante'
    return mismoDia ? `${comida} del ${formatDateShort(primero)}` : `${comida}, del ${formatDateShort(primero)} al ${formatDateShort(ultimo)}`
  }
  const noche = c.cupo?.modalidad === 'diario' ? 'Día' : 'Noche'
  const plural = c.cupo?.modalidad === 'diario' ? 'Días' : 'Noches'
  return mismoDia ? `${noche} del ${formatDateShort(primero)}` : `${plural} del ${formatDateShort(primero)} al ${formatDateShort(ultimo)}`
}

function armarCupo(conflictos: Conflicto[], porId: Map<string, ReservationRequest>): LineaCupo[] {
  return conflictos
    .filter(c => c.cupo)
    .map(c => {
      const integrantes = c.solicitudIds.map(id => porId.get(id)).filter((r): r is ReservationRequest => !!r)
      const limite = c.cupo?.limite ?? 0
      const confirmadas = sumaPersonas(integrantes.filter(isRequestConfirmed))
      return { cuando: describirCuando(c), pedidas: sumaPersonas(integrantes), limite, confirmadas, libres: Math.max(0, limite - confirmadas) }
    })
}

/** Qué pasa con cada pendiente si se aprueba esta (de a una; no todas juntas). */
function efectoDeAprobar(
  propia: ReservationRequest,
  pendientes: ReservationRequest[],
  conflictos: Conflicto[],
  porId: Map<string, ReservationRequest>
): NonNullable<ResumenCruce['siApruebas']> {
  const porCupo = conflictos.some(c => c.cupo)
  if (!porCupo) return { sinLugar: pendientes.map(r => r.clientName), siguenCabiendo: [], porCupo }
  const sinLugar: string[] = []
  const siguenCabiendo: string[] = []
  for (const otra of pendientes) {
    const cabe = conflictos
      .filter(c => c.cupo && c.solicitudIds.includes(otra.id))
      .every(c => {
        const confirmadas = sumaPersonas(c.solicitudIds.map(id => porId.get(id)).filter((r): r is ReservationRequest => !!r && isRequestConfirmed(r)))
        return confirmadas + propia.guestsCount + otra.guestsCount <= (c.cupo?.limite ?? 0)
      })
    ;(cabe ? siguenCabiendo : sinLugar).push(otra.clientName)
  }
  return { sinLugar, siguenCabiendo, porCupo }
}

/** Primer hueco de la misma cabaña, sin reservas confirmadas, donde cabe la estadía; '' si no hay. */
function huecoLibreDeCabana(propia: ReservationRequest, solicitudes: ReservationRequest[]): string {
  const cabana = propia.details?.resourceId
  const { start, end } = getRequestDateRange(propia)
  if (propia.type !== 'cabana' || !cabana || !start) return ''
  const confirmadas = solicitudes.filter(r => r.id !== propia.id && r.type === 'cabana' && r.details?.resourceId === cabana && isRequestConfirmed(r))
  const noches = Math.max(1, end ? nightsBetween(start, end) : 1)
  const libre = (dia: string) => !confirmadas.some(r => requestOccupiesDay(r, dia))
  for (let desde = start, i = 0; i < DIAS_DE_BUSQUEDA; desde = addDays(desde, 1), i++) {
    let sirve = true
    for (let n = 0; n < noches && sirve; n++) sirve = libre(addDays(desde, n))
    if (sirve) {
      const hasta = addDays(desde, noches)
      const texto = noches === 1 ? `el ${formatDateShort(desde)}` : `del ${formatDateShort(desde)} al ${formatDateShort(hasta)}`
      return `La ${propia.resourceName} queda libre ${texto} (${noches} ${noches === 1 ? 'noche' : 'noches'}).`
    }
  }
  return ''
}

/**
 * Arma el resumen del bloque de cruces de una solicitud, o null si no hay nada que mostrar
 * (sin cruces y sin conflicto de sincronización).
 */
export function resumirCruce(entrada: EntradaResumenCruce): ResumenCruce | null {
  const { solicitud, solicitudes, conflictos, bloqueantes } = entrada
  const ahora = entrada.ahora ?? Date.now()
  const porId = new Map(solicitudes.map(r => [r.id, r]))

  const idsOtras = new Set<string>(bloqueantes.map(r => r.id))
  for (const c of conflictos) c.solicitudIds.filter(id => id !== solicitud.id).forEach(id => idsOtras.add(id))
  const otras = ordenar([...idsOtras].map(id => porId.get(id)).filter((r): r is ReservationRequest => !!r))
  if (otras.length === 0) return null

  const pendiente = solicitud.status === 'pending'
  const nivel: NivelCruce = solicitud.status === 'confirmed' ? 'confirmada'
    : pendiente && solicitud.enConflicto ? 'sin-conexion'
    : bloqueantes.length > 0 ? 'bloqueo'
    : 'cruce'

  const confirmadas = otras.filter(isRequestConfirmed)
  const pendientes = otras.filter(r => !isRequestConfirmed(r))
  const cupo = armarCupo(conflictos, porId)
  const porCupo = cupo.length > 0
  const pedidas = cupo.length > 0 ? Math.max(...cupo.map(l => l.pedidas)) : 0
  const limite = cupo.length > 0 ? cupo[0].limite : 0
  const n = otras.length

  const titulo = nivel === 'sin-conexion' ? 'Se confirmó sin conexión y chocó'
    : nivel === 'bloqueo' ? `Fecha ocupada · ${confirmadas.length} ${confirmadas.length === 1 ? 'reserva confirmada' : 'reservas confirmadas'}`
    : nivel === 'confirmada' ? 'Otras solicitudes piden estas fechas'
    : `Se cruza con ${n} ${n === 1 ? 'solicitud' : 'solicitudes'}`
  const subtitulo = nivel === 'cruce' && n > 1
    ? [confirmadas.length ? `${confirmadas.length} ${confirmadas.length === 1 ? 'confirmada' : 'confirmadas'}` : '', pendientes.length ? `${pendientes.length} ${pendientes.length === 1 ? 'pendiente' : 'pendientes'}` : ''].filter(Boolean).join(' · ')
    : nombresCortos((confirmadas.length > 0 && nivel !== 'confirmada' ? confirmadas : otras).map(r => r.clientName))

  const frase = nivel === 'sin-conexion'
    ? 'Se confirmó sin internet y, al sincronizar, ya había otra reserva confirmada que choca. Quedó pendiente: no se perdió.'
    : nivel === 'bloqueo'
      ? (porCupo
        ? 'Lo ya confirmado deja sin cupo para esta solicitud, así que no se puede aprobar.'
        : `Ya ${confirmadas.length === 1 ? 'hay una reserva confirmada' : `hay ${confirmadas.length} reservas confirmadas`} dentro de estas fechas, así que esta no se puede aprobar.`)
      : nivel === 'confirmada'
        ? 'Esta reserva ya está confirmada. Las solicitudes pendientes que se topan con ella no se podrán aprobar mientras siga en pie.'
        : porCupo
          ? `Entre todas piden ${pedidas} personas y el cupo es de ${limite}.`
          : `${n === 1 ? '1 solicitud pide' : `${n} solicitudes piden`} esta misma cabaña en fechas que se pisan.${confirmadas.length === 0 ? ' Ninguna está confirmada.' : ''}`

  const siApruebas = nivel === 'cruce' ? efectoDeAprobar(solicitud, pendientes, conflictos, porId) : null

  let paraMover = ''
  if (nivel === 'bloqueo' || nivel === 'sin-conexion') {
    if (porCupo) {
      const libres = Math.min(...cupo.map(l => l.libres))
      paraMover = `Cupo libre en esas fechas: ${libres} ${libres === 1 ? 'persona' : 'personas'}.`
    } else {
      paraMover = huecoLibreDeCabana(solicitud, solicitudes)
    }
  }

  return {
    nivel,
    titulo,
    subtitulo,
    frase,
    propia: armarFila(solicitud, solicitud, ahora),
    otras: otras.map(r => armarFila(r, solicitud, ahora)),
    cupo,
    siApruebas,
    paraMover
  }
}
