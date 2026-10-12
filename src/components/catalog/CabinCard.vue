<script setup lang="ts">
import { computed } from 'vue'
import { Users, Bed, Check } from 'lucide-vue-next'
import type { Cabin } from '../../types/catalog'
import { formatCLP } from '../../lib/format'

const props = defineProps<{
  cabin: Cabin
  showSelectButton?: boolean
  isSelected?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', cabin: Cabin): void
}>()

const formattedPrice = computed(() => formatCLP(props.cabin.pricePerNight))

const displayImage = computed(() => {
  return props.cabin.mainImage || (props.cabin.images && props.cabin.images[0]) || 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'
})

const normalizedFeatures = computed(() => {
  if (!props.cabin.features) return []
  return props.cabin.features.map(f => {
    if (typeof f === 'string') return { text: f }
    return { text: f.text || f.name || '', icon: f.icon || '' }
  })
})
</script>

<template>
  <div class="bg-white rounded-3xl border-2 border-brand-border shadow-xs overflow-hidden flex flex-col">
    <!-- Imagen Principal -->
    <div class="relative h-44 sm:h-48 w-full bg-gray-100 overflow-hidden">
      <img :src="displayImage" :alt="cabin.name" class="w-full h-full object-cover" />
      <div class="absolute top-3 right-3 bg-brand-dark/90 text-white px-3 py-1 rounded-full font-black text-xs">
        {{ formattedPrice }} / noche
      </div>
    </div>

    <!-- Contenido -->
    <div class="p-4 sm:p-5 flex flex-col justify-between grow space-y-3">
      <div>
        <h3 class="text-base sm:text-lg font-black text-brand-dark leading-tight mb-1">{{ cabin.name }}</h3>

        <p v-if="cabin.description" class="text-xs font-medium text-gray-600 line-clamp-2 mb-2">
          {{ cabin.description }}
        </p>

        <!-- Capacidad y Camas -->
        <div class="flex flex-wrap items-center gap-3 text-xs font-bold text-gray-700 py-1">
          <div class="flex items-center gap-1.5 bg-brand-light px-2.5 py-1 rounded-xl border border-brand-border/60">
            <Users class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            <span>Hasta {{ cabin.capacity }} personas</span>
          </div>
          <div v-if="cabin.bedsDescription" class="flex items-center gap-1.5 bg-brand-light px-2.5 py-1 rounded-xl border border-brand-border/60">
            <Bed class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            <span>{{ cabin.bedsDescription }}</span>
          </div>
        </div>

        <!-- Servicios / Equipamiento -->
        <div v-if="normalizedFeatures.length > 0" class="flex flex-wrap gap-1.5 pt-2">
          <span
            v-for="(feat, idx) in normalizedFeatures"
            :key="idx"
            class="text-[11px] font-extrabold text-brand-dark bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200 flex items-center gap-1"
          >
            <Check class="w-3 h-3 text-brand-accent stroke-[2.5]" />
            {{ feat.text }}
          </span>
        </div>
      </div>

      <!-- Acciones o Selección -->
      <div class="pt-2 border-t border-gray-100">
        <slot name="actions" :cabin="cabin">
          <button
            v-if="showSelectButton"
            type="button"
            @click="emit('select', cabin)"
            :class="[
              'w-full py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 active:scale-95',
              isSelected ? 'bg-brand-accent text-white shadow-2xs' : 'bg-brand-dark text-white hover:bg-brand-dark/90'
            ]"
          >
            <span>{{ isSelected ? 'Seleccionada' : 'Seleccionar Cabaña' }}</span>
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>