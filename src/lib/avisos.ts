// src/lib/avisos.ts
// Aviso global que confirma lo que pasó con una acción (SCRUM-288). Lo muestra `components/ui/AvisoAccion.vue`,
// montado una sola vez en `App.vue`. Hay un solo aviso a la vez: uno nuevo reemplaza al anterior.
// Los colores copian los de las insignias de estado de la app:
//  - verde (exito): se guardó o se aprobó algo · gris (descartado): se rechazó, canceló o quitó algo ·
//    ámbar (atencion): quedó bien pero pide revisar algo · azul (cola): guardado solo en este teléfono ·
//    rojo (error): no se pudo guardar.
//  - Todos menos el rojo se van solos a los 4 segundos (o con un toque). El rojo se queda hasta que se cierra:
//    el error no debe pasar sin que se lea.

import { computed, ref } from 'vue'

/** Cómo se ve un aviso de algo que sí se guardó. */
export type TonoAviso = 'exito' | 'descartado' | 'atencion'

export type TipoAviso = TonoAviso | 'cola' | 'error'

export interface Aviso {
  /** Cambia con cada aviso, para que la pantalla reinicie su animación aunque el texto se repita. */
  id: number
  tipo: TipoAviso
  titulo: string
  detalle?: string
}

/** Texto de un aviso de éxito: un título corto y, si ayuda, a quién o a qué se refiere. */
export interface MensajeAviso {
  titulo: string
  detalle?: string
  /** Verde por defecto; gris si se descartó, canceló o quitó algo; ámbar si pide revisar algo. */
  tono?: TonoAviso
}

export const DURACION_AVISO_MS = 4000
export const TITULO_AVISO_ERROR = 'No se guardó el cambio'
export const TITULO_AVISO_COLA = 'Guardado en este teléfono'

export const aviso = ref<Aviso | null>(null)

/** El texto del aviso rojo, si es el que está a la vista (así lo leen las pruebas y los que ya existían). */
export const avisoDeError = computed(() => (aviso.value?.tipo === 'error' ? aviso.value.detalle ?? null : null))

let contador = 0
let reloj: ReturnType<typeof setTimeout> | null = null

function mostrar(tipo: TipoAviso, titulo: string, detalle?: string): void {
  if (reloj) clearTimeout(reloj)
  reloj = null
  aviso.value = { id: ++contador, tipo, titulo, ...(detalle ? { detalle } : {}) }
  if (tipo !== 'error') reloj = setTimeout(descartarAviso, DURACION_AVISO_MS)
}

/** Lo que se hizo quedó guardado. El tono dice si fue algo positivo, algo que se descartó o algo que pide atención. */
export function avisarExito(titulo: string, detalle?: string, tono: TonoAviso = 'exito'): void {
  mostrar(tono, titulo, detalle)
}

/** La acción quedó guardada solo en este teléfono y se enviará al volver la señal (SCRUM-250). */
export function avisarGuardadoSinConexion(detalle: string): void {
  mostrar('cola', TITULO_AVISO_COLA, detalle)
}

/** Algo no se pudo guardar. El texto explica por qué. */
export function avisarError(mensaje: string): void {
  mostrar('error', TITULO_AVISO_ERROR, mensaje)
}

export function descartarAviso(): void {
  if (reloj) clearTimeout(reloj)
  reloj = null
  aviso.value = null
}
