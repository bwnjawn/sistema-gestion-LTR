<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, ArrowLeft, Users, Calendar as CalendarIcon, Moon } from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseCalendar from '../../../components/ui/BaseCalendar.vue'

const router = useRouter()
const store = useReservationStore()

const checkIn = ref<Date | null>(
  store.checkInDate ? new Date(store.checkInDate + 'T00:00:00') : new Date(2026, 9, 10)
)
const checkOut = ref<Date | null>(
  store.checkOutDate ? new Date(store.checkOutDate + 'T00:00:00') : new Date(2026, 9, 12)
)
const guests = ref<number>(store.guestsCount || 4)

function handleCalendarChange(payload: { start: Date | null; end: Date | null }) {
  checkIn.value = payload.start
  checkOut.value = payload.end
  if (payload.start) store.checkInDate = formatDateISO(payload.start)
  if (payload.end) store.checkOutDate = formatDateISO(payload.end)
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

const nightsCount = computed(() => {
  if (!checkIn.value || !checkOut.value) return 0
  const diffTime = checkOut.value.getTime() - checkIn.value.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24))
  return Math.max(0, diffDays)
})

function handleGuestsInput(e: Event) {
  const target = e.target as HTMLInputElement
  let val = parseInt(target.value) || 1
  if (val < 1) val = 1
  if (val > 20) val = 20
  guests.value = val
  store.guestsCount = val
}

function incrementGuests() {
  if (guests.value < 20) {
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

const isValid = computed(() => {
  return !!checkIn.value && !!checkOut.value && nightsCount.value >= 1
})

function handleNext() {
  if (!isValid.value || !checkIn.value || !checkOut.value) return
  
  store.checkInDate = formatDateISO(checkIn.value)
  store.checkOutDate = formatDateISO(checkOut.value)
  store.guestsCount = guests.value
  
  store.nextStep()
  router.push({ name: 'cabana-step2' })
}

function handleBack() {
  router.push('/')
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto pb-28">
    
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="1" />
    </div>

    <BaseAlert variant="info" title="Alojamiento en Cabaña">
      Selecciona las fechas de llegada y salida (mínimo 1 noche) y la cantidad de huéspedes.
    </BaseAlert>

    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
      
      <div class="space-y-2">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider">
          Selecciona Estadía (Llegada - Salida)
        </label>
        <BaseCalendar 
          :start-date="checkIn"
          :end-date="checkOut"
          @change="handleCalendarChange"
        />
      </div>

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
              :value="guests"
              @input="handleGuestsInput"
              min="1"
              max="20"
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

      <div class="bg-brand-light p-3.5 rounded-2xl border-2 border-brand-border flex items-center justify-between text-xs font-bold text-gray-700">
        <div>
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Llegada</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(checkIn) }}</span>
        </div>
        <div class="text-center border-x border-gray-200 px-3">
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Noches</span>
          <span class="text-brand-dark font-black flex items-center justify-center gap-1">
            <Moon class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            {{ nightsCount }} {{ nightsCount === 1 ? 'Noche' : 'Noches' }}
          </span>
        </div>
        <div class="text-right">
          <span class="text-gray-400 text-[10px] uppercase font-extrabold block">Salida</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(checkOut) }}</span>
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
          Ver Cabañas
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>

  </div>
</template>