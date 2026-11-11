// src/services/mensajesCliente.ts
// Textos prearmados que el administrador envía al cliente (SCRUM-262).
// La app nunca envía nada sola: solo arma el texto y el administrador lo manda por WhatsApp o correo.

import type { ReservationRequest } from '../types/domain'
import { formatDateShort } from '../lib/dates'
import { getRequestDateRange } from './availability'

/** Fechas de la solicitud para un mensaje: "10 mar" o "10 mar al 12 mar". */
export function describirFechasSolicitud(solicitud: ReservationRequest): string {
  const { start, end } = getRequestDateRange(solicitud)
  if (!start) return 'solicitada'
  return end ? `${formatDateShort(start)} al ${formatDateShort(end)}` : formatDateShort(start)
}

/** Mensaje para el cliente cuya fecha ya no está disponible. No propone fechas: las acuerda el administrador. */
export function buildMensajeFechaNoDisponible(solicitud: ReservationRequest): string {
  return (
    `Hola ${solicitud.clientName}, te escribimos de Los Troncos de Repil por tu solicitud ${solicitud.requestCode}. ` +
    `Lamentablemente la fecha ${describirFechasSolicitud(solicitud)} ya no está disponible. ` +
    '¿Te acomoda otra fecha? Quedamos atentos.'
  )
}

/** Asunto del correo para avisar que la fecha ya no está disponible. */
export function buildAsuntoFechaNoDisponible(solicitud: ReservationRequest): string {
  return `Tu solicitud ${solicitud.requestCode} - Los Troncos de Repil`
}
