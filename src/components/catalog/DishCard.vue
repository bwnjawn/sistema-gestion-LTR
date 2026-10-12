<script setup lang="ts">
import { computed } from 'vue'
import { Utensils, CheckCircle2 } from 'lucide-vue-next'
import type { Dish } from '../../types/catalog'
import { formatCLP } from '../../lib/format'

const props = withDefaults(defineProps<{
  dish: Dish
  showCounter?: boolean
  count?: number
  availableSides?: string[]
  sideSelections?: Record<string, string>
}>(), {
  showCounter: false,
  count: 0
})

const emit = defineEmits<{
  (e: 'update-count', delta: number): void
  (e: 'select-side', sideName: string): void
}>()

const formattedPrice = computed(() => formatCLP(props.dish.price))

const displayImage = computed(() => {
  return props.dish.image || props.dish.mainImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
})

const categoryLabel = computed(() => props.dish.mealCategory || 'Almuerzo')

const isChoiceSide = computed(() => {
  if (props.dish.sideMode) return props.dish.sideMode === 'choice'
  return props.dish.hasSelectableSides !== false
})

const isFixedSide = computed(() => {
  if (props.dish.sideMode) return props.dish.sideMode === 'fixed'
  return !isChoiceSide.value && !!props.dish.fixedSide
})
</script>

<template>
  <div class="bg-white rounded-3xl border-2 border-brand-border shadow-xs overflow-hidden flex flex-col">
    <div class="flex items-start p-3.5 sm:p-4 gap-3.5">
      <!-- Imagen -->
      <div class="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-brand-border bg-gray-100">
        <img :src="displayImage" :alt="dish.name" class="w-full h-full object-cover" />
        <span class="absolute bottom-1 left-1 bg-brand-dark/90 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase">
          {{ categoryLabel }}
        </span>
      </div>

      <!-- Información -->
      <div class="flex-1 min-w-0 space-y-1">
        <div class="flex items-start justify-between gap-2">
          <h3 class="text-sm font-black text-brand-dark leading-tight">{{ dish.name }}</h3>
          <span class="text-xs font-black text-brand-accent shrink-0">{{ formattedPrice }}</span>
        </div>

        <p v-if="dish.description" class="text-[11px] font-medium text-gray-600 line-clamp-2 leading-relaxed">
          {{ dish.description }}
        </p>

        <!-- Acompañamientos -->
        <div class="pt-1">
          <span v-if="isChoiceSide" class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 class="w-3 h-3 stroke-[2.5]" />
            Acompañamiento a elección
          </span>
          <span v-else-if="isFixedSide" class="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
            <Utensils class="w-3 h-3 stroke-[2.5]" />
            {{ dish.fixedSide }}
          </span>
        </div>
      </div>
    </div>

    <!-- Slot de Acciones / Contadores -->
    <div class="px-3.5 pb-3.5 pt-1 border-t border-gray-100">
      <slot name="actions" :dish="dish">
        <div v-if="showCounter" class="flex items-center justify-end gap-2">
          <button type="button" @click="emit('update-count', -1)" class="w-8 h-8 rounded-xl bg-brand-light border border-brand-border text-brand-dark font-black text-sm flex items-center justify-center">-</button>
          <span class="text-xs font-black text-brand-dark w-6 text-center">{{ count }}</span>
          <button type="button" @click="emit('update-count', 1)" class="w-8 h-8 rounded-xl bg-brand-dark text-white font-black text-sm flex items-center justify-center">+</button>
        </div>
      </slot>
    </div>
  </div>
</template>