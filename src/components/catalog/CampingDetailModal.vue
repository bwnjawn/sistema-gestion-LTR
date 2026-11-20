<script setup lang="ts">
import HojaModal from '../ui/HojaModal.vue'
import { computed } from 'vue'
import { Users, Tent, Check } from 'lucide-vue-next'
import type { CampingSite } from '../../types/catalog'
import { formatCLP } from '../../lib/format'
import { ETIQUETA_MODALIDAD_ESPACIO, NOMBRE_DIA_DE_CAMPO } from '../../services/wizard'

const props = defineProps<{
  isOpen: boolean
  site?: CampingSite | null
  // Por el día no hay espacios grandes ni pequeños (SCRUM-277): sin nombre del espacio ni rango de personas
  diaDeCampo?: boolean
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
  <HojaModal v-if="site" :abierto="isOpen" ancho="amplio" :titulo="diaDeCampo ? NOMBRE_DIA_DE_CAMPO : site.name" :subtitulo="diaDeCampo ? 'Detalle del camping' : 'Detalle del espacio'" @cerrar="emit('close')">
    <!-- Galería de Fotos -->
    <div class="grid grid-cols-2 gap-2">
      <img v-for="(img, idx) in imagesList" :key="idx" :src="img" alt="" class="w-full h-32 object-cover rounded-2xl border border-brand-border" />
    </div>

    <div class="flex items-center justify-between p-3 bg-brand-light rounded-2xl border border-brand-border">
      <span class="text-sm font-bold text-brand-dark">Tarifa:</span>
      <span class="text-base font-bold text-brand-accent">{{ formattedPrice }} por persona</span>
    </div>

    <div v-if="!diaDeCampo" class="grid grid-cols-2 gap-2 text-sm text-gray-700">
      <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
        <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        <span>Capacidad: {{ site.minCapacity }} - {{ site.maxCapacity }} personas</span>
      </div>
      <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-2">
        <Tent class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        <span>Modalidad: {{ ETIQUETA_MODALIDAD_ESPACIO[site.modality] }}</span>
      </div>
    </div>

    <p v-if="site.description" class="text-base text-gray-600 leading-relaxed">
      {{ site.description }}
    </p>

    <!-- Servicios -->
    <div v-if="site.features && site.features.length > 0" class="space-y-1.5">
      <h4 class="text-sm font-bold text-brand-dark">Servicios e Instalaciones:</h4>
      <div class="flex flex-wrap gap-1.5">
        <span v-for="(feat, idx) in site.features" :key="idx" class="text-sm font-bold text-brand-dark bg-brand-light px-3 py-1 rounded-xl border border-brand-border flex items-center gap-1.5">
          <Check class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
          {{ feat }}
        </span>
      </div>
    </div>
  </HojaModal>
</template>
