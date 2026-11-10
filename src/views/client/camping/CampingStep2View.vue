<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, Sparkles, Clock, Eye } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import CampingCard from '../../../components/catalog/CampingCard.vue'
import HorarioCard from '../../../components/ui/HorarioCard.vue'
import { useSettingsStore } from '../../../stores/settingsStore'
import CampingDetailModal from '../../../components/catalog/CampingDetailModal.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useCatalogStore } from '../../../stores/catalogStore'
import { formatCLP } from '../../../lib/format'
import { findCampingSite, noCampingSiteMessage } from '../../../services/wizard'
import type { CampingSite } from '../../../types/domain'
import { formatDateShort, nightsBetween } from '../../../lib/dates'

const router = useRouter()
const store = useReservationStore()
const catalogStore = useCatalogStore()

const isModalOpen = ref(false)

const isDiario = computed(() => store.campingType === 'diario')
const guests = computed(() => store.guestsCount)

const nightsCount = computed(() => nightsBetween(store.checkInDate, store.checkOutDate))

const settingsStore = useSettingsStore()
const horario = computed(() => settingsStore.campingSchedules[isDiario.value ? 'diario' : 'pernoctar'])

const formattedScheduleDisplay = computed(() => {
  if (!store.checkInDate) return 'Sin fecha'
  if (isDiario.value) {
    return `${formatDateShort(store.checkInDate)} (Día de campo)`
  }
  return `${formatDateShort(store.checkInDate)} al ${formatDateShort(store.checkOutDate)} (${nightsCount.value} noc.)`
})

// El espacio se asigna por capacidad y modalidad. Si ninguno sirve, no se asigna uno cualquiera.
const selectedCampingOption = computed<CampingSite | undefined>(() =>
  findCampingSite(catalogStore.campingSites, guests.value, store.campingType)
)

const noSiteMessage = computed(() => noCampingSiteMessage(guests.value, store.campingType))

// Se mantiene sincronizado con el borrador: sin espacio asignado, el paso 3 queda bloqueado.
watch(selectedCampingOption, (site) => {
  store.selectedCampingId = site?.id ?? ''
}, { immediate: true })

const subtotalNeto = computed(() => store.priceBreakdown?.subtotal ?? 0)

function handleNext() {
  if (store.selectedCampingId) {
    store.nextStep()
    router.push('/camping/paso3')
  }
}

</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-contenido-nav">
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="2" />
    </div>

    <BaseAlert v-if="!selectedCampingOption" variant="warning" title="No hay un espacio para tu grupo">
      {{ noSiteMessage }}
    </BaseAlert>
    <BaseAlert v-else variant="info" title="Espacio Asignado según tu Grupo">
      Para tu grupo de <strong>{{ guests }} personas</strong> ({{ isDiario ? 'Paseo por el día' : nightsCount + ' noche(s)' }}), se ha asignado automáticamente la opción correspondiente.
    </BaseAlert>

    <div class="bg-brand-light border-2 border-brand-border p-4 rounded-2xl flex items-center justify-between text-sm font-bold text-gray-800">
      <div class="flex items-center gap-2">
        <Clock class="w-4 h-4 text-brand-accent shrink-0 stroke-[2.5]" />
        <div>
          <span class="block text-sm uppercase font-black text-gray-500">Horario de Servicio ({{ isDiario ? 'Día' : 'Noche' }}):</span>
          <span class="text-brand-dark font-black">
            {{ formattedScheduleDisplay }}
          </span>
        </div>
      </div>
    </div>

    <HorarioCard :titulo="isDiario ? 'Horario del día de campo' : 'Horario de pernoctar'" :ingreso="horario.checkIn" :salida="horario.checkOut" :salida-mismo-dia="isDiario" />
    <div v-if="selectedCampingOption" class="bg-white rounded-3xl border-2 border-brand-border p-5 shadow-sm space-y-4">
      <div class="flex items-center justify-between">
        <span class="inline-flex items-center gap-1 bg-brand-light text-brand-dark px-3 py-1 rounded-full text-sm font-black border border-brand-border">
          <Sparkles class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
          {{ selectedCampingOption?.isSpecial ? 'Espacio para Grupos Grandes' : 'Camping Estándar' }}
        </span>
        <span class="text-sm font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
          <CheckCircle2 class="w-3.5 h-3.5 stroke-[2.5]" /> Asignado
        </span>
      </div>

      <CampingCard
        v-if="selectedCampingOption"
        :site="selectedCampingOption"
        :selected-option-id="store.selectedCampingId"
        :is-diario="isDiario"
        compacta
      >
        <template #actions>
          <button
            type="button"
            @click.stop="isModalOpen = true"
            class="w-full py-3 px-4 rounded-xl bg-brand-light border-2 border-brand-dark text-brand-dark font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Eye class="w-4 h-4 stroke-[2.5]" />
            Ver detalle
          </button>
        </template>
      </CampingCard>
    </div>

    <div v-if="selectedCampingOption" class="bg-brand-dark text-white p-4 rounded-2xl border-2 border-brand-border shadow-xs flex items-center justify-between">
      <div>
        <span class="text-sm font-extrabold text-emerald-300 uppercase tracking-wider block">
          Subtotal Neto ({{ guests }} pers. {{ !isDiario ? 'x ' + nightsCount + ' noc.' : '' }})
        </span>
        <span class="text-sm font-bold text-gray-300">{{ selectedCampingOption?.name }}</span>
      </div>
      <span class="text-xl font-black text-white">
        {{ formatCLP(subtotalNeto) }}
      </span>
    </div>

    <CampingDetailModal
      v-if="selectedCampingOption"
      :isOpen="isModalOpen"
      :site="selectedCampingOption"
      @close="isModalOpen = false"
    />

    <BarraAccionInferior :disabled="!selectedCampingOption" @click="handleNext">Tus Datos</BarraAccionInferior>
  </div>
</template>