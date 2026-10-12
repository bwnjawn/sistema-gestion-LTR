<script setup lang="ts">
import { computed } from 'vue'
import { X, Users, Tent, Check } from 'lucide-vue-next'
import type { CampingSite } from '../../types/catalog'
import { formatCLP } from '../../lib/format'

const props = defineProps<{
  isOpen: boolean
  site?: CampingSite | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const formattedPrice = computed(() => props.site ? formatCLP(props.site.pricePerPerson) : '$0')

const imagesList = computed(() => {
  if (!props.site) return []
  if (props.site.images && props.site.images.length > 0) return props.site.images
  return props.site.image ? [props.site.image] : ['https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80']
})
</script>

<template>
  <div v-if="isOpen && site" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white w-full max-w-lg rounded-3xl border-2 border-brand-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
      <!-- Encabezado -->
      <div class="p-4 sm:p-5 border-b-2 border-brand-border bg-brand-light flex items-center justify-between">
        <div>
          <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">
            Detalle del Espacio
          </span>
          <h3 class="text-lg font-black text-brand-dark leading-tight">{{ site.name }}</h3>
        </div>
        <button type="button" @click="emit('close')" class="p-2 rounded-full bg-white border border-brand-border text-brand-dark">
          <X class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <!-- Contenido -->
      <div class="p-4 sm:p-5 overflow-y-auto space-y-4">
        <!-- Galería de Fotos -->
        <div class="grid grid-cols-2 gap-2">
          <img v-for="(img, idx) in imagesList" :key="idx" :src="img" class="w-full h-32 object-cover rounded-2xl border border-brand-border" />
        </div>

        <div class="flex items-center justify-between p-3 bg-brand-light rounded-2xl border border-brand-border">
          <span class="text-xs font-black text-brand-dark">Tarifa:</span>
          <span class="text-base font-black text-brand-accent">{{ formattedPrice }} / persona</span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
          <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
            <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            <span>Capacidad: {{ site.minCapacity }} - {{ site.maxCapacity }} personas</span>
          </div>
          <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
            <Tent class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            <span class="capitalize">Modalidad: {{ site.modality }}</span>
          </div>
        </div>

        <p v-if="site.description" class="text-xs font-medium text-gray-600 leading-relaxed">
          {{ site.description }}
        </p>

        <!-- Servicios -->
        <div v-if="site.features && site.features.length > 0" class="space-y-1.5">
          <h4 class="text-xs font-black text-brand-dark">Servicios e Instalaciones:</h4>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="(feat, idx) in site.features" :key="idx" class="text-xs font-bold text-brand-dark bg-brand-light px-3 py-1 rounded-xl border border-brand-border flex items-center gap-1.5">
              <Check class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
              {{ feat }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>