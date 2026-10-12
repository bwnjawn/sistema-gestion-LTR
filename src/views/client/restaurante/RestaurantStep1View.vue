<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  ArrowRight, 
  Users, 
  Utensils, 
  Check, 
  Clock, 
  AlertCircle 
} from 'lucide-vue-next'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import BaseCalendar from '../../../components/ui/BaseCalendar.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useAdminStore } from '../../../stores/adminStore'

const router = useRouter()
const store = useReservationStore()
const adminStore = useAdminStore()

const todayStr = new Date().toISOString().substring(0, 10)
const selectedDate = ref<string>(store.checkInDate || todayStr)
const guests = ref<number>(store.guestsCount || 1)
const selectedMealTypes = ref<string[]>(store.selectedMealTypes || [])
const mealTimes = ref<Record<string, string>>(store.mealTimes || {})

// Conversión de string 'YYYY-MM-DD' a objeto Date para BaseCalendar
const calendarDate = computed<Date>(() => {
  if (!selectedDate.value) return new Date()
  const [year, month, day] = selectedDate.value.split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
})

// Opciones de servicio obtenidas desde adminStore para permitir su editabilidad posterior desde la BD
const mealOptions = computed(() => [
  { 
    id: 'desayuno', 
    label: 'Desayuno', 
    rangeText: `${adminStore.restaurantSchedules.desayuno.start} a ${adminStore.restaurantSchedules.desayuno.end} hrs`,
    times: adminStore.restaurantSchedules.desayuno.times 
  },
  { 
    id: 'almuerzo', 
    label: 'Almuerzo', 
    rangeText: `${adminStore.restaurantSchedules.almuerzo.start} a ${adminStore.restaurantSchedules.almuerzo.end} hrs`,
    times: adminStore.restaurantSchedules.almuerzo.times 
  },
  { 
    id: 'once', 
    label: 'Once', 
    rangeText: `${adminStore.restaurantSchedules.once.start} a ${adminStore.restaurantSchedules.once.end} hrs`,
    times: adminStore.restaurantSchedules.once.times 
  }
])

onMounted(() => {
  if (!store.checkInDate) store.checkInDate = selectedDate.value
})

// Evento de cambio del calendario recibiendo objetos Date
function handleCalendarChange(range: { start: Date | null; end: Date | null }) {
  if (range.start) {
    const y = range.start.getFullYear()
    const m = String(range.start.getMonth() + 1).padStart(2, '0')
    const d = String(range.start.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    selectedDate.value = dateStr
    store.checkInDate = dateStr
    store.checkOutDate = dateStr
  }
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

function handleGuestsInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value) || 1
  guests.value = Math.max(1, Math.min(200, val))
  store.guestsCount = guests.value
}

function toggleMealType(id: string) {
  const idx = selectedMealTypes.value.indexOf(id)
  if (idx >= 0) {
    selectedMealTypes.value.splice(idx, 1)
    delete mealTimes.value[id]
  } else {
    selectedMealTypes.value.push(id)
    const option = mealOptions.value.find(m => m.id === id)
    if (option && option.times.length > 0) {
      mealTimes.value[id] = option.times[0]
    }
  }
  store.selectedMealTypes = [...selectedMealTypes.value]
  store.mealTimes = { ...mealTimes.value }
}

function selectMealTime(mealId: string, timeSlot: string) {
  mealTimes.value[mealId] = timeSlot
  store.mealTimes = { ...mealTimes.value }
  
  // Acceso correcto usando el primer tipo de servicio como string
  const firstService = selectedMealTypes.value[0]
  if (firstService && mealTimes.value[firstService]) {
    store.restaurantTime = mealTimes.value[firstService]
  } else {
    store.restaurantTime = timeSlot
  }
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  if (!day || !month) return dateStr
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthIdx = parseInt(month, 10) - 1
  return `${parseInt(day, 10)} ${months[monthIdx] || ''}`
}

const isValid = computed(() => {
  if (selectedMealTypes.value.length === 0) return false
  return selectedMealTypes.value.every(mId => !!mealTimes.value[mId])
})

function handleNext() {
  if (!isValid.value) return

  store.checkInDate = selectedDate.value
  store.checkOutDate = selectedDate.value
  store.guestsCount = guests.value
  store.selectedMealTypes = [...selectedMealTypes.value]
  store.mealTimes = { ...mealTimes.value }
  
  const firstService = selectedMealTypes.value[0]
  store.restaurantTime = (firstService && mealTimes.value[firstService]) ? mealTimes.value[firstService] : ''

  router.push('/restaurante/paso2')
}

function handleBack() {
  router.push('/')
}
</script>

<template>
  <div class="space-y-4 pb-24">
    <!-- Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="1" />
    </div>

    <!-- Alerta de Guía -->
    <BaseAlert variant="info" title="Reserva de Restaurante">
      Selecciona la fecha, cantidad de personas y marca los servicios que deseas para definir su hora de atención.
    </BaseAlert>

    <!-- Formulario Principal -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
      
      <!-- Calendario -->
      <div class="space-y-2">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider">
          Fecha de Visita
        </label>
        <BaseCalendar 
          :start-date="calendarDate"
          :end-date="calendarDate"
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

      <!-- Selección de Servicios -->
      <div class="pt-3 border-t-2 border-gray-100 space-y-3">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Utensils class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Servicios Deseados * (Marca al menos uno)
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

        <div 
          v-if="selectedMealTypes.length === 0" 
          class="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-xs font-bold text-amber-900 flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>Haz clic en Desayuno, Almuerzo o Once para seleccionar los horarios permitidos.</span>
        </div>
      </div>

      <!-- Horarios Específicos por Rango para Cada Servicio Seleccionado -->
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
          <span class="text-[10px] font-extrabold text-gray-500">
            ({{ mealOptions.find(m => m.id === mealId)?.rangeText }})
          </span>
        </div>

        <!-- Botones de Horario en el Rango -->
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            v-for="timeSlot in mealOptions.find(m => m.id === mealId)?.times"
            :key="timeSlot"
            @click="selectMealTime(mealId, timeSlot)"
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
            {{ selectedMealTypes.length > 0 ? selectedMealTypes.length + ' activo(s)' : 'Ninguno' }}
          </span>
        </div>
      </div>

    </div>

    <!-- Botones Flotantes -->
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