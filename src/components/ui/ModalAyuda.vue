<script setup lang="ts">
import { toRef } from 'vue'
import { X } from 'lucide-vue-next'
import { useBloqueoScroll } from '../../composables/useBloqueoScroll'

const props = defineProps<{ abierto: boolean; titulo: string }>()
const emit = defineEmits<{ (e: 'cerrar'): void }>()

useBloqueoScroll(toRef(props, 'abierto'))
</script>

<template>
  <!-- Teleport: el encabezado tiene backdrop-blur y ese efecto encierra a los elementos fijos que lleva dentro -->
  <Teleport to="body">
    <div
      v-if="abierto"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="emit('cerrar')"
      @keydown.esc="emit('cerrar')"
    >
      <div
        role="dialog"
        aria-modal="true"
        :aria-label="titulo"
        class="bg-white w-full max-w-sm rounded-3xl border-2 border-brand-border shadow-2xl p-5 space-y-4 max-h-[85dvh] overflow-y-auto"
      >
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-base font-bold text-brand-dark">{{ titulo }}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            @click="emit('cerrar')"
            class="w-9 h-9 rounded-full bg-brand-light border-2 border-brand-border text-brand-dark active:scale-95 transition-transform touch-target flex items-center justify-center shrink-0"
          >
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
        <slot />
      </div>
    </div>
  </Teleport>
</template>
