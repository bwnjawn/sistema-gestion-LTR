<script setup lang="ts">
import { computed } from 'vue'
import { Users, Eye, ShieldCheck } from 'lucide-vue-next'
import type { CampingSite } from '../../stores/adminStore'

const props = defineProps<{
  site: CampingSite
  selectedOptionId?: string
  isDiario?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const isSelected = computed(() => props.selectedOptionId === props.site.id)

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`
}
</script>

<template>
  <div 
    @click="emit('click')"
    class="group relative bg-white rounded-2xl border-2 transition-all duration-200 cursor-pointer overflow-hidden shadow-2xs hover:shadow-md active:scale-[0.99]"
    :class="isSelected ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-brand-border hover:border-gray-400'"
  >
    <div class="relative h-44 sm:h-48 bg-gray-100 overflow-hidden">
      <img 
        :src="site.image || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'" 
        :alt="site.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

      <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
        <span class="bg-brand-dark/90 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-1">
          <Users class="w-3 h-3 text-emerald-400 stroke-[2.5]" />
          {{ site.minCapacity }} - {{ site.maxCapacity }} pers.
        </span>
      </div>

      <div class="absolute top-3 right-3">
        <span class="bg-white/90 text-brand-dark text-[10px] font-black px-2.5 py-1 rounded-full shadow-xs backdrop-blur-md flex items-center gap-1">
          <Eye class="w-3 h-3 text-brand-accent stroke-[2.5]" />
          Tocar para ver fotos
        </span>
      </div>

      <div class="absolute bottom-3 left-3 right-3 flex justify-between items-end text-white">
        <div>
          <h3 class="text-base font-black leading-tight drop-shadow-md">{{ site.name }}</h3>
          <span class="text-[11px] font-bold text-gray-200 drop-shadow-xs block">
            {{ isDiario ? 'Modalidad: Paseo por el día' : 'Modalidad: Pernoctar' }}
          </span>
        </div>
      </div>
    </div>

    <div class="p-4 space-y-3 bg-white">
      <p class="text-xs font-medium text-gray-600 line-clamp-2 leading-relaxed">
        {{ site.description }}
      </p>

      <div v-if="site.features && site.features.length > 0" class="flex flex-wrap gap-1.5 pt-1">
        <span 
          v-for="(feat, idx) in site.features.slice(0, 3)" 
          :key="idx"
          class="inline-flex items-center gap-1 text-[10px] font-extrabold text-gray-700 bg-brand-light px-2.5 py-0.5 rounded-md border border-brand-border"
        >
          <ShieldCheck class="w-3 h-3 text-emerald-600 stroke-[2.5]" />
          {{ feat }}
        </span>
        <span v-if="site.features.length > 3" class="text-[10px] font-extrabold text-gray-400 self-center">
          +{{ site.features.length - 3 }} más
        </span>
      </div>

      <div class="pt-2 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span class="text-[10px] font-extrabold text-gray-400 uppercase block">Tarifa por persona</span>
          <span class="text-base font-black text-brand-dark">{{ formatCLP(site.pricePerPerson) }}</span>
        </div>

        <button
          type="button"
          class="px-3.5 py-2 bg-brand-light hover:bg-emerald-100 border border-brand-border text-brand-dark rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors touch-target"
        >
          <Eye class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Ver Detalle
        </button>
      </div>
    </div>
  </div>
</template>