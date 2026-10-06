<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  Users, 
  BedDouble, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  CalendarX 
} from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'

const router = useRouter()
const store = useReservationStore()

interface Cabin {
  id: string
  name: string
  capacity: number
  description: string
  bedsDescription: string
  pricePerNight: number
  isOccupied: boolean
  mainImage: string
  images: string[]
  features: string[]
}

const rawCabins: Cabin[] = [
  {
    id: 'cabana-1',
    name: 'Cabaña 6',
    capacity: 6,
    bedsDescription: '1 Cama Matrimonial · 2 Camas Nido (4 plazas)',
    description: 'Cabaña acogedora ideal para familias. Cuenta con cocina equipada, calefacción a leña, baño privado, terraza con vista al parque y parrilla.',
    pricePerNight: 65000,
    isOccupied: false,
    mainImage: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80'
    ],
    features: ['Cocina equipada', 'Calefacción a leña', 'Parrilla privada', 'Estacionamiento', 'TV satelital', 'Terraza']
  },
  {
    id: 'cabana-2',
    name: 'Cabaña 8',
    capacity: 8,
    bedsDescription: '2 Camas Matrimoniales · 2 Literas (4 plazas)',
    description: 'Cabaña amplia de dos pisos para grupos grandes. Incluye gran living comedor, cocina completa, 2 baños, terraza panorámica y zona de asado.',
    pricePerNight: 120000,
    isOccupied: false,
    mainImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'
    ],
    features: ['2 Baños', 'Dos Pisos', 'Balcón vista río', 'Cocina amplia', 'Bosca a leña', 'Parrilla espaciosa']
  }
]

const selectedCabinId = ref<string>(store.selectedCabinId || '')

// Estado para Modal
const isModalOpen = ref(false)
const modalCabin = ref<Cabin | null>(null)
const currentImageIndex = ref(0)

const nightsCount = computed(() => {
  if (!store.checkInDate || !store.checkOutDate) return 1
  const d1 = new Date(store.checkInDate + 'T00:00:00')
  const d2 = new Date(store.checkOutDate + 'T00:00:00')
  const diffTime = d2.getTime() - d1.getTime()
  return Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)))
})

