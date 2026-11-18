<script setup lang="ts">
// Contenido común de los modales de edición del catálogo (cabaña, camping y plato): encabezado, cuerpo con
// scroll y pie con los botones. Va dentro del panel del modal; el fondo oscuro y el panel los pone cada modal.
// Reglas visuales: solo el título y los botones van en negrita; el resto, en peso normal.
import { X } from 'lucide-vue-next'

defineProps<{
  titulo: string
  /** Texto pequeño bajo el título (por ejemplo, el nombre de lo que se edita). */
  subtitulo?: string
  textoGuardar: string
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar'): void
}>()
</script>

<template>
  <form class="flex flex-col min-h-0 grow" @submit.prevent="emit('guardar')">
    <header class="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-200 shrink-0">
      <div class="min-w-0">
        <h3 class="text-xl font-bold text-brand-dark leading-tight">{{ titulo }}</h3>
        <p v-if="subtitulo" class="text-sm text-gray-600 truncate">{{ subtitulo }}</p>
      </div>
      <button
        type="button"
        aria-label="Cerrar"
        class="w-11 h-11 shrink-0 flex items-center justify-center rounded-full border border-gray-300 bg-white text-brand-dark active:scale-95"
        @click="emit('cerrar')"
      >
        <X class="w-5 h-5 stroke-2" />
      </button>
    </header>

    <div class="overflow-y-auto grow px-5 py-5 space-y-5">
      <slot />
    </div>

    <footer class="flex gap-3 px-5 py-4 border-t border-gray-200 bg-white shrink-0">
      <button type="button" class="flex-1 py-3.5 rounded-2xl border border-brand-dark bg-white text-brand-dark font-bold" @click="emit('cerrar')">
        Cancelar
      </button>
      <button type="submit" class="flex-1 py-3.5 rounded-2xl border border-brand-dark bg-brand-dark text-white font-bold">
        {{ textoGuardar }}
      </button>
    </footer>
  </form>
</template>
