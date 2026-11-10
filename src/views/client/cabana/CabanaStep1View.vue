<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Users, Moon } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseCalendar from '../../../components/ui/BaseCalendar.vue'
import HorarioCard from '../../../components/ui/HorarioCard.vue'
import { useSettingsStore } from '../../../stores/settingsStore'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useCatalogStore } from '../../../stores/catalogStore'
import { useRequestsStore } from '../../../stores/requestsStore'
import { isCabinNightBlocked, isCabinStayBlocked } from '../../../services/availability'
import { formatDateShort, nightsBetween } from '../../../lib/dates'

const router = useRouter()
const settingsStore = useSettingsStore()
const reservationStore = useReservationStore()
const catalogStore = useCatalogStore()
const requestsStore = useRequestsStore()

reservationStore.setService('cabana')

// Una noche se bloquea si todas las cabañas con capacidad para el grupo están ocupadas (SCRUM-244)
function isNightBlocked(dateStr: string): boolean {
  return isCabinNightBlocked(dateStr, reservationStore.guestsCount, catalogStore.cabins, requestsStore.requests)
}

// Una estadía se bloquea si ninguna cabaña que le sirve está libre todas las noches
function isStayBlocked(inicio: string, salida: string): boolean {
  return isCabinStayBlocked(inicio, salida, reservationStore.guestsCount, catalogStore.cabins, requestsStore.requests)
}

// Conversión de string (YYYY-MM-DD) a objeto Date para BaseCalendar (corrige TS2322)
const calendarStartDate = computed<Date | null>(() => {
  if (!reservationStore.checkInDate) return null
  const [y, m, d] = reservationStore.checkInDate.split('-').map(Number)
  return new Date(y, m - 1, d)
})

const calendarEndDate = computed<Date | null>(() => {
  if (!reservationStore.checkOutDate) return null
  const [y, m, d] = reservationStore.checkOutDate.split('-').map(Number)
  return new Date(y, m - 1, d)
})

// Manejo del evento @change con tipo { start: Date | null; end: Date | null } (corrige TS2322)
function handleCalendarChange(payload: { start: Date | null; end: Date | null }) {
  if (payload.start) {
    const year = payload.start.getFullYear()
    const month = String(payload.start.getMonth() + 1).padStart(2, '0')
    const day = String(payload.start.getDate()).padStart(2, '0')
    reservationStore.checkInDate = `${year}-${month}-${day}`
  } else {
    reservationStore.checkInDate = ''
  }

  if (payload.end) {
    const year = payload.end.getFullYear()
    const month = String(payload.end.getMonth() + 1).padStart(2, '0')
    const day = String(payload.end.getDate()).padStart(2, '0')
    reservationStore.checkOutDate = `${year}-${month}-${day}`
  } else {
    reservationStore.checkOutDate = ''
  }
}

// Controles para cantidad de huéspedes (+, - e ingreso manual)
function incrementGuests() {
  reservationStore.guestsCount++
}

function decrementGuests() {
  if (reservationStore.guestsCount > 1) {
    reservationStore.guestsCount--
  }
}

function handleGuestsBlur(event: Event) {
  // Al salir del campo se muestra el valor válido guardado
  (event.target as HTMLInputElement).value = String(reservationStore.guestsCount)
}

function handleGuestsInput(event: Event) {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  if (isNaN(val) || val < 1) {
    // Campo vacío mientras se escribe: no se fuerza el valor hasta salir del campo
    return
  }
  reservationStore.guestsCount = Math.min(20, val)
}

// Cálculo de noches
const nightsCount = computed(() => nightsBetween(reservationStore.checkInDate, reservationStore.checkOutDate))

// Si el cliente cambia las personas después de elegir fechas, la estadía puede quedar sin cabaña
const stayUnavailable = computed(() =>
  nightsCount.value >= 1 && isStayBlocked(reservationStore.checkInDate, reservationStore.checkOutDate)
)

