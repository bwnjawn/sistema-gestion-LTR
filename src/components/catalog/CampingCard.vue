<template>
  <div 
    @click="$emit('select', site.id)"
    :class="[
      'bg-white rounded-3xl border-2 p-4 transition-all shadow-sm cursor-pointer space-y-3 relative active:scale-98 touch-target',
      selectedOptionId === site.id
        ? 'border-brand-dark bg-white ring-4 ring-brand-dark/10 shadow-md'
        : 'border-brand-border hover:border-gray-400'
    ]"
  >
    <!-- Fotografía Destacada en la Box del Camping -->
    <div class="relative h-44 w-full bg-gray-100 rounded-2xl overflow-hidden border border-brand-border/40">
      <img 
        :src="site.image || 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80'" 
        :alt="site.name" 
        class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        @error="(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80' }"
      />
      <span class="absolute top-2.5 left-2.5 text-[10px] font-black uppercase text-emerald-900 bg-emerald-100/95 backdrop-blur-xs px-2.5 py-1 rounded-full border border-emerald-300 shadow-xs inline-flex items-center gap-1">
        <Sun v-if="isDiario" class="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
        <Moon v-else class="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
        {{ isDiario ? 'Paseo por el Día' : 'Pernoctar' }}
      </span>
    </div>

    <div class="flex items-start justify-between gap-3">
      <div class="space-y-1">
        <h3 class="text-lg font-black text-brand-dark leading-tight pt-0.5">
          {{ site.name }}
        </h3>
        <p class="text-xs font-bold text-gray-500 leading-relaxed">
          {{ site.description }}
        </p>
      </div>

      <div 
        v-if="selectedOptionId"
        :class="[
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors',
          selectedOptionId === site.id
            ? 'bg-brand-dark border-brand-dark text-white'
            : 'border-brand-border bg-brand-light'
        ]"
      >
        <Check v-if="selectedOptionId === site.id" class="w-4 h-4 stroke-[2.5]" />
      </div>
    </div>

    <!-- Boxes de Servicios / Equipamiento con Íconos -->
    <div v-if="site.features && site.features.length > 0" class="grid grid-cols-2 gap-1.5 pt-1">
      <div 
        v-for="(feat, fIdx) in site.features" 
        :key="fIdx"
        class="text-[11px] font-bold text-gray-700 flex items-center gap-1.5 bg-brand-light px-2.5 py-1 rounded-xl border border-brand-border/60 truncate"
      >
        <component :is="getFeatureIcon(getFeatIconName(feat))" class="w-3.5 h-3.5 text-brand-accent shrink-0 stroke-[2.5]" />
        <span class="truncate">{{ getFeatText(feat) }}</span>
      </div>
    </div>

    <!-- Precio -->
    <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
      <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
        Valor por Persona
      </span>
      <div class="text-right">
        <span class="text-lg font-black text-brand-dark">
          ${{ site.pricePerPerson.toLocaleString('es-CL') }}
        </span>
        <span class="text-xs font-bold text-gray-400"> / persona</span>
      </div>
    </div>

    <slot name="actions" :site="site" />
  </div>
</template>

<script setup lang="ts">
import { 
  Sun, Moon, Check, Wifi, Bath, Fan, Tv, Flame, Utensils, Car, Trees, Sparkles, Coffee, ShieldCheck, Thermometer
} from 'lucide-vue-next'

export interface CampingFeatureObj {
  icon: string
  text: string
}

export interface CampingItem {
  id: string
  name: string
  modality: string
  pricePerPerson: number
  maxCapacity: number
  description: string
  image?: string
  features?: (string | CampingFeatureObj)[]
}

withDefaults(defineProps<{
  site: CampingItem
  selectedOptionId?: string
  isDiario?: boolean
}>(), {
  selectedOptionId: '',
  isDiario: false
})

defineEmits<{
  (e: 'select', id: string): void
}>()

const getFeatText = (feat: string | CampingFeatureObj): string => {
  return typeof feat === 'string' ? feat : feat.text
}

const getFeatIconName = (feat: string | CampingFeatureObj): string => {
  return typeof feat === 'string' ? 'Sparkles' : feat.icon || 'Sparkles'
}

const getFeatureIcon = (iconName: string) => {
  switch (iconName) {
    case 'Bath': return Bath
    case 'Sun': return Sun
    case 'Trees': return Trees
    case 'Flame': return Flame
    case 'Wifi': return Wifi
    case 'Car': return Car
    case 'Utensils': return Utensils
    case 'Coffee': return Coffee
    case 'Thermometer': return Thermometer
    case 'ShieldCheck': return ShieldCheck
    default: return Sparkles
  }
}
</script>