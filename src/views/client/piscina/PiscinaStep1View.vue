<script setup lang="ts">
// Piscina (SCRUM-44), paso 1: fecha y cantidad de personas. Es una solicitud solo informativa:
// no hay cupos ni cruces, así que cualquier fecha futura sirve.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Users, Receipt } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseCalendar from '../../../components/ui/BaseCalendar.vue'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { dateToISO, isoToDate, isPastDate } from '../../../lib/dates'
import { formatCLP } from '../../../lib/format'

const router = useRouter()
const store = useReservationStore()
const settingsStore = useSettingsStore()

store.setService('piscina')

/** Tope solo para evitar errores de tipeo; la piscina no tiene límite de personas. */
const MAX_PERSONAS = 999

const calendarStartDate = computed<Date | null>(() => (store.checkInDate ? isoToDate(store.checkInDate) : null))

function handleCalendarChange(payload: { start: Date | null; end: Date | null }) {
  const fecha = payload.start ? dateToISO(payload.start) : ''
  store.checkInDate = fecha
  store.checkOutDate = fecha
}

function incrementGuests() {
  store.guestsCount = Math.min(MAX_PERSONAS, store.guestsCount + 1)
}

function decrementGuests() {
  if (store.guestsCount > 1) store.guestsCount--
}

function handleGuestsBlur(event: Event) {
  // Al salir del campo se muestra el valor válido guardado
  ;(event.target as HTMLInputElement).value = String(store.guestsCount)
}

function handleGuestsInput(event: Event) {
  const val = parseInt((event.target as HTMLInputElement).value, 10)
  // Campo vacío mientras se escribe: no se fuerza el valor hasta salir del campo
  if (isNaN(val) || val < 1) return
  store.guestsCount = Math.min(MAX_PERSONAS, val)
}

const total = computed(() => store.priceBreakdown?.totalWithIva ?? 0)
const isValid = computed(() => !!store.checkInDate && !isPastDate(store.checkInDate) && store.guestsCount >= 1)

function handleNext() {
  if (!isValid.value) return
  store.nextStep()
  router.push('/piscina/paso2')
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-contenido-nav">
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="1" />
    </div>

    <BaseAlert variant="info" title="Solo para quienes vienen a la piscina">
      Si reservas una cabaña, camping o restaurante, la piscina es gratis y no necesitas esta opción.
    </BaseAlert>

    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
      <div class="space-y-2">
        <label class="block text-sm font-extrabold text-gray-500 uppercase tracking-wider">
          Selecciona la fecha de tu visita
        </label>
        <BaseCalendar :start-date="calendarStartDate" :end-date="calendarStartDate" single @change="handleCalendarChange" />
      </div>

      <div class="pt-3 border-t-2 border-gray-100 space-y-2">
        <label class="block text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Cantidad de personas
        </label>

        <div class="flex items-center justify-between bg-brand-light p-2.5 rounded-2xl border-2 border-brand-border gap-3">
          <button
            type="button"
            aria-label="Una persona menos"
            @click="decrementGuests"
            class="w-12 h-12 rounded-xl bg-white border-2 border-brand-border text-brand-dark font-black text-2xl flex items-center justify-center touch-target active:scale-95 transition-transform shadow-xs shrink-0"
          >
            -
          </button>

          <div class="flex flex-col items-center grow">
            <input
              type="number"
              :value="store.guestsCount"
              inputmode="numeric"
              @input="handleGuestsInput"
              @blur="handleGuestsBlur"
              min="1"
              :max="MAX_PERSONAS"
              class="w-20 text-center text-3xl font-black text-brand-dark bg-transparent border-b-2 border-brand-accent focus:outline-none p-0"
            />
            <span class="text-sm font-extrabold text-gray-500 uppercase tracking-wider mt-1 block text-center">
              {{ store.guestsCount === 1 ? 'Persona' : 'Personas' }}
            </span>
          </div>

          <button
            type="button"
            aria-label="Una persona más"
            @click="incrementGuests"
            class="w-12 h-12 rounded-xl bg-white border-2 border-brand-border text-brand-dark font-black text-2xl flex items-center justify-center touch-target active:scale-95 transition-transform shadow-xs shrink-0"
          >
            +
          </button>
        </div>
      </div>

      <div class="pt-3 border-t-2 border-gray-100 space-y-1 text-sm font-bold text-gray-700">
        <div class="flex items-center gap-1.5 text-sm font-extrabold text-gray-500 uppercase tracking-wider">
          <Receipt class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Valor de la entrada
        </div>
        <div class="flex justify-between">
          <span>{{ store.guestsCount }} {{ store.guestsCount === 1 ? 'persona' : 'personas' }} × {{ formatCLP(settingsStore.poolEntryPrice) }}</span>
          <span class="text-base font-black text-brand-dark">{{ formatCLP(total) }}</span>
        </div>
      </div>
    </div>

    <BarraAccionInferior :disabled="!isValid" @click="handleNext">Continuar</BarraAccionInferior>
  </div>
</template>
