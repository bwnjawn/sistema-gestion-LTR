<template>
  <div 
    :class="[
      'bg-white rounded-3xl border-2 p-4 transition-all shadow-sm space-y-3 relative',
      availableSides.length > 0 && count > 0 && !isComplete
        ? 'border-rose-500 bg-rose-50/20 ring-4 ring-rose-500/10'
        : count > 0
          ? 'border-brand-dark bg-white'
          : 'border-brand-border hover:border-gray-400'
    ]"
  >
    <!-- Foto del Plato -->
    <div class="relative h-40 w-full bg-gray-100 rounded-2xl overflow-hidden mb-1">
      <img 
        :src="dish.image" 
        :alt="dish.name"
        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        @error="(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80' }"
      />
      <div class="absolute top-2.5 right-2.5 bg-brand-dark/95 text-white font-black text-xs px-3 py-1 rounded-full backdrop-blur-xs border border-white/20 shadow-xs">
        ${{ dish.price.toLocaleString('es-CL') }}
      </div>
      <span class="absolute top-2.5 left-2.5 bg-sky-100 text-sky-900 border border-sky-300 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase shadow-xs">
        {{ dish.mealCategory }}
      </span>
    </div>

    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1">
        <h3 class="text-lg font-black text-brand-dark leading-tight">{{ dish.name }}</h3>
        <p class="text-xs font-bold text-gray-500 leading-relaxed">{{ dish.description }}</p>
      </div>

      <!-- Contadores en Cliente -->
      <div v-if="showCounter" class="flex items-center gap-1.5 bg-brand-light p-1.5 rounded-2xl border-2 border-brand-border shrink-0">
        <button
          type="button"
          @click="$emit('update-count', -1)"
          class="w-8 h-8 rounded-xl bg-white border border-brand-border font-black text-lg flex items-center justify-center active:scale-95 touch-target"
        >
          <Minus class="w-4 h-4 stroke-[2.5]" />
        </button>
        <span class="w-7 text-center font-black text-lg text-brand-dark">
          {{ count }}
        </span>
        <button
          type="button"
          @click="$emit('update-count', 1)"
          class="w-8 h-8 rounded-xl bg-white border border-brand-border font-black text-lg flex items-center justify-center active:scale-95 touch-target"
        >
          <Plus class="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>

    <!-- SECCIÓN INTERACTIVA DE ACOMPAÑAMIENTOS CUANDO COUNT > 0 -->
    <div 
      v-if="showCounter && count > 0 && availableSides.length > 0"
      class="pt-3 border-t-2 border-gray-100 space-y-2.5"
    >
      <div class="flex items-center justify-between">
        <span class="text-xs font-extrabold text-gray-600 flex items-center gap-1">
          <Sparkles class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
          Acompañamientos:
        </span>

        <span 
          :class="[
            'text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1',
            isComplete
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-rose-100 text-rose-800 animate-pulse'
          ]"
        >
          <Check v-if="isComplete" class="w-3.5 h-3.5 stroke-[2.5]" />
          <AlertTriangle v-else class="w-3.5 h-3.5 stroke-[2.5]" />
          {{ assignedSidesCount }} de {{ requiredSidesCount }}
        </span>
      </div>

      <div 
        v-if="!isComplete"
        class="bg-rose-50 border border-rose-300 text-rose-900 p-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2"
      >
        <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0 stroke-[2.5]" />
        <span>Falta asignar {{ requiredSidesCount - assignedSidesCount }} acompañamiento(s) para este plato.</span>
      </div>

      <div class="space-y-2 bg-brand-light p-3 rounded-2xl border border-brand-border">
        <div 
          v-for="side in availableSides" 
          :key="side"
          class="flex items-center justify-between text-xs font-bold text-gray-700"
        >
          <span>{{ side }}</span>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="$emit('update-side', side, -1)"
              class="w-7 h-7 rounded-lg bg-white border border-brand-border font-extrabold flex items-center justify-center active:scale-95 touch-target"
            >
              <Minus class="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <span class="w-5 text-center font-black text-brand-dark">
              {{ sideSelections[side] || 0 }}
            </span>
            <button
              type="button"
              @click="$emit('update-side', side, 1)"
              class="w-7 h-7 rounded-lg bg-white border border-brand-border font-extrabold flex items-center justify-center active:scale-95 touch-target"
            >
              <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <slot name="actions" :dish="dish" />
  </div>
</template>

<script setup lang="ts">
import { Plus, Minus, Sparkles, Check, AlertTriangle } from 'lucide-vue-next'

export interface DishItem {
  id: string
  name: string
  mealCategory: string
  price: number
  description: string
  image: string
  availableSides: string[]
}

withDefaults(defineProps<{
  dish: DishItem
  showCounter?: boolean
  count?: number
  availableSides?: string[]
  sideSelections?: Record<string, number>
  assignedSidesCount?: number
  requiredSidesCount?: number
  isComplete?: boolean
}>(), {
  showCounter: false,
  count: 0,
  availableSides: () => [],
  sideSelections: () => ({}),
  assignedSidesCount: 0,
  requiredSidesCount: 0,
  isComplete: true
})

defineEmits<{
  (e: 'update-count', delta: number): void
  (e: 'update-side', sideName: string, delta: number): void
}>()
</script>