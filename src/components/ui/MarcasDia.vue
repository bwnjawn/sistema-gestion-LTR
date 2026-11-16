<script setup lang="ts">
import type { ResumenDia } from '../../services/availability'

defineProps<{ resumen: ResumenDia }>()
</script>

<template>
  <!-- Número = reservas confirmadas (trabajo); punto ámbar = hay algo por resolver. El fondo rojo lo pone cada casilla. -->
  <span
    v-if="resumen.confirmadas > 0"
    class="min-w-4 px-1 rounded-full bg-brand-dark text-white text-xs font-black leading-4 text-center"
    aria-hidden="true"
  >{{ resumen.confirmadas }}</span>
  <span
    v-if="resumen.hayPorResolver"
    class="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-white border-2 border-amber-600"
    aria-hidden="true"
  ></span>
  <span class="sr-only">
    {{ resumen.lleno ? 'Lleno. ' : '' }}{{ resumen.confirmadas }} reservas confirmadas{{ resumen.hayPorResolver ? '. Hay pendientes o reservas que se topan' : '' }}
  </span>
</template>
