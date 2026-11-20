<script setup lang="ts">
// Lista de textos cortos, uno por fila, con un botón para quitar cada uno. La usan los formularios de edición
// del catálogo (acompañamientos de un plato, servicios incluidos de una cabaña o un espacio de camping).
// Colores neutros: sin fondos de color, para que el formulario no se vea recargado.
import { X } from 'lucide-vue-next'

defineProps<{
  items: string[]
  /** Texto que se muestra mientras la lista está vacía. */
  vacio: string
}>()

const emit = defineEmits<{ (e: 'quitar', item: string): void }>()
</script>

<template>
  <p v-if="items.length === 0" class="text-sm text-gray-600">{{ vacio }}</p>
  <ul v-else class="border border-gray-300 rounded-xl divide-y divide-gray-200 bg-white">
    <li v-for="item in items" :key="item" class="flex items-center justify-between gap-2 pl-4 pr-1">
      <span class="py-3 text-base text-brand-text min-w-0 break-words">{{ item }}</span>
      <button
        type="button"
        :aria-label="`Quitar ${item}`"
        class="w-11 h-11 shrink-0 flex items-center justify-center rounded-lg text-gray-600 active:text-rose-700 active:bg-rose-50"
        @click="emit('quitar', item)"
      >
        <X class="w-5 h-5 stroke-2" />
      </button>
    </li>
  </ul>
</template>
