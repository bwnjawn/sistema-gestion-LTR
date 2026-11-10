<script setup lang="ts">
import { ChevronLeft, X, WifiOff } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'

// Barra superior del cliente. Sin atrás ni cerrar muestra el logo (Contacto);
// con ellos es la barra del flujo de reserva.
defineProps<{
  titulo: string
  subtitulo?: string
  conVolver?: boolean
  conCerrar?: boolean
}>()

defineEmits<{ (e: 'volver'): void; (e: 'cerrar'): void }>()

const settingsStore = useSettingsStore()
</script>

<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-brand-border shadow-2xs pt-[env(safe-area-inset-top,0px)]">
    <div class="max-w-md mx-auto w-full px-2 h-14 flex items-center gap-1">
      <button
        v-if="conVolver"
        type="button"
        class="touch-target shrink-0 inline-flex items-center justify-center rounded-full text-brand-dark hover:bg-brand-light active:scale-95 transition-all"
        aria-label="Volver al paso anterior"
        @click="$emit('volver')"
      >
        <ChevronLeft class="w-7 h-7 stroke-[2.5]" aria-hidden="true" />
      </button>
      <div
        v-else
        class="shrink-0 w-9 h-9 ml-2 rounded-full overflow-hidden border border-brand-border"
      >
        <img src="/images/logo-negro.png" alt="" class="w-full h-full object-cover" />
      </div>

      <div class="min-w-0 grow px-2">
        <h1 class="text-xl font-black text-brand-dark leading-tight truncate">{{ titulo }}</h1>
        <p v-if="subtitulo" class="text-sm font-bold text-gray-700 leading-tight truncate">{{ subtitulo }}</p>
      </div>

      <button
        v-if="conCerrar"
        type="button"
        class="touch-target shrink-0 inline-flex items-center justify-center rounded-full text-brand-dark hover:bg-brand-light active:scale-95 transition-all"
        aria-label="Salir de la reserva"
        @click="$emit('cerrar')"
      >
        <X class="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
      </button>
    </div>

    <!-- Solo aparece cuando no hay internet -->
    <div
      v-if="!settingsStore.isConnected"
      role="status"
      class="bg-amber-100 border-t-2 border-amber-500 text-amber-950"
    >
      <p class="max-w-md mx-auto px-4 py-2 flex items-center gap-2 text-sm font-black">
        <WifiOff class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
        Sin conexión a internet.
      </p>
    </div>
  </header>
</template>
