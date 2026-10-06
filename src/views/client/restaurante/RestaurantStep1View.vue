<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, ArrowLeft, Users, Clock, Utensils, Check, AlertCircle } from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseCalendar from '../../../components/ui/BaseCalendar.vue'

const router = useRouter()
const store = useReservationStore()

interface MealOption {
  id: 'desayuno' | 'almuerzo' | 'once'
  label: string
  times: string[]
}

const mealOptions: MealOption[] = [
  {
    id: 'desayuno',
    label: 'Desayuno',
    times: ['09:00', '09:30', '10:30']
  },
  {
    id: 'almuerzo',
    label: 'Almuerzo',
    times: ['12:30', '13:30', '14:30']
  },
  {
    id: 'once',
    label: 'Once',
    times: ['17:30', '18:30', '19:30']
  }
]

const selectedDate = ref<Date | null>(
  store.checkInDate ? new Date(store.checkInDate + 'T00:00:00') : new Date(2026, 9, 6)
)
const guests = ref<number>(store.guestsCount || 5)

// Inicia estrictamente vacío (sin ningún servicio pre-seleccionado)
const selectedMealTypes = ref<string[]>(
  store.selectedMealTypes ? [...store.selectedMealTypes] : []
)

const mealTimes = ref<Record<string, string>>(
  store.mealTimes ? { ...store.mealTimes } : {}
)

function toggleMealType(id: string) {
  const index = selectedMealTypes.value.indexOf(id)
  if (index > -1) {
    selectedMealTypes.value.splice(index, 1)
    delete mealTimes.value[id]
  } else {
    selectedMealTypes.value.push(id)
    const defaultTime = mealOptions.find(m => m.id === id)?.times[0] || ''
    mealTimes.value[id] = defaultTime
  }
}

function toggleMealTime(mealId: string, time: string) {
  if (mealTimes.value[mealId] === time) {
    mealTimes.value[mealId] = ''
  } else {
    mealTimes.value[mealId] = time
  }
}

function handleCalendarChange(payload: { start: Date | null; end: Date | null }) {
  selectedDate.value = payload.start
  if (payload.start) {
    store.checkInDate = formatDateISO(payload.start)
    store.checkOutDate = formatDateISO(payload.start)
  }
}

