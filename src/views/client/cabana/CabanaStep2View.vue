<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Users, Eye } from 'lucide-vue-next'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import CabinCard from '../../../components/catalog/CabinCard.vue'
import CabinModal from '../../../components/catalog/CabinModal.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { type Cabin, useAdminStore } from '../../../stores/adminStore'

const router = useRouter()
const store = useReservationStore()
const adminStore = useAdminStore()

const isModalOpen = ref(false)
const modalCabin = ref<any>(null)

const DEFAULT_CABIN_IMAGE = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'

const nightsCount = computed(() => {
  if (!store.checkInDate || !store.checkOutDate) return 1
  const start = new Date(store.checkInDate)
  const end = new Date(store.checkOutDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
})

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  if (!day || !month) return dateStr
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthIdx = parseInt(month, 10) - 1
  return `${parseInt(day, 10)} ${months[monthIdx] || ''}`
}

// FORMATO UNIFICADO: "día ingreso (hora) - día salida (hora)"
const formattedScheduleDisplay = computed(() => {
  const inTime = adminStore.cabinSchedules.checkIn
  const outTime = adminStore.cabinSchedules.checkOut
  if (store.checkInDate && store.checkOutDate) {
    const inDate = formatDateShort(store.checkInDate)
    const outDate = formatDateShort(store.checkOutDate)
    return `${inDate} (${inTime} hrs) - ${outDate} (${outTime} hrs)`
  }
  return `Día de ingreso (${inTime} hrs) - Día de salida (${outTime} hrs)`
})

const evaluatedCabins = computed(() => {
  return adminStore.cabins.map((c: Cabin) => {
    const mainImg = c.mainImage || (c.images && c.images.length > 0 ? c.images[0] : DEFAULT_CABIN_IMAGE)
    const imageList = c.images && c.images.length > 0 ? c.images : [mainImg]
    const featureList = c.features || []

    return {
      ...c,
      mainImage: mainImg,
      images: imageList,
      features: featureList,
      isOccupied: false,
      fitsGuests: c.capacity >= store.guestsCount
    }
  })
})

const hasAvailableCabins = computed(() => {
  return evaluatedCabins.value.some((c) => !c.isOccupied)
})

function selectCabin(cabin: any) {
  if (!cabin) return
  const id = typeof cabin === 'string' ? cabin : cabin.id
  store.selectedCabinId = id
}

function openCabinModal(cabin: any) {
  modalCabin.value = cabin
  isModalOpen.value = true
}

function selectCabinFromModal(cabin: any) {
  selectCabin(cabin)
  isModalOpen.value = false
}

function handleNext() {
  if (store.selectedCabinId) {
    router.push('/cabana/paso3')
  }
}

function handleBack() {
  router.push('/cabana/paso1')
}
</script>

<template>
  <div class="space-y-4 pb-24">
    <!-- Parámetros Recordados de la Reserva (Caja Integrada) -->
    <BaseAlert variant="info" title="Parámetros de la Reserva">
      <div class="space-y-1 mt-1 text-sm font-bold">
        <div class="flex items-center justify-between">
          <span class="text-gray-700">Fechas y Horario:</span>
          <span class="text-brand-dark font-extrabold text-right">
            {{ formattedScheduleDisplay }}
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

    <!-- Alerta en caso de que TODAS estén ocupadas -->
    <BaseAlert v-if="!hasAvailableCabins" variant="warning" title="Sin Disponibilidad de Cabañas">
      No hay cabañas libres para las fechas seleccionadas. Por favor presiona "Volver" para elegir otro rango de fechas.
    </BaseAlert>

    <!-- Lista de Cabañas -->
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

    <!-- Navegación Flotante Fija -->
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

    <!-- Modal Interactivo de Detalle -->
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