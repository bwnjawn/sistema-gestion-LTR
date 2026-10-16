<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Users, Utensils, Clock, Check, AlertCircle } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseCalendar from '../../../components/ui/BaseCalendar.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { generateTimeSlots, validateGuestCapacity } from '../../../services/availability'

const router = useRouter()
const store = useReservationStore()
const settingsStore = useSettingsStore()

store.setService('restaurant')

const calendarDate = computed<Date | null>(() => {
  if (!store.checkInDate) return null
  const [y, m, d] = store.checkInDate.split('-').map(Number)
  return new Date(y, m - 1, d)
})

function handleCalendarChange(payload: { start: Date | null; end: Date | null }) {
  if (payload.start) {
    const year = payload.start.getFullYear()
    const month = String(payload.start.getMonth() + 1).padStart(2, '0')
    const day = String(payload.start.getDate()).padStart(2, '0')
    store.checkInDate = `${year}-${month}-${day}`
    store.checkOutDate = `${year}-${month}-${day}`
  } else {
    store.checkInDate = ''
    store.checkOutDate = ''
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

function handleGuestsInput(event: Event) {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  if (isNaN(val) || val < 1) {
    store.guestsCount = 1
  } else {
    store.guestsCount = Math.min(200, val)
  }
}

// Validación estricta de aforo según reglas del negocio
const capacityValidation = computed(() => {
  const maxCap = 200
  return validateGuestCapacity(store.guestsCount, 1, maxCap)
})

const mealOptions = computed(() => {
  const sched = settingsStore.restaurantSchedules
  return [
    {
      id: 'desayuno',
      label: 'Desayuno',
      rangeText: `${sched.desayuno.start} - ${sched.desayuno.end}`,
      times: sched.desayuno.times && sched.desayuno.times.length > 0
        ? sched.desayuno.times
        : generateTimeSlots(sched.desayuno.start, sched.desayuno.end, 30)
    },
    {
      id: 'almuerzo',
      label: 'Almuerzo',
      rangeText: `${sched.almuerzo.start} - ${sched.almuerzo.end}`,
      times: sched.almuerzo.times && sched.almuerzo.times.length > 0
        ? sched.almuerzo.times
        : generateTimeSlots(sched.almuerzo.start, sched.almuerzo.end, 30)
    },
    {
      id: 'once',
      label: 'Once',
      rangeText: `${sched.once.start} - ${sched.once.end}`,
      times: sched.once.times && sched.once.times.length > 0
        ? sched.once.times
        : generateTimeSlots(sched.once.start, sched.once.end, 30)
    }
  ]
})

function toggleMealType(id: string) {
  const idx = store.selectedMealTypes.indexOf(id)
  if (idx >= 0) {
    store.selectedMealTypes.splice(idx, 1)
    delete store.mealTimes[id]
  } else {
    store.selectedMealTypes.push(id)
    const opt = mealOptions.value.find(m => m.id === id)
    if (opt && opt.times && opt.times.length > 0) {
      const defaultTime = opt.times[0]
      store.mealTimes[id] = defaultTime
      store.restaurantTime = defaultTime
    }
  }
}

function selectMealTime(mealId: string, time: string) {
  store.mealTimes[mealId] = time
  store.restaurantTime = time
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-'
  const [, m, d] = dateStr.split('-').map(Number)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d} ${months[m - 1]}`
}

const isValid = computed(() => {
  if (!store.checkInDate) return false
  if (!capacityValidation.value.isValid) return false
  if (store.selectedMealTypes.length === 0) return false
  for (const mId of store.selectedMealTypes) {
    if (!store.mealTimes[mId]) return false
  }
  return true
})

function handleBack() {
  router.push('/')
}

function handleNext() {
  if (isValid.value) {
    store.nextStep()
    router.push('/restaurante/paso2')
  }
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="1" />
    </div>

    <BaseAlert variant="info" title="Reserva de Restaurante">
      Selecciona la fecha, el número de comensales y el servicio/horario de comida.
    </BaseAlert>

    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
      
      <div class="space-y-2">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Utensils class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Fecha de Visita
        </label>
        <BaseCalendar 
          :start-date="calendarDate"
          :end-date="calendarDate"
          @change="handleCalendarChange"
        />
      </div>

      <div class="pt-3 border-t-2 border-gray-100 space-y-2">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Cantidad de Comensales
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
              @input="handleGuestsInput"
              min="1"
              max="200"
              class="w-20 text-center text-3xl font-black text-brand-dark bg-transparent border-b-2 border-brand-accent focus:outline-none p-0"
            />
            <span class="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mt-1 block text-center">
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

        <div v-if="!capacityValidation.isValid" class="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs font-bold text-amber-900 flex items-center gap-2">
          <AlertCircle class="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>{{ capacityValidation.message }}</span>
        </div>
      </div>

      <div class="pt-3 border-t-2 border-gray-100 space-y-3">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Servicios de Comida Requeridos
        </label>

        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            v-for="meal in mealOptions"
            :key="meal.id"
            @click="toggleMealType(meal.id)"
            :class="[
              'p-3 rounded-2xl border-2 transition-all touch-target flex flex-col items-center justify-center gap-1 text-center',
              store.selectedMealTypes.includes(meal.id)
                ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                : 'bg-brand-light text-brand-dark border-brand-border hover:bg-gray-200'
            ]"
          >
            <span class="text-xs font-black">{{ meal.label }}</span>
            <span 
              v-if="store.selectedMealTypes.includes(meal.id)"
              class="w-4 h-4 bg-emerald-400 text-brand-dark rounded-full flex items-center justify-center text-[10px] font-black"
            >
              <Check class="w-3 h-3 stroke-[2.5]" />
            </span>
          </button>
        </div>

        <div 
          v-if="store.selectedMealTypes.length === 0" 
          class="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs font-bold text-amber-900 flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>Haz clic en Desayuno, Almuerzo o Once para seleccionar los horarios permitidos.</span>
        </div>
      </div>

      <div 
        v-for="mealId in store.selectedMealTypes" 
        :key="mealId"
        class="bg-brand-light p-4 rounded-2xl border-2 border-brand-border space-y-2.5"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
            <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Horario para {{ mealOptions.find(m => m.id === mealId)?.label }}
          </span>
          <span class="text-[10px] font-extrabold text-gray-500">
            ({{ mealOptions.find(m => m.id === mealId)?.rangeText }})
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            v-for="timeSlot in mealOptions.find(m => m.id === mealId)?.times"
            :key="timeSlot"
            @click="selectMealTime(mealId, timeSlot)"
            :class="[
              'py-2.5 px-3 rounded-xl font-black text-xs transition-all touch-target border-2',
              store.mealTimes[mealId] === timeSlot
                ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                : 'bg-white text-brand-dark border-brand-border hover:bg-gray-100'
            ]"
          >
            {{ timeSlot }} hrs
          </button>
        </div>
      </div>

      <div class="bg-brand-light p-3.5 rounded-2xl border-2 border-brand-border flex items-center justify-between text-xs font-bold text-gray-700">
        <div>
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Fecha</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(store.checkInDate) }}</span>
        </div>
        <div class="text-center border-x border-gray-200 px-3">
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Comensales</span>
          <span class="text-brand-dark font-black">{{ store.guestsCount }} pers.</span>
        </div>
        <div class="text-right">
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Servicios</span>
          <span class="text-brand-dark font-black">
            {{ store.selectedMealTypes.length > 0 ? store.selectedMealTypes.length + ' activo(s)' : 'Ninguno' }}
          </span>
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
          Elegir Menú
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>