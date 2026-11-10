<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Eye } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import CabinCard from '../../../components/catalog/CabinCard.vue'
import CabinModal from '../../../components/catalog/CabinModal.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useCatalogStore } from '../../../stores/catalogStore'
import { useRequestsStore } from '../../../stores/requestsStore'
import { isCabinAvailable } from '../../../services/availability'
import type { Cabin } from '../../../types/domain'

const router = useRouter()
const reservationStore = useReservationStore()
const catalogStore = useCatalogStore()
const requestsStore = useRequestsStore()

const showDetailModal = ref(false)
const selectedCabinForModal = ref<Cabin | null>(null)

// Filtrado de cabañas por capacidad Y disponibilidad real de fechas
const availableCabins = computed(() => {
  return catalogStore.cabins.filter(c => {
    const hasCapacity = c.capacity >= reservationStore.guestsCount
    if (!hasCapacity) return false

    if (!reservationStore.checkInDate || !reservationStore.checkOutDate) return true

    return isCabinAvailable(
      c.id,
      reservationStore.checkInDate,
      reservationStore.checkOutDate,
      requestsStore.requests
    )
  })
})

function openCabinDetail(cabin: Cabin) {
  selectedCabinForModal.value = cabin
  showDetailModal.value = true
}

function selectCabin(cabin: Cabin) {
  reservationStore.selectedCabinId = cabin.id
  showDetailModal.value = false
}

function nextStep() {
  if (reservationStore.selectedCabinId) {
    reservationStore.nextStep()
    router.push('/cabana/paso3')
  }
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-contenido-nav">
    <StepIndicator :current-step="2" />

    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-1">
      <h2 class="text-base font-black text-brand-dark">Selecciona tu Cabaña</h2>
      <p class="text-sm font-medium text-gray-600">
        Cabañas disponibles para {{ reservationStore.guestsCount }} personas en tus fechas.
      </p>
    </div>

    <div v-if="availableCabins.length > 0" class="space-y-4">
      <div
        v-for="cabin in availableCabins"
        :key="cabin.id"
        class="relative"
      >
        <CabinCard
          :cabin="cabin"
          :show-select-button="true"
          compacta
          :is-selected="reservationStore.selectedCabinId === cabin.id"
          @select="selectCabin"
        >
          <template #actions>
            <div class="flex gap-2">
              <button
                type="button"
                @click.stop="openCabinDetail(cabin)"
                class="flex-1 py-3 px-3 rounded-xl bg-brand-light border-2 border-brand-dark text-brand-dark font-black text-sm flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Eye class="w-4 h-4 stroke-[2.5]" />
                Ver detalle
              </button>
              <button
                type="button"
                @click.stop="selectCabin(cabin)"
                :class="[
                  'flex-[1.5] py-3 px-3 rounded-xl font-black text-sm transition-all active:scale-95',
                  reservationStore.selectedCabinId === cabin.id
                    ? 'bg-brand-accent text-white shadow-2xs'
                    : 'bg-brand-dark text-white hover:bg-brand-dark/90'
                ]"
              >
                {{ reservationStore.selectedCabinId === cabin.id ? 'Seleccionada' : 'Elegir Cabaña' }}
              </button>
            </div>
          </template>
        </CabinCard>
      </div>
    </div>

    <div v-else class="bg-white p-6 rounded-3xl border-2 border-brand-border text-center space-y-2">
      <p class="text-sm font-bold text-gray-600">
        No se encontraron cabañas disponibles o con capacidad suficiente para {{ reservationStore.guestsCount }} personas en las fechas seleccionadas.
      </p>
    </div>

    <CabinModal
      :is-open="showDetailModal"
      :cabin="selectedCabinForModal"
      :is-editable="false"
      @close="showDetailModal = false"
      @save="selectCabin(selectedCabinForModal!)"
    />

    <BarraAccionInferior :disabled="!reservationStore.selectedCabinId" @click="nextStep">Ingresar Datos</BarraAccionInferior>
  </div>
</template>