<script setup lang="ts">
// Ícono de la barra inferior. Inactivo: solo contorno. Activo: relleno, con los detalles en blanco
// (como Instagram). Los trazos vienen de Lucide; Lucide no trae versión rellena, por eso se dibujan aquí.
import { computed } from 'vue'

export type NombreIconoBarra = 'inicio' | 'solicitudes' | 'calendario' | 'catalogo' | 'ajustes' | 'contacto'

interface Trazos {
  /** Forma principal: se rellena cuando está activo. */
  cuerpo: string
  /** Trazos que sobresalen de la forma: siempre en contorno. */
  fuera?: string[]
  /** Detalles dentro de la forma: en blanco cuando está activo. */
  detalle: string[]
}

const ICONOS: Record<NombreIconoBarra, Trazos> = {
  inicio: {
    cuerpo: 'M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    detalle: ['M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8']
  },
  solicitudes: {
    cuerpo: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
    fuera: ['M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z'],
    detalle: ['M12 11h4', 'M12 16h4', 'M8 11h.01', 'M8 16h.01']
  },
  calendario: {
    cuerpo: 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    fuera: ['M8 2v4', 'M16 2v4'],
    detalle: ['M3 10h18']
  },
  catalogo: {
    cuerpo: 'M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z',
    detalle: ['M12 7v14']
  },
  ajustes: {
    cuerpo: 'M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915',
    detalle: ['M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z']
  },
  contacto: {
    cuerpo: 'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384',
    detalle: []
  }
}

const props = defineProps<{ nombre: NombreIconoBarra; activo: boolean }>()
const trazos = computed(() => ICONOS[props.nombre])
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="w-7 h-7"
    aria-hidden="true"
  >
    <path :d="trazos.cuerpo" :fill="activo ? 'currentColor' : 'none'" />
    <path v-for="d in trazos.fuera ?? []" :key="d" :d="d" />
    <path v-for="d in trazos.detalle" :key="d" :d="d" :stroke="activo ? '#fff' : 'currentColor'" />
  </svg>
</template>
