<script setup lang="ts">
// Tarjeta con foto de los servicios extra del home (Piscina y Evento especial), con el mismo
// lenguaje visual de las tarjetas de Cabaña, Camping y Restaurante pero más baja.
// Si la foto no carga (por ejemplo sin conexión), queda el fondo verde con el ícono grande (lo resuelve FondoFotoTarjeta).
import type { Component } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import FondoFotoTarjeta from './FondoFotoTarjeta.vue'

defineProps<{
  titulo: string
  subtitulo: string
  /** Aviso corto bajo el subtítulo (por ejemplo, que la piscina es gratis con otro servicio). */
  nota?: string
  /** Foto: dirección web o archivo dentro de `public/images`. */
  imagen?: string
  icono: Component
}>()

defineEmits<{ (e: 'click'): void }>()

</script>

<template>
  <button
    type="button"
    class="relative h-40 lg:h-52 w-full rounded-3xl overflow-hidden border-2 border-brand-border shadow-sm text-left group active:scale-98 transition-all touch-target bg-gradient-to-br from-brand-dark to-brand-accent"
    @click="$emit('click')"
  >
    <component
      :is="icono"
      class="absolute -right-3 -top-3 w-24 h-24 text-white/15 stroke-[1.5]"
      aria-hidden="true"
    />
    <FondoFotoTarjeta :imagen="imagen" />

    <div class="absolute bottom-3.5 left-3.5 right-3.5 flex items-end justify-between gap-2 text-white">
      <div class="min-w-0">
        <h3 class="text-xl font-bold leading-tight drop-shadow-sm">{{ titulo }}</h3>
        <p class="text-sm font-bold text-gray-200 mt-0.5 leading-tight">{{ subtitulo }}</p>
        <p v-if="nota" class="text-sm font-bold text-amber-200 mt-1 leading-tight">{{ nota }}</p>
      </div>
      <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-brand-dark transition-colors">
        <ChevronRight class="w-5 h-5 stroke-[2.5]" />
      </div>
    </div>
  </button>
</template>
