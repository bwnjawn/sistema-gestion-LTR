<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles, Clock } from 'lucide-vue-next'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import CampingCard from '../../../components/catalog/CampingCard.vue'
import CampingDetailModal from '../../../components/catalog/CampingDetailModal.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useCatalogStore } from '../../../stores/catalogStore'
import { calculateCampingPrice } from '../../../services/pricing'
import { calculateNights, formatCLP } from '../../../lib/format'
import type { CampingSite } from '../../../types/domain'

const router = useRouter()
const store = useReservationStore()
const catalogStore = useCatalogStore()

const isModalOpen = ref(false)

const isDiario = computed(() => store.campingType === 'diario')
const guests = computed(() => store.guestsCount)

const nightsCount = computed(() => calculateNights(store.checkInDate, store.checkOutDate))

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  if (!day || !month) return dateStr
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthIdx = parseInt(month, 10)
  return `${parseInt(day, 10)} ${months[monthIdx - 1]}`
}

const formattedScheduleDisplay = computed(() => {
  if (!store.checkInDate) return 'Sin fecha'
  if (isDiario.value) {
    return `${formatDateShort(store.checkInDate)} (Día de campo)`
  }
  return `${formatDateShort(store.checkInDate)} al ${formatDateShort(store.checkOutDate)} (${nightsCount.value} noc.)`
})

// Asignación dinámica evaluando minCapacity y maxCapacity en el catálogo
const selectedCampingOption = computed<CampingSite | undefined>(() => {
  const matched = catalogStore.campingSites.find(
    s => guests.value >= s.minCapacity && guests.value <= s.maxCapacity
  )
  return matched || catalogStore.campingSites[0]
})

onMounted(() => {
  if (selectedCampingOption.value) {
    store.selectedCampingId = selectedCampingOption.value.id
  }
})

const priceBreakdown = computed(() => {
  if (!selectedCampingOption.value) return { subtotal: 0, ivaAmount: 0, totalWithIva: 0, depositAmount: 0, nights: 1 }
  return calculateCampingPrice(
    selectedCampingOption.value,
    store.checkInDate,
    store.checkOutDate,
    guests.value,
    store.campingType
  )
})

function handleNext() {
  if (store.selectedCampingId) {
    router.push('/camping/paso3')
  }
}

function handleBack() {
  router.push('/camping/paso1')
}
</script>

<template>
  <div class="space-y-4 pb-24">
    <BaseAlert variant="info" title="Espacio Asignado según tu Grupo">
      Para tu grupo de <strong>{{ guests }} personas</strong> ({{ isDiario ? 'Paseo por el día' : nightsCount + ' noche(s)' }}), se ha asignado automáticamente la opción correspondiente.
    </BaseAlert>

    <div class="bg-brand-light border-2 border-brand-border p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-gray-800">
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 text-brand-accent shrink-0 stroke-[2.5]" />
        <div>
          <span class="block text-[10px] uppercase font-black text-gray-500">Horario de Servicio ({{ isDiario ? 'Día' : 'Noche' }}):</span>
          <span class="text-brand-dark font-black">
            {{ formattedScheduleDisplay }}
          </span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-3xl border-2 border-brand-border p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <span class="inline-flex items-center gap-1 bg-brand-light text-brand-dark px-3 py-1 rounded-full text-xs font-black border border-brand-border">
          <Sparkles class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
          {{ selectedCampingOption?.isSpecial ? 'Espacio para Grupos Grandes' : 'Camping Estándar' }}
        </span>
        <span class="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
          <CheckCircle2 class="w-3.5 h-3.5 stroke-[2.5]" /> Asignado
        </span>
      </div>

      <CampingCard
        v-if="selectedCampingOption"
        :site="selectedCampingOption"
        :selected-option-id="store.selectedCampingId"
        :is-diario="isDiario"
        @click="isModalOpen = true"
      />
    </div>

    <div class="bg-brand-dark text-white p-4 rounded-2xl border-2 border-brand-border shadow-xs flex items-center justify-between">
      <div>
        <span class="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">
          Subtotal Neto ({{ guests }} pers. {{ !isDiario ? 'x ' + nightsCount + ' noc.' : '' }})
        </span>
        <span class="text-xs font-bold text-gray-300">{{ selectedCampingOption?.name }}</span>
      </div>
      <span class="text-xl font-black text-white">
        {{ formatCLP(priceBreakdown.subtotal) }}
      </span>
    </div>

    <CampingDetailModal
      v-if="selectedCampingOption"
      :isOpen="isModalOpen"
      :site="selectedCampingOption"
      @close="isModalOpen = false"
    />

    <div class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-3.5 shadow-2xl">
      <div class="max-w-md mx-auto flex items-center gap-3">
        <BaseButton variant="outline" size="lg" @click="handleBack">
          <ArrowLeft class="w-5 h-5 mr-1 stroke-[2.5]" />
          Volver
        </BaseButton>

        <BaseButton 
          variant="primary" 
          size="lg" 
          fullWidth 
          @click="handleNext"
        >
          Tus Datos
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>