function handleNext() {
  if (nightsCount.value >= 1 && !stayUnavailable.value) {
    reservationStore.nextStep()
    router.push('/cabana/paso2')
  }
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-contenido-nav">
    <!-- Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="1" />
    </div>

    <!-- Alerta Informativa -->
    <BaseAlert variant="info" title="Alojamiento en Cabaña">
      Selecciona las fechas de llegada y salida (mínimo 1 noche) y la cantidad de huéspedes.
    </BaseAlert>

    <!-- Contenedor del Calendario y Huéspedes -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
      
      <!-- Calendario Interactivo -->
      <div class="space-y-2">
        <label class="block text-sm font-extrabold text-gray-500 uppercase tracking-wider">
          Selecciona Estadía (Llegada - Salida)
        </label>
        <BaseCalendar 
          :start-date="calendarStartDate"
          :end-date="calendarEndDate"
          :is-date-disabled-fn="isNightBlocked"
          :is-range-blocked-fn="isStayBlocked"
          @change="handleCalendarChange"
        />
      </div>

      <!-- Selector de Huéspedes (Botones + - e Input Manual Centrado) -->
      <div class="pt-3 border-t-2 border-gray-100 space-y-2">
        <label class="block text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Cantidad de Huéspedes
        </label>

        <div class="flex items-center justify-between bg-brand-light p-2.5 rounded-2xl border-2 border-brand-border gap-3">
          <button
            type="button"
            @click="decrementGuests"
            class="w-12 h-12 rounded-xl bg-white border-2 border-brand-border text-brand-dark font-black text-2xl flex items-center justify-center touch-target active:scale-95 transition-transform shadow-xs shrink-0"
          >
            -
          </button>

          <div class="flex flex-col items-center grow">
            <input 
              type="number"
              :value="reservationStore.guestsCount"
              inputmode="numeric"
              @input="handleGuestsInput"
              @blur="handleGuestsBlur"
              min="1"
              max="20"
              class="w-20 text-center text-3xl font-black text-brand-dark bg-transparent border-b-2 border-brand-accent focus:outline-none p-0"
            />
            <span class="text-sm font-extrabold text-gray-500 uppercase tracking-wider mt-1 block text-center">
              {{ reservationStore.guestsCount === 1 ? 'Persona' : 'Personas' }}
            </span>
          </div>

          <button
            type="button"
            @click="incrementGuests"
            class="w-12 h-12 rounded-xl bg-white border-2 border-brand-border text-brand-dark font-black text-2xl flex items-center justify-center touch-target active:scale-95 transition-transform shadow-xs shrink-0"
          >
            +
          </button>
        </div>
      </div>

      <BaseAlert v-if="stayUnavailable" variant="warning" title="No hay cabaña libre">
        Para {{ reservationStore.guestsCount }} personas no queda ninguna cabaña libre en esas fechas. Cambia las fechas o la cantidad de personas.
      </BaseAlert>

      <!-- Resumen de Estadía -->
      <div class="bg-brand-light p-3.5 rounded-2xl border-2 border-brand-border flex items-center justify-between text-sm font-bold text-gray-700">
        <div>
          <span class="text-gray-400 text-sm uppercase font-extrabold block">Llegada</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(reservationStore.checkInDate) }}</span>
        </div>
        <div class="text-center border-x border-gray-200 px-3">
          <span class="text-gray-400 text-sm uppercase font-extrabold block">Noches</span>
          <span class="text-brand-dark font-black flex items-center justify-center gap-1">
            <Moon class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            {{ nightsCount }} {{ nightsCount === 1 ? 'Noche' : 'Noches' }}
          </span>
        </div>
        <div class="text-right">
          <span class="text-gray-400 text-sm uppercase font-extrabold block">Salida</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(reservationStore.checkOutDate) }}</span>
        </div>
      </div>
      <HorarioCard titulo="Horarios de la cabaña" :ingreso="settingsStore.cabinSchedules.checkIn" :salida="settingsStore.cabinSchedules.checkOut" />

    </div>

    <BarraAccionInferior :disabled="nightsCount < 1 || stayUnavailable" @click="handleNext">Ver Cabañas</BarraAccionInferior>
  </div>
</template>