function formatDateShort(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function formatCLP(val: number): string {
  return '$' + val.toLocaleString('es-CL')
}

const evaluatedCabins = computed(() => {
  const guests = store.guestsCount || 1
  return rawCabins.map(c => ({
    ...c,
    fitsGuests: guests <= c.capacity
  }))
})

const hasAvailableCabins = computed(() => {
  return evaluatedCabins.value.some(c => !c.isOccupied)
})

function selectCabin(cabin: Cabin) {
  if (cabin.isOccupied) return
  selectedCabinId.value = cabin.id
  store.selectedCabinId = cabin.id
}

function openCabinModal(cabin: Cabin) {
  modalCabin.value = cabin
  currentImageIndex.value = 0
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  modalCabin.value = null
}

function prevImage() {
  if (!modalCabin.value) return
  currentImageIndex.value = (currentImageIndex.value - 1 + modalCabin.value.images.length) % modalCabin.value.images.length
}

function nextImage() {
  if (!modalCabin.value) return
  currentImageIndex.value = (currentImageIndex.value + 1) % modalCabin.value.images.length
}

function selectCabinFromModal() {
  if (modalCabin.value && !modalCabin.value.isOccupied) {
    selectCabin(modalCabin.value)
    closeModal()
  }
}

function handleNext() {
  if (!selectedCabinId.value) return
  store.selectedCabinId = selectedCabinId.value
  store.nextStep()
  router.push({ name: 'cabana-step3' })
}

function handleBack() {
  store.prevStep()
  router.push({ name: 'cabana-step1' })
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto pb-28">
    
    <!-- 1. Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="2" />
    </div>

    <!-- 2. Parámetros Recordados de la Reserva -->
    <BaseAlert variant="info" title="Parámetros de la Reserva">
      <div class="space-y-1 mt-1 text-sm font-bold">
        <div class="flex items-center justify-between">
          <span class="text-gray-700">Fechas:</span>
          <span class="text-brand-dark font-extrabold">
            {{ formatDateShort(store.checkInDate) }} → {{ formatDateShort(store.checkOutDate) }}
          </span>
        </div>
        <div class="flex items-center justify-between border-t border-amber-200/60 pt-1 mt-1">
          <span class="text-gray-700">Grupo / Huéspedes:</span>
          <span class="inline-flex items-center gap-1.5 bg-brand-dark text-white px-2.5 py-0.5 rounded-full font-black text-xs">
            <Users class="w-3.5 h-3.5 text-emerald-300 stroke-[2.5]" />
            {{ store.guestsCount }} {{ store.guestsCount === 1 ? 'Persona' : 'Personas' }}
          </span>
        </div>
      </div>
    </BaseAlert>

    <!-- 3. Alerta en caso de que TODAS estén ocupadas -->
    <BaseAlert v-if="!hasAvailableCabins" variant="warning" title="Sin Disponibilidad de Cabañas">
      No hay cabañas libres para las fechas seleccionadas. Por favor presiona "Volver" para elegir otro rango de fechas.
    </BaseAlert>

    <!-- 4. Lista de Cabañas -->
    <div class="space-y-3">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
          Cabañas Registradas
        </h3>
      </div>

      <div
        v-for="cabin in evaluatedCabins"
        :key="cabin.id"
        @click="selectCabin(cabin)"
        :class="[
          'bg-white rounded-2xl border-2 transition-all shadow-sm overflow-hidden relative group',
          cabin.isOccupied
            ? 'opacity-60 bg-gray-100 border-gray-300 cursor-not-allowed'
            : selectedCabinId === cabin.id
              ? 'border-brand-dark ring-4 ring-brand-dark/15 bg-white cursor-pointer'
              : 'border-brand-border hover:border-gray-400 cursor-pointer'
        ]"
      >
        <!-- Badge Ocupada u Elegida -->
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

          <!-- Capacidad en Imagen -->
          <div class="absolute bottom-3 left-3 flex items-center gap-2">
            <span class="bg-white/95 backdrop-blur-xs text-brand-dark px-3 py-1 rounded-full font-black text-xs shadow-sm flex items-center gap-1.5">
              <Users class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
              Hasta {{ cabin.capacity }} personas
            </span>
          </div>
        </div>

        <!-- Detalles de la Cabaña -->
        <div class="p-4 space-y-3">
          <div>
            <h4 class="text-xl font-black text-brand-dark leading-tight">{{ cabin.name }}</h4>
            <p class="text-xs font-bold text-gray-500 mt-0.5 flex items-center gap-1">
              <BedDouble class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
              {{ cabin.bedsDescription }}
            </p>
          </div>

          <p class="text-xs font-bold text-gray-600 line-clamp-2 leading-relaxed">
            {{ cabin.description }}
          </p>

          <!-- Banner Capacidad Superada -->
          <div 
            v-if="!cabin.fitsGuests && !cabin.isOccupied"
            class="bg-rose-50 border-2 border-rose-200 text-rose-900 p-3 rounded-xl text-xs font-extrabold flex items-center gap-2.5"
          >
            <AlertTriangle class="w-5 h-5 text-rose-600 shrink-0 stroke-[2.5]" />
            <span>Capacidad sobrepasada: Tu grupo tiene {{ store.guestsCount }} personas (Máx. {{ cabin.capacity }}).</span>
          </div>

          <!-- Precios y Acciones -->
          <div class="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
            <div>
              <span class="text-[10px] font-extrabold text-gray-400 block uppercase tracking-wider">
                Total ({{ nightsCount }} {{ nightsCount === 1 ? 'noche' : 'noches' }})
              </span>
              <span class="text-xl font-black text-brand-dark">
                {{ formatCLP(cabin.pricePerNight * nightsCount) }}
              </span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                @click.stop="openCabinModal(cabin)"
                class="bg-brand-light hover:bg-gray-200 text-brand-dark px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border border-brand-border touch-target active:scale-95 transition-transform"
              >
                <Eye class="w-4 h-4 stroke-[2.5]" />
                Ver Detalle
              </button>

              <button
                type="button"
                :disabled="cabin.isOccupied"
                @click.stop="selectCabin(cabin)"
                :class="[
                  'px-3.5 py-2 rounded-xl text-xs font-black transition-transform active:scale-95 touch-target',
                  cabin.isOccupied
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : selectedCabinId === cabin.id
                      ? 'bg-brand-dark text-white'
                      : 'bg-brand-accent text-white hover:bg-brand-dark'
                ]"
              >
                {{ cabin.isOccupied ? 'No disponible' : selectedCabinId === cabin.id ? 'Elegida' : 'Elegir' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Navegación Flotante Fija -->
    <div class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-3.5 shadow-2xl">
      <div class="max-w-md mx-auto flex items-center gap-3">
        <BaseButton variant="outline" size="lg" @click="handleBack">
          <ArrowLeft class="w-5 h-5 mr-1.5 stroke-[2.5]" />
          Volver
        </BaseButton>

        <BaseButton 
          variant="primary" 
          size="lg" 
          fullWidth 
          :disabled="!selectedCabinId"
          @click="handleNext"
        >
          Tus Datos
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>

    <!-- 6. Modal Interactivo de Detalle -->
    <Teleport to="body">
      <div 
        v-if="isModalOpen && modalCabin" 
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity"
        @click.self="closeModal"
      >
        <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-brand-border flex flex-col">
          
          <div class="relative h-64 w-full bg-black shrink-0 overflow-hidden">
            <img 
              :src="modalCabin.images[currentImageIndex]" 
              :alt="modalCabin.name"
              class="w-full h-full object-cover transition-all duration-300"
            />
            
            <button 
              type="button"
              @click="closeModal"
              class="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full backdrop-blur-xs touch-target flex items-center justify-center z-10"
              aria-label="Cerrar modal"
            >
              <X class="w-6 h-6 stroke-[2.5]" />
            </button>

            <button 
              v-if="modalCabin.images.length > 1"
              type="button"
              @click="prevImage"
              class="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full touch-target flex items-center justify-center"
            >
              <ChevronLeft class="w-6 h-6 stroke-[2.5]" />
            </button>

            <button 
              v-if="modalCabin.images.length > 1"
              type="button"
              @click="nextImage"
              class="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full touch-target flex items-center justify-center"
            >
              <ChevronRight class="w-6 h-6 stroke-[2.5]" />
            </button>

            <div class="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-black px-3 py-1 rounded-full backdrop-blur-xs">
              {{ currentImageIndex + 1 }} / {{ modalCabin.images.length }}
            </div>
          </div>

          <div class="p-5 space-y-4 grow">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-2xl font-black text-brand-dark">{{ modalCabin.name }}</h3>
                <span class="bg-brand-light text-brand-dark border border-brand-border px-3 py-1 rounded-full font-extrabold text-xs flex items-center gap-1.5">
                  <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                  Hasta {{ modalCabin.capacity }} Personas
                </span>
              </div>
              <p class="text-sm font-extrabold text-brand-accent mt-1 flex items-center gap-1.5">
                <BedDouble class="w-4 h-4 stroke-[2.5]" />
                {{ modalCabin.bedsDescription }}
              </p>
            </div>

            <div class="space-y-1">
              <h4 class="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Descripción</h4>
              <p class="text-sm font-semibold text-gray-700 leading-relaxed">
                {{ modalCabin.description }}
              </p>
            </div>

            <div class="space-y-2">
              <h4 class="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Servicios y Equipamiento</h4>
              <div class="grid grid-cols-2 gap-2">
                <div 
                  v-for="feature in modalCabin.features" 
                  :key="feature"
                  class="flex items-center gap-2 bg-brand-light p-2.5 rounded-xl border border-brand-border text-xs font-bold text-brand-dark"
                >
                  <Sparkles class="w-4 h-4 text-brand-accent shrink-0 stroke-[2.5]" />
                  <span>{{ feature }}</span>
                </div>
              </div>
            </div>

            <div class="bg-brand-light p-4 rounded-2xl border-2 border-brand-border flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-gray-500 block">Tarifa por noche</span>
                <span class="text-sm font-black text-gray-800">{{ formatCLP(modalCabin.pricePerNight) }}</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-brand-accent block uppercase">Total por {{ nightsCount }} Noches</span>
                <span class="text-2xl font-black text-brand-dark">
                  {{ formatCLP(modalCabin.pricePerNight * nightsCount) }}
                </span>
              </div>
            </div>
          </div>

          <div class="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
            <BaseButton variant="outline" size="lg" @click="closeModal">
              Cerrar
            </BaseButton>

            <BaseButton 
              variant="success" 
              size="lg" 
              fullWidth 
              @click="selectCabinFromModal"
            >
              <Check class="w-5 h-5 mr-1.5 stroke-[2.5]" />
              Elegir esta Cabaña
            </BaseButton>
          </div>

        </div>
      </div>
    </Teleport>

  </div>
</template>