// Resumen del borrador de reserva para el panel lateral de los pasos en PC (SCRUM-278).
// Solo muestra lo que el cliente ya eligió; lo que falta no aparece.
import { formatDateShort, nightsBetween } from '../lib/dates'
import type { ServiceType } from '../types/domain'

export interface FilaResumen {
  etiqueta: string
  valor: string
}

export interface EntradaResumen {
  servicio: ServiceType
  fechaInicio: string
  fechaFin: string
  personas: number
  /** Nombre de la cabaña o del espacio de camping ya elegido ('' si aún no). */
  recurso: string
  modalidadCamping: 'diario' | 'pernoctar'
  /** Nombres de las comidas elegidas (restaurante). */
  comidas: string[]
}

export function filasResumenBorrador(e: EntradaResumen): FilaResumen[] {
  const filas: FilaResumen[] = []
  const conPersonas = () => {
    if (e.personas > 0) filas.push({ etiqueta: 'Personas', valor: String(e.personas) })
  }

  if (e.servicio === 'cabana') {
    if (e.recurso) filas.push({ etiqueta: 'Cabaña', valor: e.recurso })
    if (e.fechaInicio) filas.push({ etiqueta: 'Llegada', valor: formatDateShort(e.fechaInicio) })
    if (e.fechaFin) filas.push({ etiqueta: 'Salida', valor: formatDateShort(e.fechaFin) })
    if (e.fechaInicio && e.fechaFin) {
      const noches = nightsBetween(e.fechaInicio, e.fechaFin)
      if (noches > 0) filas.push({ etiqueta: 'Noches', valor: String(noches) })
    }
    conPersonas()
  } else if (e.servicio === 'camping') {
    if (e.recurso) filas.push({ etiqueta: 'Espacio', valor: e.recurso })
    filas.push({ etiqueta: 'Modalidad', valor: e.modalidadCamping === 'diario' ? 'Solo el día' : 'Pernoctar' })
    if (e.fechaInicio) filas.push({ etiqueta: 'Desde', valor: formatDateShort(e.fechaInicio) })
    if (e.fechaFin && e.modalidadCamping === 'pernoctar') filas.push({ etiqueta: 'Hasta', valor: formatDateShort(e.fechaFin) })
    conPersonas()
  } else {
    if (e.fechaInicio) filas.push({ etiqueta: 'Fecha', valor: formatDateShort(e.fechaInicio) })
    if (e.servicio === 'restaurante' && e.comidas.length > 0) filas.push({ etiqueta: 'Comidas', valor: e.comidas.join(', ') })
    conPersonas()
  }
  return filas
}
