// src/services/mensajesAvisos.ts
// Textos del aviso que confirma cada acción del administrador (SCRUM-288). Solo arma los textos: los stores los
// pasan a `persistirConReversion` y `lib/avisos.ts` los muestra arriba.
//  - Título corto en la voz de lo ocurrido ("Solicitud aprobada") y, debajo, a quién o a qué se refiere.
//  - El tono sigue los colores de las insignias de estado: verde = se guardó o se aprobó algo; gris = se rechazó,
//    canceló o quitó algo (como "Descartada"); ámbar = quedó bien pero pide revisar algo.
//  - Cada acción de solicitudes lleva además una frase en infinitivo (`accion`) para el aviso azul: cuando queda
//    guardada solo en el teléfono dice qué falta enviar, nunca "listo".

import type { BookingStatus, ReservationRequest } from '../types/domain'
import type { MensajeAviso } from '../lib/avisos'
import { formatCLP } from '../lib/format'
import { describirFechasSolicitud } from './mensajesCliente'

/** Aviso de una acción sobre una solicitud, con la frase que se usa si queda guardada sin conexión. */
export interface AvisoDeAccion extends MensajeAviso {
  /** "Aprobar la solicitud de Ana Pérez": lo que se enviará al volver la señal. */
  accion: string
}

const quien = (req: Pick<ReservationRequest, 'clientName' | 'resourceName'>): string => `${req.clientName} · ${req.resourceName}`

/** Lo que dice el aviso azul: qué quedó pendiente de enviar. */
export function textoGuardadoSinConexion(aviso: Pick<AvisoDeAccion, 'accion'>): string {
  return `${aviso.accion}. Se enviará cuando vuelva la señal.`
}

// ---------------------------------------------------------------------------
// Solicitudes
// ---------------------------------------------------------------------------

/** Aviso de un cambio de estado: aprobar, rechazar o cancelar. */
export function avisoDeEstado(anterior: BookingStatus, nuevo: BookingStatus, req: ReservationRequest): AvisoDeAccion {
  if (nuevo === 'confirmed') {
    return { titulo: 'Solicitud aprobada', detalle: quien(req), accion: `Aprobar la solicitud de ${req.clientName}` }
  }
  if (nuevo === 'rejected') {
    return { titulo: 'Solicitud rechazada', detalle: quien(req), accion: `Rechazar la solicitud de ${req.clientName}`, tono: 'descartado' }
  }
  if (nuevo === 'cancelled' && anterior === 'confirmed') {
    return {
      titulo: 'Reserva cancelada',
      detalle: `${quien(req)}. Las fechas quedaron libres.`,
      accion: `Cancelar la reserva de ${req.clientName}`,
      tono: 'descartado'
    }
  }
  if (nuevo === 'cancelled') {
    return { titulo: 'Solicitud cancelada', detalle: quien(req), accion: `Cancelar la solicitud de ${req.clientName}`, tono: 'descartado' }
  }
  return { titulo: 'Estado cambiado', detalle: quien(req), accion: `Cambiar el estado de la solicitud de ${req.clientName}` }
}

export function avisoPlazoAmpliado(req: ReservationRequest, horas: number): AvisoDeAccion {
  return {
    titulo: 'Plazo ampliado',
    detalle: `${req.clientName}: ${horas} horas más para el abono.`,
    accion: `Dar más plazo de abono a ${req.clientName}`
  }
}

/** Aviso de una edición: si solo cambiaron las fechas se llama "Fecha movida". */
export function avisoDeEdicion(antes: ReservationRequest, despues: ReservationRequest): AvisoDeAccion {
  const mismasPersonas = antes.guestsCount === despues.guestsCount
  const mismosDatos =
    antes.clientName === despues.clientName &&
    antes.clientPhone === despues.clientPhone &&
    (antes.clientEmail ?? '') === (despues.clientEmail ?? '') &&
    (antes.details?.comments ?? '') === (despues.details?.comments ?? '')
  const fechasCambiaron = describirFechasSolicitud(antes) !== describirFechasSolicitud(despues)
  if (fechasCambiaron && mismasPersonas && mismosDatos) {
    return {
      titulo: 'Fecha movida',
      detalle: `${despues.clientName}: ${describirFechasSolicitud(despues)}`,
      accion: `Mover la fecha de ${despues.clientName}`
    }
  }
  return { titulo: 'Cambios guardados', detalle: quien(despues), accion: `Guardar los cambios de ${despues.clientName}` }
}

