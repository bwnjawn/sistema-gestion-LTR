<script setup lang="ts">
import { computed } from 'vue'
import { Users, Tent, Check } from 'lucide-vue-next'
import type { CampingSite } from '../../types/catalog'
import { formatCLP } from '../../lib/format'
import { ETIQUETA_MODALIDAD_ESPACIO, NOMBRE_DIA_DE_CAMPO } from '../../services/wizard'

const props = defineProps<{
  site: CampingSite
  showSelectButton?: boolean
  isSelected?: boolean
  // En el flujo del cliente solo se muestra lo esencial: nombre, precio y capacidad
  compacta?: boolean
  // Por el día no hay espacios grandes ni pequeños (SCRUM-277): sin nombre del espacio ni rango de personas
  diaDeCampo?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', site: CampingSite): void
}>()

const formattedPrice = computed(() => formatCLP(props.site.pricePerPerson))

const displayImage = computed(() => {
  return props.site.image || (props.site.images && props.site.images[0]) || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'
})
</script>

<template>
  <div class="bg-white rounded-3xl border-2 border-brand-border shadow-xs overflow-hidden flex flex-col">
    <!-- Imagen -->
    <div class="relative h-44 sm:h-48 w-full bg-gray-100 overflow-hidden">
      <img :src="displayImage" :alt="site.name" class="w-full h-full object-cover" />
      <div class="absolute top-3 right-3 bg-brand-dark/90 text-white px-3 py-1 rounded-full font-bold text-sm">
        {{ formattedPrice }} por persona
      </div>
    </div>

    <!-- Contenido -->
    <div class="p-4 sm:p-5 flex flex-col justify-between grow space-y-3">
      <div>
        <h3 class="text-base sm:text-lg font-bold text-brand-dark leading-tight mb-1">{{ diaDeCampo ? NOMBRE_DIA_DE_CAMPO : site.name }}</h3>

        <p v-if="site.description && !compacta" class="text-base text-gray-600 line-clamp-2 mb-2">
          {{ site.description }}
        </p>

        <!-- Capacidad y Modalidad -->
        <div v-if="!diaDeCampo" class="flex flex-wrap items-center gap-2 text-sm text-gray-700 py-1">
          <div class="flex items-center gap-1.5 bg-brand-light px-2.5 py-1 rounded-xl border border-brand-border/60">
            <Users class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            <span>{{ site.minCapacity }} a {{ site.maxCapacity }} personas</span>
          </div>
          <div class="flex items-center gap-1.5 bg-brand-light px-2.5 py-1 rounded-xl border border-brand-border/60">
            <Tent class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            <span>{{ ETIQUETA_MODALIDAD_ESPACIO[site.modality] }}</span>
          </div>
        </div>

        <!-- Características -->
        <div v-if="site.features && site.features.length > 0 && !compacta" class="flex flex-wrap gap-1.5 pt-2">
          <span
            v-for="(feat, idx) in site.features"
            :key="idx"
            class="text-sm font-bold text-brand-dark bg-gray-100 px-2.5 py-0.5 rounded-lg border border-gray-200 flex items-center gap-1"
          >
            <Check class="w-3 h-3 text-brand-accent stroke-[2.5]" />
            {{ feat }}
          </span>
        </div>
      </div>

      <!-- Acciones o Selección -->
      <div class="pt-2 border-t border-gray-100">
        <slot name="actions" :site="site">
          <button
            v-if="showSelectButton"
            type="button"
            @click="emit('select', site)"
            :class="[
              'w-full py-2.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 active:scale-95',
              isSelected ? 'bg-brand-accent text-white shadow-2xs' : 'bg-brand-dark text-white hover:bg-brand-dark/90'
            ]"
          >
            <span>{{ isSelected ? 'Seleccionado' : 'Seleccionar Espacio' }}</span>
          </button>
        </slot>
      </div>
    </div>
  </div>
</template>