<template>
  <div
    @click="$emit('select', cabin)"
    :class="[
      'bg-white rounded-2xl border-2 transition-all shadow-sm overflow-hidden relative group',
      cabin.isOccupied
        ? 'opacity-60 bg-gray-100 border-gray-300 cursor-not-allowed'
        : selectedCabinId === cabin.id
          ? 'border-brand-dark ring-4 ring-brand-dark/15 bg-white cursor-pointer'
          : 'border-brand-border hover:border-gray-400 cursor-pointer'
    ]"
  >
    <div 
      v-if="cabin.isOccupied"
      class="absolute top-3 right-3 bg-rose-600 text-white px-3 py-1 rounded-full font-black text-xs flex items-center gap-1.5 shadow-md z-10"
    >
      <CalendarX class="w-4 h-4 stroke-[2.5]" />
      Ocupada en estas fechas
    </div>
    <div 
      v-else-if="selectedCabinId === cabin.id"
      class="absolute top-3 right-3 bg-brand-dark text-white px-3 py-1 rounded-full font-black text-xs flex items-center gap-1.5 shadow-md z-10"
    >
      <Check class="w-4 h-4 text-emerald-400 stroke-[2.5]" />
      Seleccionada
    </div>

    <!-- Imagen Principal -->
    <div class="relative h-44 w-full bg-gray-100 overflow-hidden">
      <img 
        :src="cabin.mainImage" 
        :alt="cabin.name"
        :class="[
          'w-full h-full object-cover transition-transform duration-300',
          cabin.isOccupied ? 'grayscale' : 'group-hover:scale-105'
        ]"
        @error="(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80' }"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>

      <div class="absolute bottom-3 left-3 flex items-center gap-2">
        <span class="bg-white/95 backdrop-blur-xs text-brand-dark px-3 py-1 rounded-full font-black text-xs shadow-sm flex items-center gap-1.5">
          <Users class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
          Hasta {{ cabin.capacity }} personas
        </span>
      </div>
    </div>

    <!-- Detalles -->
    <div class="p-4 space-y-3">
      <div>
        <h4 class="text-xl font-black text-brand-dark leading-tight">{{ cabin.name }}</h4>
        <p class="text-xs font-bold text-gray-500 mt-0.5 flex items-center gap-1">
          <BedDouble class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
          {{ cabin.bedsDescription }}
        </p>
      </div>

      <p v-if="cabin.description" class="text-xs font-bold text-gray-600 line-clamp-2 leading-relaxed">
        {{ cabin.description }}
      </p>

      <!-- Boxes de Equipamiento con Ícono Dinámico -->
      <div v-if="cabin.features && cabin.features.length > 0" class="grid grid-cols-2 gap-1.5 pt-1">
        <div 
          v-for="(feat, fIdx) in cabin.features" 
          :key="fIdx"
          class="text-[11px] font-bold text-brand-dark bg-brand-light px-2.5 py-1.5 rounded-xl border border-brand-border flex items-center gap-1.5 truncate"
        >
          <component :is="getFeatureIcon(getFeatIconName(feat))" class="w-3.5 h-3.5 text-brand-accent shrink-0 stroke-[2.5]" />
          <span class="truncate">{{ getFeatText(feat) }}</span>
        </div>
      </div>

      <div 
        v-if="cabin.fitsGuests === false && !cabin.isOccupied"
        class="bg-rose-50 border-2 border-rose-200 text-rose-900 p-3 rounded-xl text-xs font-extrabold flex items-center gap-2.5"
      >
        <AlertTriangle class="w-5 h-5 text-rose-600 shrink-0 stroke-[2.5]" />
        <span>Capacidad sobrepasada: Tu grupo tiene {{ guestsCount }} personas (Máx. {{ cabin.capacity }}).</span>
      </div>

      <div class="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
        <div>
          <span class="text-[10px] font-extrabold text-gray-400 block uppercase tracking-wider">
            Total ({{ nightsCount }} {{ nightsCount === 1 ? 'noche' : 'noches' }})
          </span>
          <span class="text-xl font-black text-brand-dark">
            ${{ ((cabin.pricePerNight || 0) * nightsCount).toLocaleString('es-CL') }}
          </span>
        </div>

        <slot name="actions" :cabin="cabin" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  Users, BedDouble, CalendarX, Check, AlertTriangle, 
  Wifi, Bath, Fan, Tv, Flame, Sun, Utensils, Car, Trees, Sparkles 
} from 'lucide-vue-next'

export interface CabinFeatureObj {
  icon: string
  text: string
}

export interface CabinItem {
  id: string
  name: string
  capacity: number
  pricePerNight: number
  bedsDescription: string
  description?: string
  mainImage: string
  images: string[]
  features: (string | CabinFeatureObj)[]
  isActive?: boolean
  isOccupied?: boolean
  fitsGuests?: boolean
}

withDefaults(defineProps<{
  cabin: CabinItem
  selectedCabinId?: string
  nightsCount?: number
  guestsCount?: number
}>(), {
  selectedCabinId: '',
  nightsCount: 1,
  guestsCount: 1
})

defineEmits<{
  (e: 'select', cabin: CabinItem): void
}>()

const getFeatText = (feat: string | CabinFeatureObj): string => {
  return typeof feat === 'string' ? feat : feat.text
}

const getFeatIconName = (feat: string | CabinFeatureObj): string => {
  return typeof feat === 'string' ? 'Sparkles' : feat.icon || 'Sparkles'
}

const getFeatureIcon = (iconName: string) => {
  switch (iconName) {
    case 'Wifi': return Wifi
    case 'Bath': return Bath
    case 'Fan': return Fan
    case 'Tv': return Tv
    case 'Flame': return Flame
    case 'Sun': return Sun
    case 'Utensils': return Utensils
    case 'Car': return Car
    case 'Trees': return Trees
    default: return Sparkles
  }
}
</script>