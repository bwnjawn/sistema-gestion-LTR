<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Users, 
  Sparkles, 
  ShieldCheck
} from 'lucide-vue-next'
import { type CampingSite, useAdminStore } from '../../stores/adminStore'
import { useReservationStore } from '../../stores/reservationStore'

const props = defineProps<{
  isOpen: boolean
  site: CampingSite
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const adminStore = useAdminStore()
const store = useReservationStore()

const currentImageIndex = ref(0)

const galleryImages = computed(() => {
  if (props.site.images && props.site.images.length > 0) {
    return props.site.images
  }
  if (props.site.image) {
    return [props.site.image]
  }
  return ['https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80']
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) currentImageIndex.value = 0
})

function nextImage() {
  currentImageIndex.value = (currentImageIndex.value + 1) % galleryImages.value.length
}

function prevImage() {
  currentImageIndex.value = (currentImageIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length
}

const isDiario = computed(() => store.campingType === 'diario')

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  if (!day || !month) return dateStr
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthIdx = parseInt(month, 10) - 1
  return `${parseInt(day, 10)} ${months[monthIdx] || ''}`
}

// Formateo estandarizado de horario
const formattedScheduleRange = computed(() => {
  if (isDiario.value) {
    const checkIn = adminStore.campingSchedules.diario.checkIn
    const checkOut = adminStore.campingSchedules.diario.checkOut
    if (store.checkInDate) {
      const dateFormatted = formatDateShort(store.checkInDate)
      return `${dateFormatted} (${checkIn} hrs) - ${dateFormatted} (${checkOut} hrs)`
    }
    return `Día de ingreso (${checkIn} hrs) - Día de ingreso (${checkOut} hrs)`
  } else {
    const checkIn = adminStore.campingSchedules.pernoctar.checkIn
    const checkOut = adminStore.campingSchedules.pernoctar.checkOut
    if (store.checkInDate && store.checkOutDate) {
      const inDate = formatDateShort(store.checkInDate)
      const outDate = formatDateShort(store.checkOutDate)
      return `${inDate} (${checkIn} hrs) - ${outDate} (${checkOut} hrs)`
    }
    return `Día de ingreso (${checkIn} hrs) - Día de salida (${checkOut} hrs)`
  }
})

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`
}
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
      @click.self="emit('close')"
    >
      <div class="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-brand-border flex flex-col max-h-[90vh] animate-scale-up">
        
        <!-- CARRUSEL -->
        <div class="relative h-64 sm:h-72 bg-gray-900 shrink-0">
          <img 
            :src="galleryImages[currentImageIndex]" 
            :alt="site.name" 
            class="w-full h-full object-cover transition-all duration-300"
          />

          <button 
            type="button"
            @click="emit('close')"
            class="absolute top-3 right-3 z-10 w-9 h-9 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors touch-target"
            aria-label="Cerrar modal"
          >
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>

          <button 
            v-if="galleryImages.length > 1"
            type="button"
            @click.stop="prevImage"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white text-gray-900 rounded-full flex items-center justify-center shadow-md backdrop-blur-xs transition-transform active:scale-90 touch-target"
          >
            <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
          </button>

          <button 
            v-if="galleryImages.length > 1"
            type="button"
            @click.stop="nextImage"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white text-gray-900 rounded-full flex items-center justify-center shadow-md backdrop-blur-xs transition-transform active:scale-90 touch-target"
          >
            <ChevronRight class="w-5 h-5 stroke-[2.5]" />
          </button>

          <div v-if="galleryImages.length > 1" class="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
            <button
              v-for="(_, idx) in galleryImages"
              :key="idx"
              type="button"
              @click="currentImageIndex = idx"
              class="w-2 h-2 rounded-full transition-all"
              :class="idx === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'"
            />
          </div>

          <div class="absolute top-3 left-3 bg-brand-dark/90 text-white text-[11px] font-black px-3 py-1 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-1.5">
            <Users class="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
            Capacidad: {{ site.minCapacity }} a {{ site.maxCapacity }} personas
          </div>
        </div>

        <!-- DETALLE -->
        <div class="p-5 overflow-y-auto space-y-5 text-gray-800">
          <div class="flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <span class="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-1">
                <Sparkles class="w-3 h-3 text-emerald-600 stroke-[2.5]" />
                {{ site.isSpecial ? 'Espacio Grupos Grandes' : 'Camping General' }}
              </span>
              <h2 class="text-xl font-black text-brand-dark tracking-tight">{{ site.name }}</h2>
            </div>
            
            <div class="text-right shrink-0">
              <span class="block text-[10px] font-extrabold text-gray-400 uppercase">Tarifa por pers.</span>
              <span class="text-lg font-black text-brand-dark">{{ formatCLP(site.pricePerPerson) }}</span>
            </div>
          </div>

          <div class="space-y-1">
            <h3 class="text-xs font-black text-gray-500 uppercase tracking-wider">Descripción del Espacio</h3>
            <p class="text-xs font-semibold text-gray-600 leading-relaxed bg-brand-light p-3.5 rounded-2xl border border-brand-border">
              {{ site.description }}
            </p>
          </div>

          <div class="space-y-1">
            <h3 class="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Clock class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
              Horario Permitido ({{ isDiario ? 'Por el Día' : 'Pernoctar' }})
            </h3>
            <p class="text-xs font-bold text-brand-dark bg-amber-50 border border-amber-200 p-3 rounded-2xl">
              {{ formattedScheduleRange }}
            </p>
          </div>

          <div v-if="site.features && site.features.length > 0" class="space-y-2">
            <h3 class="text-xs font-black text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
              Servicios e Instalaciones Incluidas
            </h3>
            <div class="grid grid-cols-2 gap-2">
              <div 
                v-for="(feat, idx) in site.features" 
                :key="idx"
                class="flex items-center gap-2 text-xs font-bold text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-200"
              >
                <CheckCircle2 class="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                <span>{{ feat }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTÓN CON TEXTO ÚNICO "Cerrar" -->
        <div class="p-4 bg-gray-50 border-t border-gray-100 text-center">
          <button
            type="button"
            @click="emit('close')"
            class="w-full py-3 bg-brand-dark hover:bg-brand-accent text-white font-black text-xs rounded-2xl shadow-sm transition-colors touch-target"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>