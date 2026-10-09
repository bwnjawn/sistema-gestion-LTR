<template>
  <div class="space-y-4 pb-24">
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

    <!-- 4. Lista de Cabañas mediante el componente reutilizable CabinCard -->
    <div class="space-y-3">
      <div class="flex items-center justify-between px-1">
        <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
          Cabañas Registradas
        </h3>
      </div>

      <CabinCard
        v-for="cabin in evaluatedCabins"
        :key="cabin.id"
        :cabin="cabin"
        :selected-cabin-id="store.selectedCabinId"
        :nights-count="nightsCount"
        :guests-count="store.guestsCount"
        @select="selectCabin"
      >
        <template #actions="{ cabin: item }">
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click.stop="openCabinModal(item)"
              class="bg-brand-light hover:bg-gray-200 text-brand-dark px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border border-brand-border touch-target active:scale-95 transition-transform"
            >
              <Eye class="w-4 h-4 stroke-[2.5]" />
              Ver Detalle
            </button>

            <button
              type="button"
              :disabled="item.isOccupied"
              @click.stop="selectCabin(item)"
              :class="[
                'px-3.5 py-2 rounded-xl text-xs font-black transition-transform active:scale-95 touch-target',
                item.isOccupied
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : store.selectedCabinId === item.id
                    ? 'bg-brand-dark text-white'
                    : 'bg-brand-accent text-white hover:bg-brand-dark'
              ]"
            >
              {{ item.isOccupied ? 'No disponible' : store.selectedCabinId === item.id ? 'Elegida' : 'Elegir' }}
            </button>
          </div>
        </template>
      </CabinCard>
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
          :disabled="!store.selectedCabinId"
          @click="handleNext"
        >
          Tus Datos
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>

    <!-- 6. Modal Interactivo de Detalle Componente -->
    <CabinModal
      :is-open="isModalOpen"
      :cabin="modalCabin"
      :is-editable="false"
      :nights-count="nightsCount"
      @close="isModalOpen = false"
      @select="selectCabinFromModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Users, Eye, ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import CabinCard, { type CabinItem } from '../../../components/catalog/CabinCard.vue'
import CabinModal from '../../../components/catalog/CabinModal.vue'

const router = useRouter()
const store = useReservationStore()

const isModalOpen = ref(false)
const modalCabin = ref<CabinItem | null>(null)

// Cabañas base
const rawCabins = ref<CabinItem[]>([
  {
    id: 'cabana-1',
    name: 'Cabaña 6',
    capacity: 6,
    pricePerNight: 65000,
    bedsDescription: '1 matrimonial + 4 individuales',
    description: 'Cabaña acogedora construida en maderas nativas, completamente equipada para familias o grupos de hasta 6 personas.',
    mainImage: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
    ],
    features: ['Calefacción a leña', 'Cocina equipada', 'Agua caliente 24/7', 'Estacionamiento']
  },
  {
    id: 'cabana-2',
    name: 'Cabaña 8',
    capacity: 8,
    pricePerNight: 120000,
    bedsDescription: '2 matrimoniales + 4 individuales',
    description: 'Espaciosa cabaña con vista privilegiada al bosque y jardín, ideal para grupos numerosos o familias extendidas.',
    mainImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80'
    ],
    features: ['Terraza privada', 'Parrilla quincho', 'Vista al bosque']
  }
])

const nightsCount = computed(() => {
  if (!store.checkInDate || !store.checkOutDate) return 1
  const start = new Date(store.checkInDate).getTime()
  const end = new Date(store.checkOutDate).getTime()
  const diffDays = Math.ceil((end - start) / (1000 * 3600 * 24))
  return diffDays > 0 ? diffDays : 1
})

const evaluatedCabins = computed(() => {
  return rawCabins.value.map(c => ({
    ...c,
    isOccupied: false,
    fitsGuests: store.guestsCount <= c.capacity
  }))
})

const hasAvailableCabins = computed(() => evaluatedCabins.value.some(c => !c.isOccupied))

const formatDateShort = (dateStr: string) => {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) return `${parts[1]}/${parts[2]}`
  return dateStr
}

const selectCabin = (cabin: CabinItem) => {
  if (cabin.isOccupied) return
  store.selectedCabinId = cabin.id
}

const openCabinModal = (cabin: CabinItem) => {
  modalCabin.value = cabin
  isModalOpen.value = true
}

const selectCabinFromModal = (cabin: CabinItem) => {
  selectCabin(cabin)
  isModalOpen.value = false
}

const handleBack = () => {
  store.prevStep()
  router.push({ name: 'cabana-step1' })
}

const handleNext = () => {
  if (!store.selectedCabinId) return
  store.nextStep()
  router.push({ name: 'cabana-step3' })
}
</script>