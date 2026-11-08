<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, ArrowLeft, Users, Moon } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseCalendar from '../../../components/ui/BaseCalendar.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { formatDateShort, nightsBetween } from '../../../lib/dates'

const router = useRouter()
const reservationStore = useReservationStore()

reservationStore.setService('cabana')

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

function handleBack() {
  router.push('/')
}

function handleNext() {
  if (nightsCount.value >= 1) {
    reservationStore.nextStep()
    router.push('/cabana/paso2')
  }
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
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
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider">
          Selecciona Estadía (Llegada - Salida)
        </label>
        <BaseCalendar 
          :start-date="calendarStartDate"
          :end-date="calendarEndDate"
          @change="handleCalendarChange"
        />
      </div>

      <!-- Selector de Huéspedes (Botones + - e Input Manual Centrado) -->
      <div class="pt-3 border-t-2 border-gray-100 space-y-2">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
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
            <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider mt-1 block text-center">
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

      <!-- Resumen de Estadía -->
      <div class="bg-brand-light p-3.5 rounded-2xl border-2 border-brand-border flex items-center justify-between text-xs font-bold text-gray-700">
        <div>
          <span class="text-gray-400 text-xs uppercase font-extrabold block">Llegada</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(reservationStore.checkInDate) }}</span>
        </div>
        <div class="text-center border-x border-gray-200 px-3">
          <span class="text-gray-400 text-xs uppercase font-extrabold block">Noches</span>
          <span class="text-brand-dark font-black flex items-center justify-center gap-1">
            <Moon class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            {{ nightsCount }} {{ nightsCount === 1 ? 'Noche' : 'Noches' }}
          </span>
        </div>
        <div class="text-right">
          <span class="text-gray-400 text-xs uppercase font-extrabold block">Salida</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(reservationStore.checkOutDate) }}</span>
        </div>
      </div>

    </div>

    <!-- Botones Flotantes Inferiores -->
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
          :disabled="nightsCount < 1"
          @click="handleNext"
        >
          Ver Cabañas
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>