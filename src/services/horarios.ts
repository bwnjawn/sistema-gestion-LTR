// src/services/horarios.ts
// Horarios que edita el administrador en el Catálogo (SCRUM-280): opciones de hora, validación y armado de lo que se guarda.
// El cliente ve estos horarios en sus pantallas; en el restaurante elige una hora de la lista de medias horas del rango.

import { horasDeComida, minutosDeTexto, textoDeMinutos } from './availability'
import type { CabinSchedules, CampingSchedules, ServiceSchedule } from '../types/settings'

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/

/** Una hora ingreso/salida: el administrador elige la de entrada y la de salida. */
export interface ParDeHoras {
  ingreso: string
  salida: string
}

/**
 * Horas que ofrece el selector: de media en media hora, de 00:00 a 23:30. Si la hora guardada no cae en una
 * media hora (por ejemplo 09:15), se conserva como opción para no perderla ni cambiarla sin querer.
 */
export function opcionesDeHora(actual?: string, pasoMinutos: number = 30): string[] {
  const lista: string[] = []
  for (let m = 0; m < 24 * 60; m += pasoMinutos) lista.push(textoDeMinutos(m))
  if (actual && HORA_VALIDA.test(actual) && !lista.includes(actual)) {
    lista.push(actual)
    lista.sort()
  }
  return lista
}

/** Texto del horario que acompaña a una reserva: "Día de ingreso (15:00 hrs) - Día de salida (11:00 hrs)". */
export function describirHorario(ingreso: string, salida: string, mismoDia: boolean): string {
  return `Día de ingreso (${ingreso} hrs) - ${mismoDia ? 'Día de ingreso' : 'Día de salida'} (${salida} hrs)`
}

/** Camping por el día: entra y sale el mismo día, así que la salida debe ser después del ingreso. `null` si está bien. */
export function validarHorarioDelDia(ingreso: string, salida: string): string | null {
  const desde = minutosDeTexto(ingreso)
  const hasta = minutosDeTexto(salida)
  if (desde === null || hasta === null) return 'Elige una hora de ingreso y una de salida.'
  if (hasta <= desde) return 'La salida debe ser después del ingreso, porque el cliente entra y sale el mismo día.'
  return null
}

/** Rango de una comida del restaurante: la última hora no puede ser antes de la primera y debe caber al menos una media hora. */
export function validarRangoComida(inicio: string, fin: string): string | null {
  const desde = minutosDeTexto(inicio)
  const hasta = minutosDeTexto(fin)
  if (desde === null || hasta === null) return 'Elige la primera y la última hora.'
  if (hasta < desde) return 'La última hora no puede ser antes de la primera.'
  if (horasDeComida({ start: inicio, end: fin }).length === 0) return 'Entre esas horas no cae ninguna media hora exacta (:00 o :30).'
  return null
}

/** Lo que se guarda de una comida: el rango y la lista de horas que ve el cliente. */
export function armarComida(inicio: string, fin: string): ServiceSchedule {
  return { start: inicio, end: fin, times: horasDeComida({ start: inicio, end: fin }) }
}

export function armarHorarioCabana(ingreso: string, salida: string): CabinSchedules {
  return { checkIn: ingreso, checkOut: salida, display: describirHorario(ingreso, salida, false) }
}

export function armarHorarioCamping(diario: ParDeHoras, pernoctar: ParDeHoras): CampingSchedules {
  return {
    diario: { checkIn: diario.ingreso, checkOut: diario.salida, display: describirHorario(diario.ingreso, diario.salida, true) },
    pernoctar: { checkIn: pernoctar.ingreso, checkOut: pernoctar.salida, display: describirHorario(pernoctar.ingreso, pernoctar.salida, false) }
  }
}