function formatDateISO(d: Date) {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateShort(d: Date | null) {
  if (!d) return '—'
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function handleGuestsInput(e: Event) {
  const target = e.target as HTMLInputElement
  let val = parseInt(target.value) || 1
  if (val < 1) val = 1
  if (val > 200) val = 200
  guests.value = val
  store.guestsCount = val
}

function incrementGuests() {
  if (guests.value < 200) {
    guests.value++
    store.guestsCount = guests.value
  }
}

function decrementGuests() {
  if (guests.value > 1) {
    guests.value--
    store.guestsCount = guests.value
  }
}

// Requiere fecha, al menos un servicio activo y su horario correspondiente elegido
const isValid = computed(() => {
  if (!selectedDate.value) return false
  if (selectedMealTypes.value.length === 0) return false
  return selectedMealTypes.value.every(mealId => !!mealTimes.value[mealId])
})

function handleNext() {
  if (!isValid.value || !selectedDate.value) return
  
  store.checkInDate = formatDateISO(selectedDate.value)
  store.checkOutDate = formatDateISO(selectedDate.value)
  store.guestsCount = guests.value
  store.selectedMealTypes = [...selectedMealTypes.value]
  store.mealTimes = { ...mealTimes.value }
  
  store.nextStep()
  router.push({ name: 'restaurant-step2' })
}

function handleBack() {
  router.push('/')
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto pb-28">
    
    <!-- Indicador de Pasos Estándar -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="1" />
    </div>

    <!-- Alerta de Guía -->
    <BaseAlert variant="info" title="Reserva de Restaurante">
      Selecciona la fecha, la cantidad de personas y marca al menos una opción de servicio (Desayuno, Almuerzo o Once) para continuar.
    </BaseAlert>

    <!-- Formulario Principal -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
      
      <!-- Calendario -->
      <div class="space-y-2">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider">
          Fecha de Visita
        </label>
        <BaseCalendar 
          :start-date="selectedDate"
          :end-date="selectedDate"
          @change="handleCalendarChange"
        />
      </div>

      <!-- Cantidad de Comensales -->
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
              :value="guests"
              @input="handleGuestsInput"
              min="1"
              max="200"
              class="w-20 text-center text-3xl font-black text-brand-dark bg-transparent border-b-2 border-brand-accent focus:outline-none p-0"
            />
            <span class="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider mt-1 block">
              {{ guests === 1 ? 'Persona' : 'Personas' }}
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

      <!-- Selección de Servicios (Comienza Desmarcado) -->
      <div class="pt-3 border-t-2 border-gray-100 space-y-3">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Utensils class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Servicios Deseados * (Selecciona al menos uno)
        </label>

        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            v-for="meal in mealOptions"
            :key="meal.id"
            @click="toggleMealType(meal.id)"
            :class="[
              'py-3.5 px-2 rounded-2xl font-black text-xs transition-all touch-target border-2 flex flex-col items-center justify-center gap-1.5 relative',
              selectedMealTypes.includes(meal.id)
                ? 'bg-brand-dark text-white border-brand-dark shadow-xs scale-102'
                : 'bg-brand-light text-brand-dark border-brand-border hover:bg-gray-200'
            ]"
          >
            <span class="text-xs font-black">{{ meal.label }}</span>
            <span 
              v-if="selectedMealTypes.includes(meal.id)"
              class="w-4 h-4 bg-emerald-400 text-brand-dark rounded-full flex items-center justify-center text-[10px] font-black"
            >
              <Check class="w-3 h-3 stroke-[2.5]" />
            </span>
          </button>
        </div>

        <!-- Aviso si no hay nada seleccionado -->
        <div 
          v-if="selectedMealTypes.length === 0" 
          class="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs font-bold text-amber-900 flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>Haz clic en Desayuno, Almuerzo y/o Once para habilitar sus horarios.</span>
        </div>
      </div>

      <!-- Horarios por Servicio Seleccionado -->
      <div 
        v-for="mealId in selectedMealTypes" 
        :key="mealId"
        class="bg-brand-light p-4 rounded-2xl border-2 border-brand-border space-y-2.5"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-extrabold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
            <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Horario para {{ mealOptions.find(m => m.id === mealId)?.label }}
          </span>
          <span class="text-[11px] font-black text-brand-accent bg-white px-2.5 py-0.5 rounded-full border border-brand-border">
            {{ mealTimes[mealId] ? mealTimes[mealId] + ' hrs' : 'Selecciona hora' }}
          </span>
        </div>

        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            v-for="timeSlot in mealOptions.find(m => m.id === mealId)?.times"
            :key="timeSlot"
            @click="toggleMealTime(mealId, timeSlot)"
            :class="[
              'py-2.5 px-3 rounded-xl font-black text-xs transition-all touch-target border-2',
              mealTimes[mealId] === timeSlot
                ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                : 'bg-white text-brand-dark border-brand-border hover:bg-gray-100'
            ]"
          >
            {{ timeSlot }} hrs
          </button>
        </div>
      </div>

      <!-- Resumen en Tiempo Real -->
      <div class="bg-brand-light p-3.5 rounded-2xl border-2 border-brand-border flex items-center justify-between text-xs font-bold text-gray-700">
        <div>
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Fecha</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(selectedDate) }}</span>
        </div>
        <div class="text-center">
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Comensales</span>
          <span class="text-brand-dark font-black">{{ guests }} pers.</span>
        </div>
        <div class="text-right">
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Servicios</span>
          <span class="text-brand-dark font-black">
            {{ selectedMealTypes.length > 0 ? selectedMealTypes.length + ' elegido(s)' : 'Ninguno' }}
          </span>
        </div>
      </div>

    </div>

    <!-- BOTONES FIJOS EN LA PARTE INFERIOR -->
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