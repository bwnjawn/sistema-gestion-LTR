// src/lib/persistirConReversion.ts
// Patrón de todas las acciones de los stores (SCRUM-246): se aplica el cambio en pantalla, se guarda por el
// repositorio y, si el guardado falla, el cambio se revierte y se avisa. Así la pantalla nunca dice "guardado"
// cuando no lo está. Y al revés (SCRUM-288): cuando sí se guardó, avisa arriba qué se hizo.

import { avisarError, avisarExito, type MensajeAviso } from './avisos'
import { mensajeDeError } from './errores'

export interface OpcionesReversion<T> {
  /** Cambia el estado en pantalla. */
  aplicar: () => void
  /** Deja el estado como estaba antes de `aplicar`. */
  revertir: () => void
  /** Guarda por el repositorio. */
  persistir: () => Promise<T>
  /** Texto para el usuario si falla y el error no trae uno propio. */
  mensaje: string
  /**
   * Aviso verde cuando se guardó. Puede ser una función que se evalúa después de guardar: devuelve `null` si no hay
   * nada que avisar (por ejemplo, porque la acción quedó en la cola sin conexión y ya avisó otra cosa).
   */
  exito?: MensajeAviso | (() => MensajeAviso | null)
}

/**
 * Ejecuta el patrón. Si falla, revierte, muestra el aviso global y vuelve a lanzar el error
 * (quien llama decide si lo propaga o solo registra `error` en su store).
 */
export async function persistirConReversion<T>(opciones: OpcionesReversion<T>): Promise<T> {
  opciones.aplicar()
  let resultado: T
  try {
    resultado = await opciones.persistir()
  } catch (error) {
    opciones.revertir()
    avisarError(mensajeDeError(error, opciones.mensaje))
    console.error(`[Persistencia] ${opciones.mensaje}`, error)
    throw error
  }
  const exito = typeof opciones.exito === 'function' ? opciones.exito() : opciones.exito
  if (exito) avisarExito(exito.titulo, exito.detalle, exito.tono)
  return resultado
}