export function avisoDePago(accion: 'registrado' | 'quitado', req: ReservationRequest, monto?: number): AvisoDeAccion {
  const importe = monto ? `${formatCLP(monto)} de ` : ''
  return accion === 'registrado'
    ? { titulo: 'Pago registrado', detalle: `${importe}${req.clientName}`, accion: `Registrar el pago de ${req.clientName}` }
    : { titulo: 'Pago quitado', detalle: `${importe}${req.clientName}`, accion: `Quitar el pago de ${req.clientName}`, tono: 'descartado' }
}

/** Al volver la señal y enviarse los cambios que estaban en el teléfono. */
export function avisoSincronizacion(enviados: number, enConflicto: number): MensajeAviso {
  const cambios = enviados === 1 ? 'Se envió 1 cambio.' : `Se enviaron ${enviados} cambios.`
  const conflicto = enConflicto === 0
    ? ''
    : enConflicto === 1
      ? ' 1 reserva quedó en conflicto: revísala en Inicio.'
      : ` ${enConflicto} reservas quedaron en conflicto: revísalas en Inicio.`
  // Si alguna reserva quedó en conflicto, no es un "todo bien": pide revisar
  return { titulo: 'Cambios sincronizados', detalle: `${cambios}${conflicto}`, ...(enConflicto > 0 ? { tono: 'atencion' as const } : {}) }
}

// ---------------------------------------------------------------------------
// Catálogo
// ---------------------------------------------------------------------------

export type EntidadCatalogo = 'cabana' | 'camping' | 'plato'

const ENTIDADES: Record<EntidadCatalogo, { nombre: string; femenino: boolean }> = {
  cabana: { nombre: 'Cabaña', femenino: true },
  camping: { nombre: 'Espacio de camping', femenino: false },
  plato: { nombre: 'Plato', femenino: false }
}

const participio = (e: EntidadCatalogo, masculino: string): string =>
  ENTIDADES[e].femenino ? masculino.replace(/o$/, 'a') : masculino

export function avisoCatalogoAgregado(entidad: EntidadCatalogo, nombre: string): MensajeAviso {
  return { titulo: `${ENTIDADES[entidad].nombre} ${participio(entidad, 'agregado')}`, detalle: nombre }
}

/** Un cambio en una cabaña, un espacio o un plato: dar de baja, activar, mantención o guardar la edición. */
export function avisoCatalogoCambiado(
  entidad: EntidadCatalogo,
  nombre: string,
  cambios: { isActive?: boolean; enMantencion?: boolean }
): MensajeAviso {
  const base = ENTIDADES[entidad].nombre
  const soloEstado = Object.keys(cambios).length === 1
  if (soloEstado && cambios.isActive === false) return { titulo: `${base} ${participio(entidad, 'dado')} de baja`, detalle: nombre, tono: 'descartado' }
  if (soloEstado && cambios.isActive === true) return { titulo: `${base} ${participio(entidad, 'activado')}`, detalle: nombre }
  if (soloEstado && cambios.enMantencion === true) return { titulo: `${base} en mantención`, detalle: nombre, tono: 'descartado' }
  if (soloEstado && cambios.enMantencion === false) return { titulo: `${base} ${participio(entidad, 'disponible')}`, detalle: nombre }
  return { titulo: `${base} ${participio(entidad, 'guardado')}`, detalle: nombre }
}

export function avisoAcompanamiento(accion: 'agregado' | 'renombrado' | 'quitado', nombre: string): MensajeAviso {
  const titulo = accion === 'agregado' ? 'Acompañamiento agregado' : accion === 'renombrado' ? 'Acompañamiento actualizado' : 'Acompañamiento quitado'
  return { titulo, detalle: nombre, ...(accion === 'quitado' ? { tono: 'descartado' as const } : {}) }
}

// ---------------------------------------------------------------------------
// Ajustes
// ---------------------------------------------------------------------------

export const AVISOS_DE_AJUSTES = {
  contacto: { titulo: 'Datos de contacto guardados' },
  transferencia: { titulo: 'Datos de transferencia guardados' },
  parametros: { titulo: 'Parámetros guardados' },
  cupos: { titulo: 'Reglas de cupos guardadas' },
  horariosCamping: { titulo: 'Horarios del camping guardados' },
  horariosRestaurante: { titulo: 'Horarios del restaurante guardados' },
  horariosCabanas: { titulo: 'Horarios de las cabañas guardados' },
  reglamentoQuitado: { titulo: 'Reglamento quitado', detalle: 'El cliente ya no lo ve.', tono: 'descartado' },
  fotoGuardada: { titulo: 'Foto del inicio guardada' },
  fotoRestaurada: { titulo: 'Foto original restaurada' }
} satisfies Record<string, MensajeAviso>

export function avisoReglamentoSubido(nombreArchivo: string): MensajeAviso {
  return { titulo: 'Reglamento subido', detalle: nombreArchivo }
}
