import { defineAsyncComponent, type Component } from 'vue'
import type { ServiceType } from '../../types/domain'

/**
 * Ayudas del flujo de reserva del cliente. El botón "?" del encabezado aparece cuando el paso tiene una ayuda
 * registrada aquí con la clave `<servicio>-<paso>`; el último paso de cada flujo usa siempre `AYUDA_ULTIMO_PASO`.
 * Para sumar otra: crear el componente y registrarlo aquí. Las pantallas autoexplicativas no llevan ayuda.
 */
export interface AyudaDePaso {
  titulo: string
  contenido: Component
}

export const AYUDA_ULTIMO_PASO: AyudaDePaso = {
  titulo: 'Antes de enviar',
  contenido: defineAsyncComponent(() => import('./AyudaPasoFinal.vue'))
}

const AYUDAS_POR_PASO: Record<string, AyudaDePaso> = {
  'camping-1': {
    titulo: 'Modalidad y fecha',
    contenido: defineAsyncComponent(() => import('./AyudaCampingModalidad.vue'))
  },
  'restaurante-1': {
    titulo: 'Fecha, comidas y hora',
    contenido: defineAsyncComponent(() => import('./AyudaRestauranteHorario.vue'))
  },
  'restaurante-2': {
    titulo: 'Elegir el menú',
    contenido: defineAsyncComponent(() => import('./AyudaRestauranteMenu.vue'))
  },
  'piscina-1': {
    titulo: 'Cuándo reservar la piscina',
    contenido: defineAsyncComponent(() => import('./AyudaPiscina.vue'))
  }
}

/** Ayuda de un paso del flujo, o `null` si no lleva. */
export function ayudaDelPaso(servicio: ServiceType, paso: number, totalPasos: number): AyudaDePaso | null {
  if (paso === totalPasos) return AYUDA_ULTIMO_PASO
  return AYUDAS_POR_PASO[`${servicio}-${paso}`] ?? null
}
