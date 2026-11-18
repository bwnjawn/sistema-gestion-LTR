import { defineAsyncComponent, type Component } from 'vue'

/**
 * Ayudas del panel de administración. Una sección tiene botón "?" en el encabezado cuando su ruta declara
 * `meta.ayuda` con una de estas claves (ver router). Para sumar otra: crear el componente y registrarlo aquí.
 */
export const AYUDAS_ADMIN: Record<string, { titulo: string; contenido: Component }> = {
  calendario: {
    titulo: 'Marcas del calendario',
    contenido: defineAsyncComponent(() => import('./AyudaCalendario.vue'))
  },
  ajustes: {
    titulo: 'Qué se ajusta aquí',
    contenido: defineAsyncComponent(() => import('./AyudaAjustes.vue'))
  },
  catalogo: {
    titulo: 'Cómo editar el catálogo',
    contenido: defineAsyncComponent(() => import('./AyudaCatalogo.vue'))
  },
  solicitudes: {
    titulo: 'Estados de las solicitudes',
    contenido: defineAsyncComponent(() => import('./AyudaSolicitudes.vue'))
  }
}
