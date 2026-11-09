<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Tent, Sun, Moon, Users, AlertCircle } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseCalendar from '../../../components/ui/BaseCalendar.vue'
import HorarioCard from '../../../components/ui/HorarioCard.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { useRequestsStore } from '../../../stores/requestsStore'
import { validateGuestCapacity, isCampingDayBlocked, isCampingStayBlocked } from '../../../services/availability'
import { nightsBetween } from '../../../lib/dates'

const router = useRouter()
const store = useReservationStore()
const settingsStore = useSettingsStore()
const requestsStore = useRequestsStore()

store.setService('camping')

// Diario y pernoctar tienen cupos separados (SCRUM-244)
function isDayBlocked(dateStr: string): boolean {
  return isCampingDayBlocked(dateStr, store.campingType, store.guestsCount, requestsStore.requests, settingsStore.limitesAforo.campingPersonas)
}

function isStayBlocked(inicio: string, salida: string): boolean {
  return isCampingStayBlocked(inicio, salida, store.guestsCount, requestsStore.requests, settingsStore.limitesAforo.campingPersonas)
}

const campingType = computed(() => store.campingType)

function setCampingType(type: 'diario' | 'pernoctar') {
  store.campingType = type
  if (type === 'diario') {
    store.checkOutDate = store.checkInDate
  }
}

// Conversión de string YYYY-MM-DD a objeto Date para BaseCalendar
const calendarStartDate = computed<Date | null>(() => {
  if (!store.checkInDate) return null
  const [y, m, d] = store.checkInDate.split('-').map(Number)
  return new Date(y, m - 1, d)
})

const calendarEndDate = computed<Date | null>(() => {
  if (store.campingType === 'diario') return calendarStartDate.value
  if (!store.checkOutDate) return null
  const [y, m, d] = store.checkOutDate.split('-').map(Number)
  return new Date(y, m - 1, d)
})

function handleCalendarChange(payload: { start: Date | null; end: Date | null }) {
  if (payload.start) {
    const year = payload.start.getFullYear()
    const month = String(payload.start.getMonth() + 1).padStart(2, '0')
    const day = String(payload.start.getDate()).padStart(2, '0')
    store.checkInDate = `${year}-${month}-${day}`
    if (store.campingType === 'diario') {
      store.checkOutDate = `${year}-${month}-${day}`
    }
  } else {
    store.checkInDate = ''
  }

  if (store.campingType === 'pernoctar') {
    if (payload.end) {
      const year = payload.end.getFullYear()
      const month = String(payload.end.getMonth() + 1).padStart(2, '0')
      const day = String(payload.end.getDate()).padStart(2, '0')
      store.checkOutDate = `${year}-${month}-${day}`
    } else {
      store.checkOutDate = ''
    }
  }
}

function incrementGuests() {
  store.guestsCount++
}

function decrementGuests() {
  if (store.guestsCount > 1) {
    store.guestsCount--
  }
}

function handleGuestsBlur(event: Event) {
  // Al salir del campo se muestra el valor válido guardado
  (event.target as HTMLInputElement).value = String(store.guestsCount)
}

function handleGuestsInput(event: Event) {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  if (isNaN(val) || val < 1) {
    // Campo vacío mientras se escribe: no se fuerza el valor hasta salir del campo
    return
  }
  store.guestsCount = Math.min(150, val)
}

// Validación estricta de aforo según reglas de configuración
const capacityValidation = computed(() => {
  const maxCap = settingsStore.capacityRules?.maxCampingPeopleCapacity || 150
  return validateGuestCapacity(store.guestsCount, 1, maxCap)
})

// Si el cliente cambia las personas o la modalidad después de elegir fecha, el cupo puede no alcanzar
const dateUnavailable = computed(() => {
  if (!store.checkInDate) return false
  if (store.campingType === 'diario') return isDayBlocked(store.checkInDate)
  return nightsBetween(store.checkInDate, store.checkOutDate) >= 1 && isStayBlocked(store.checkInDate, store.checkOutDate)
})

const isValid = computed(() => {
  if (!store.checkInDate) return false
  if (dateUnavailable.value) return false
  if (store.campingType === 'pernoctar' && nightsBetween(store.checkInDate, store.checkOutDate) < 1) return false
  return capacityValidation.value.isValid
})

function handleBack() {
  router.push('/')
}

