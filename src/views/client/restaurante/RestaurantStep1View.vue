<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Users, Utensils, Clock, Check, AlertCircle } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseCalendar from '../../../components/ui/BaseCalendar.vue'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { useRequestsStore } from '../../../stores/requestsStore'
import { horasDeComida, validarHoraComida, validateGuestCapacity, getFullMeals, isRestaurantDayBlocked } from '../../../services/availability'
import { formatDateShort } from '../../../lib/dates'
import { ORDEN_COMIDAS } from '../../../services/menus'

const router = useRouter()
const store = useReservationStore()
const settingsStore = useSettingsStore()
const requestsStore = useRequestsStore()

store.setService('restaurant')

// El día se bloquea solo si las tres comidas están llenas para el grupo (SCRUM-244)
function isDayBlocked(dateStr: string): boolean {
  return isRestaurantDayBlocked(dateStr, store.guestsCount, requestsStore.requests, settingsStore.restaurantCapacity)
}

// Comidas sin cupo para el grupo en la fecha elegida: se deshabilitan una a una
const fullMeals = computed(() =>
  store.checkInDate
    ? getFullMeals(store.checkInDate, store.guestsCount, requestsStore.requests, settingsStore.restaurantCapacity)
    : []
)

const selectedFullMeals = computed(() => store.selectedMealTypes.filter(id => fullMeals.value.includes(id)))

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
  store.guestsCount = Math.min(settingsStore.restaurantCapacity, val)
}

// Validación estricta de aforo según reglas del negocio
const capacityValidation = computed(() => {
  return validateGuestCapacity(store.guestsCount, 1, settingsStore.restaurantCapacity)
})

const mealOptions = computed(() => {
  const sched = settingsStore.restaurantSchedules
  return [
    { id: 'desayuno', label: 'Desayuno', start: sched.desayuno.start, end: sched.desayuno.end },
    { id: 'almuerzo', label: 'Almuerzo', start: sched.almuerzo.start, end: sched.almuerzo.end },
    { id: 'once', label: 'Once', start: sched.once.start, end: sched.once.end }
  ].map(m => ({ ...m, rangeText: `${m.start} - ${m.end}` }))
})

// Las comidas elegidas siempre se muestran en el orden del día, sin importar cuál se tocó primero
const comidasEnOrden = computed(() => ORDEN_COMIDAS.filter(id => store.selectedMealTypes.includes(id)))

function rangoDe(mealId: string) {
  const opt = mealOptions.value.find(m => m.id === mealId)
  return { start: opt?.start ?? '', end: opt?.end ?? '' }
}

// La hora se elige de una lista con las medias horas del horario de cada comida (SCRUM-37).
// Si el administrador cambia el horario, la lista cambia sola.
function horasDe(mealId: string): string[] {
  return horasDeComida(rangoDe(mealId))
}

// Una hora guardada que ya no está en la lista (por ejemplo, el administrador cambió el horario) cuenta como no elegida
function horaElegida(mealId: string): string {
  const guardada = store.mealTimes[mealId] ?? ''
  return horasDe(mealId).includes(guardada) ? guardada : ''
}

for (const id of store.selectedMealTypes) {
  if (!horaElegida(id)) delete store.mealTimes[id]
}

function toggleMealType(id: string) {
  const idx = store.selectedMealTypes.indexOf(id)
  if (idx >= 0) {
    store.selectedMealTypes.splice(idx, 1)
    delete store.mealTimes[id]
  } else {
    store.selectedMealTypes.push(id)
  }
}

function elegirHora(mealId: string, hora: string) {
  if (!hora) return
  store.mealTimes[mealId] = hora
  store.restaurantTime = hora
}

const isValid = computed(() => {
  if (!store.checkInDate) return false
  if (!capacityValidation.value.isValid) return false
  if (store.selectedMealTypes.length === 0) return false
  if (selectedFullMeals.value.length > 0) return false
  for (const mId of store.selectedMealTypes) {
    if (!validarHoraComida(store.mealTimes[mId] ?? '', rangoDe(mId)).valida) return false
  }
  return true
})

