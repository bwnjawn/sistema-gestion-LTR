<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Tent, Sun, Moon, Users } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseCalendar from '../../../components/ui/BaseCalendar.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import { useReservationStore } from '../../../stores/reservationStore'

const router = useRouter()
const store = useReservationStore()

store.setService('camping')

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

function handleGuestsInput(event: Event) {
  const target = event.target as HTMLInputElement
  const val = parseInt(target.value, 10)
  if (isNaN(val) || val < 1) {
    store.guestsCount = 1
  } else {
    store.guestsCount = Math.min(150, val)
  }
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-').map(Number)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d} ${months[m - 1]}`
}

const isValid = computed(() => {
  if (!store.checkInDate) return false
  if (store.campingType === 'pernoctar' && !store.checkOutDate) return false
  return store.guestsCount > 0
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
    <!-- Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="1" />
    </div>

    <!-- Alerta Informativa -->
    <BaseAlert variant="info" title="Reserva de Camping">
      Selecciona la modalidad (Paseo por el día o Pernoctar con carpa), la fecha y la cantidad de visitantes.
    </BaseAlert>

    <!-- Formulario Principal -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
      
      <!-- Selección de Modalidad -->
      <div class="space-y-2">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
          <Tent class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Tipo de Visita
        </label>

        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            @click="setCampingType('diario')"
            :class="[
              'p-4 rounded-2xl border-2 text-left transition-all touch-target flex flex-col gap-1.5 relative',
              campingType === 'diario'
                ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                : 'bg-brand-light text-brand-dark border-brand-border hover:bg-gray-100'
            ]"
          >
            <Sun :class="['w-6 h-6 stroke-[2.5]', campingType === 'diario' ? 'text-amber-300' : 'text-brand-accent']" />
            <div>
              <span class="block text-sm font-black">Por el Día</span>
              <span class="block text-[10px] font-semibold opacity-80 leading-tight">Acceso a zonas comunes, piscinas y río</span>
            </div>
          </button>

          <button
            type="button"
            @click="setCampingType('pernoctar')"
            :class="[
              'p-4 rounded-2xl border-2 text-left transition-all touch-target flex flex-col gap-1.5 relative',
              campingType === 'pernoctar'
                ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                : 'bg-brand-light text-brand-dark border-brand-border hover:bg-gray-100'
            ]"
          >
            <Moon :class="['w-6 h-6 stroke-[2.5]', campingType === 'pernoctar' ? 'text-emerald-300' : 'text-brand-accent']" />
            <div>
              <span class="block text-sm font-black">Pernoctar</span>
              <span class="block text-[10px] font-semibold opacity-80 leading-tight">Acampe nocturno con carpa e instalaciones</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Calendario -->
      <div class="space-y-2 pt-2 border-t-2 border-gray-100">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider">
          {{ campingType === 'diario' ? 'Fecha de Visita' : 'Selecciona Estadía (Llegada - Salida)' }}
        </label>
        <BaseCalendar 
          :start-date="calendarStartDate"
          :end-date="calendarEndDate"
          @change="handleCalendarChange"
        />
      </div>

      <!-- Selector de Visitantes (+, - e input centrado) -->
      <div class="pt-3 border-t-2 border-gray-100 space-y-2">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
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
              @input="handleGuestsInput"
              min="1"
              max="150"
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
      </div>

      <!-- Resumen Fijo -->
      <div class="bg-brand-light p-3.5 rounded-2xl border-2 border-brand-border flex items-center justify-between text-xs font-bold text-gray-700">
        <div>
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Modalidad</span>
          <span class="text-brand-dark font-black capitalize">{{ campingType === 'diario' ? 'Día de campo' : 'Pernoctar' }}</span>
        </div>
        <div class="text-center border-x border-gray-200 px-3">
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Fecha</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(store.checkInDate) }}</span>
        </div>
        <div class="text-right">
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Visitantes</span>
          <span class="text-brand-dark font-black">{{ store.guestsCount }} pers.</span>
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
          :disabled="!isValid"
          @click="handleNext"
        >
          Elegir Espacio
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>