<script setup lang="ts">
import { ShieldCheck, LogOut } from 'lucide-vue-next'

// Franja del modo administrador (SCRUM-56). En los pasos ya hay una X para salir;
// en la pantalla de inicio se agrega el botón "Salir".
defineProps<{ conSalir?: boolean }>()
defineEmits<{ (e: 'salir'): void }>()
</script>

<template>
  <div
    role="status"
    class="flex items-center justify-center gap-2 bg-brand-dark text-white px-4 py-2 text-sm font-black"
  >
    <ShieldCheck class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
    <span :class="conSalir ? 'grow' : ''">Modo administrador: la reserva queda confirmada</span>
    <button
      v-if="conSalir"
      type="button"
      class="shrink-0 inline-flex items-center gap-1.5 rounded-full border-2 border-white/70 px-3 py-1.5 text-sm font-black active:scale-95 transition-transform touch-target"
      @click="$emit('salir')"
    >
      <LogOut class="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
      Salir
    </button>
  </div>
</template>