function handleNext() {
  if (isValid.value) {
    store.nextStep()
    router.push('/camping/paso2')
  }
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="1" />
    </div>

    <BaseAlert variant="info" title="Reserva de Camping">
      Selecciona la modalidad (Paseo por el día o Pernoctar con carpa), la fecha y la cantidad de visitantes.
    </BaseAlert>

    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
      
      <div class="space-y-2">
        <label class="block text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Tent class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Tipo de Visita
        </label>

        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            @click="setCampingType('pernoctar')"
            :class="[
              'p-3.5 rounded-2xl border-2 text-left transition-all touch-target flex flex-col justify-between',
              campingType === 'pernoctar'
                ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                : 'bg-brand-light text-brand-dark border-brand-border hover:bg-gray-100'
            ]"
          >
            <div class="flex items-center justify-between mb-2">
              <Moon class="w-5 h-5 text-brand-accent stroke-[2.5]" />
              <span v-if="campingType === 'pernoctar'" class="text-sm font-black uppercase bg-brand-accent px-2 py-0.5 rounded-full text-white">Activo</span>
            </div>
            <div>
              <span class="text-sm font-black block">Pernoctar</span>
              <span class="text-sm font-semibold text-gray-300 block">Con carpa (por noche)</span>
            </div>
          </button>

          <button
            type="button"
            @click="setCampingType('diario')"
            :class="[
              'p-3.5 rounded-2xl border-2 text-left transition-all touch-target flex flex-col justify-between',
              campingType === 'diario'
                ? 'bg-brand-dark text-white border-brand-dark shadow-sm'
                : 'bg-brand-light text-brand-dark border-brand-border hover:bg-gray-100'
            ]"
          >
            <div class="flex items-center justify-between mb-2">
              <Sun class="w-5 h-5 text-amber-500 stroke-[2.5]" />
              <span v-if="campingType === 'diario'" class="text-sm font-black uppercase bg-brand-accent px-2 py-0.5 rounded-full text-white">Activo</span>
            </div>
            <div>
              <span class="text-sm font-black block">Paseo por el Día</span>
              <span class="text-sm font-semibold text-gray-300 block">Uso diario sin carpa</span>
            </div>
          </button>
        </div>
      </div>

      <div class="space-y-2 pt-2 border-t-2 border-gray-100">
        <label class="block text-sm font-extrabold text-gray-500 uppercase tracking-wider">
          Selecciona Fecha ({{ campingType === 'diario' ? 'Día de visita' : 'Llegada - Salida' }})
        </label>
        <BaseCalendar 
          :start-date="calendarStartDate"
          :end-date="calendarEndDate"
          :is-date-disabled-fn="isDayBlocked"
          :is-range-blocked-fn="isStayBlocked"
          @change="handleCalendarChange"
        />
        <BaseAlert v-if="dateUnavailable" variant="warning" title="Sin cupo en esa fecha">
          Para {{ store.guestsCount }} personas no queda cupo de {{ campingType === 'diario' ? 'paseo por el día' : 'pernoctar' }} en la fecha elegida. Cambia la fecha o la cantidad de personas.
        </BaseAlert>
        <HorarioCard
          :titulo="campingType === 'diario' ? 'Horario del día de campo' : 'Horario de pernoctar'"
          :ingreso="settingsStore.campingSchedules[campingType === 'diario' ? 'diario' : 'pernoctar'].checkIn"
          :salida="settingsStore.campingSchedules[campingType === 'diario' ? 'diario' : 'pernoctar'].checkOut"
          :salida-mismo-dia="campingType === 'diario'"
        />
      </div>

      <div class="pt-3 border-t-2 border-gray-100 space-y-2">
        <label class="block text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Cantidad de Visitantes
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
              :value="store.guestsCount"
              inputmode="numeric"
              @input="handleGuestsInput"
              @blur="handleGuestsBlur"
              min="1"
              max="150"
              class="w-20 text-center text-3xl font-black text-brand-dark bg-transparent border-b-2 border-brand-accent focus:outline-none p-0"
            />
            <span class="text-sm font-extrabold text-gray-500 uppercase tracking-wider mt-1 block text-center">
              {{ store.guestsCount === 1 ? 'Persona' : 'Personas' }}
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

        <div v-if="!capacityValidation.isValid" class="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-sm font-bold text-amber-900 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>{{ capacityValidation.message }}</span>
        </div>
      </div>

    </div>

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
          :disabled="!isValid"
          @click="handleNext"
        >
          Ver Opciones
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>