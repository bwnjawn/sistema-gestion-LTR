<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronLeft, CircleHelp, X, WifiOff } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'

// Barra superior del cliente. Sin atrás ni cerrar muestra el logo (Contacto);
// con ellos es la barra del flujo de reserva.
defineProps<{
  titulo: string
  subtitulo?: string
  conVolver?: boolean
  conCerrar?: boolean
  /** Muestra el botón "?" que abre la ayuda del paso. */
  conAyuda?: boolean
}>()

defineEmits<{ (e: 'volver'): void; (e: 'cerrar'): void; (e: 'ayuda'): void }>()

const settingsStore = useSettingsStore()

// Publica la altura real del encabezado (con la zona segura y el aviso sin conexión) como `--alto-encabezado`,
// para que las franjas que se quedan pegadas debajo (por ejemplo la del paso 2 del restaurante) sepan dónde empezar.
const encabezado = ref<HTMLElement | null>(null)
let observador: ResizeObserver | undefined
onMounted(() => {
  if (!encabezado.value || typeof ResizeObserver === 'undefined') return
  const publicar = () => {
    if (encabezado.value) document.documentElement.style.setProperty('--alto-encabezado', `${encabezado.value.offsetHeight}px`)
  }
  publicar()
  observador = new ResizeObserver(publicar)
  observador.observe(encabezado.value)
})
onBeforeUnmount(() => {
  observador?.disconnect()
  document.documentElement.style.removeProperty('--alto-encabezado')
})
</script>

<template>
  <header ref="encabezado" class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-brand-border shadow-2xs pt-[env(safe-area-inset-top,0px)]">
    <div class="max-w-md lg:max-w-5xl lg:px-0 lg:h-16 mx-auto w-full px-2 h-14 flex items-center gap-1">
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
        <h1 class="text-xl font-bold text-brand-dark leading-tight truncate">{{ titulo }}</h1>
        <p v-if="subtitulo" class="text-sm text-gray-700 leading-tight truncate">{{ subtitulo }}</p>
      </div>

      <!-- Sin borde ni fondo: el ícono ya es un círculo y un marco lo dejaría doble -->
      <button
        v-if="conAyuda"
        type="button"
        class="touch-target shrink-0 inline-flex items-center justify-center text-brand-dark active:scale-90 transition-transform"
        aria-label="Ayuda de este paso"
        @click="$emit('ayuda')"
      >
        <CircleHelp class="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
      </button>

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
      <p class="max-w-md lg:max-w-5xl mx-auto px-4 py-2 flex items-center gap-2 text-sm font-bold">
        <WifiOff class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
        Sin conexión. Puedes enviar: se guardará y se mandará al volver la señal.
      </p>
    </div>
  </header>
</template>