function handleNext() {
  if (isValid.value) {
    store.nextStep()
    router.push('/restaurante/paso2')
  }
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-contenido-nav">
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="1" />
    </div>

    <BaseAlert variant="info" title="Reserva de Restaurante">
      Selecciona la fecha, el número de comensales y el servicio/horario de comida.
    </BaseAlert>

    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
      
      <div class="space-y-2">
        <label class="block text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Utensils class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Fecha de Visita
        </label>
        <BaseCalendar 
          :start-date="calendarDate"
          :end-date="calendarDate"
          single
          :is-date-disabled-fn="isDayBlocked"
          @change="handleCalendarChange"
        />
      </div>

      <div class="pt-3 border-t-2 border-gray-100 space-y-2">
        <label class="block text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
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
              inputmode="numeric"
              @input="handleGuestsInput"
              @blur="handleGuestsBlur"
              min="1"
              :max="settingsStore.restaurantCapacity"
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

      <div class="pt-3 border-t-2 border-gray-100 space-y-3">
        <label class="block text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Servicios de Comida Requeridos
        </label>

        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            v-for="meal in mealOptions"
            :key="meal.id"
            @click="toggleMealType(meal.id)"
            :disabled="fullMeals.includes(meal.id) && !store.selectedMealTypes.includes(meal.id)"
            :class="[
              'p-3 rounded-2xl border-2 transition-all touch-target flex flex-col items-center justify-center gap-1 text-center',
              fullMeals.includes(meal.id) && !store.selectedMealTypes.includes(meal.id)
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : store.selectedMealTypes.includes(meal.id)
                  ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                  : 'bg-brand-light text-brand-dark border-brand-border hover:bg-gray-200'
            ]"
          >
            <span class="text-sm font-black">{{ meal.label }}</span>
            <span v-if="fullMeals.includes(meal.id)" class="text-xs font-extrabold">Sin cupo</span>
            <span 
              v-if="store.selectedMealTypes.includes(meal.id)"
              class="w-4 h-4 bg-emerald-400 text-brand-dark rounded-full flex items-center justify-center text-sm font-black"
            >
              <Check class="w-3 h-3 stroke-[2.5]" />
            </span>
          </button>
        </div>

        <BaseAlert v-if="selectedFullMeals.length > 0" variant="warning" title="Sin cupo en una comida elegida">
          Para {{ store.guestsCount }} personas ya no queda cupo en: {{ selectedFullMeals.map(id => mealOptions.find(m => m.id === id)?.label).join(', ') }}. Quita esa comida, cambia la fecha o la cantidad de personas.
        </BaseAlert>

        <div 
          v-if="store.selectedMealTypes.length === 0" 
          class="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-sm font-bold text-amber-900 flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>Haz clic en Desayuno, Almuerzo o Once para seleccionar los horarios permitidos.</span>
        </div>
      </div>

      <div 
        v-for="mealId in comidasEnOrden" 
        :key="mealId"
        class="bg-brand-light p-4 rounded-2xl border-2 border-brand-border space-y-2.5"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-extrabold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
            <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Horario para {{ mealOptions.find(m => m.id === mealId)?.label }}
          </span>
          <span class="text-sm font-extrabold text-gray-500">
            ({{ mealOptions.find(m => m.id === mealId)?.rangeText }})
          </span>
        </div>

        <select
          :id="`hora-${mealId}`"
          :value="horaElegida(mealId)"
          :aria-label="`Hora para ${mealOptions.find(m => m.id === mealId)?.label}`"
          :class="[
            'w-full p-3 rounded-xl border-2 bg-white font-black text-lg text-center touch-target',
            horaElegida(mealId) ? 'border-brand-dark text-brand-dark' : 'border-brand-border text-gray-600'
          ]"
          @change="elegirHora(mealId, ($event.target as HTMLSelectElement).value)"
        >
          <option value="" disabled>Elige la hora</option>
          <option v-for="hora in horasDe(mealId)" :key="hora" :value="hora">{{ hora }} horas</option>
        </select>
      </div>

      <div class="bg-brand-light p-3.5 rounded-2xl border-2 border-brand-border flex items-center justify-between text-sm font-bold text-gray-700">
        <div>
          <span class="text-gray-400 text-sm uppercase font-extrabold block">Fecha</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(store.checkInDate) }}</span>
        </div>
        <div class="text-center border-x border-gray-200 px-3">
          <span class="text-gray-400 text-sm uppercase font-extrabold block">Comensales</span>
          <span class="text-brand-dark font-black">{{ store.guestsCount }} pers.</span>
        </div>
        <div class="text-right">
          <span class="text-gray-400 text-sm uppercase font-extrabold block">Servicios</span>
          <span class="text-brand-dark font-black">
            {{ store.selectedMealTypes.length > 0 ? store.selectedMealTypes.length + ' activo(s)' : 'Ninguno' }}
          </span>
        </div>
      </div>

    </div>

    <BarraAccionInferior :disabled="!isValid" @click="handleNext">Elegir Menú</BarraAccionInferior>
  </div>
</template>