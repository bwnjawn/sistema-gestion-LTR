<script setup lang="ts">
import { computed } from 'vue'
import type { Dish } from '../../types/catalog'
import { formatCLP } from '../../lib/format'
import { ETIQUETAS_COMIDA } from '../../services/menus'

const props = defineProps<{ dish: Dish }>()

const formattedPrice = computed(() => formatCLP(props.dish.price))

const displayImage = computed(() => {
  return props.dish.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
})

const categoryLabel = computed(() => ETIQUETAS_COMIDA[props.dish.mealType])

/** Línea con los acompañamientos del plato; vacía si no lleva. */
const lineaAcompanamiento = computed(() => {
  if (props.dish.sideMode === 'choice' && props.dish.availableSides.length > 0) {
    return `A elección: ${props.dish.availableSides.join(', ')}`
  }
  if (props.dish.sideMode === 'fixed' && props.dish.fixedSide) return `Incluye: ${props.dish.fixedSide}`
  return ''
})
</script>

<template>
  <article class="bg-white rounded-2xl border border-gray-300 p-3 flex gap-3">
    <img :src="displayImage" :alt="dish.name" class="w-20 h-20 rounded-xl object-cover shrink-0 bg-gray-100" />

    <div class="flex-1 min-w-0">
      <!-- Nombre y datos a la izquierda; el menú de opciones, arriba a la derecha (sin ocupar una fila propia) -->
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <h3 class="text-base font-bold text-brand-dark leading-snug">{{ dish.name }}</h3>
          <p class="text-base text-gray-600">{{ categoryLabel }} · {{ formattedPrice }}</p>
        </div>
        <div class="-mt-1 -mr-1 shrink-0">
          <slot name="menu" :dish="dish" />
        </div>
      </div>

      <p v-if="dish.description" class="mt-1 text-base text-gray-700 line-clamp-2">{{ dish.description }}</p>
      <p v-if="lineaAcompanamiento" class="mt-1 text-base text-gray-600 line-clamp-2">{{ lineaAcompanamiento }}</p>
    </div>
  </article>
</template>
