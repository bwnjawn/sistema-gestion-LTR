<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  startDate?: Date | null
  endDate?: Date | null
  /** Indica si un día (o una noche, al elegir llegada) no se puede elegir. */
  isDateDisabledFn?: (dateStr: string) => boolean
  /**
   * Indica si la estadía [entrada, salida) no se puede reservar aunque cada día sea elegible por separado
   * (por ejemplo, una noche ocupada en medio). Se usa al elegir la fecha de salida.
   */
  isRangeBlockedFn?: (startStr: string, endStr: string) => boolean
  /** Marca suave (un punto) en un día que se puede elegir pero tiene algo que el usuario debería saber. */
  isDateMarkedFn?: (dateStr: string) => boolean
  /** Texto de la leyenda para los días marcados. */
  markedLabel?: string
  /** Solo se elige un día (visitas de un día): no hay llegada y salida. */
  single?: boolean
  /** Mes con el que se abre el calendario (por defecto, el de hoy). */
  initialDate?: Date | null
}

const props = withDefaults(defineProps<Props>(), {
  startDate: null,
  endDate: null,
  isDateDisabledFn: undefined,
  isRangeBlockedFn: undefined,
  isDateMarkedFn: undefined,
  markedLabel: 'Con otra solicitud pendiente',
  single: false,
  initialDate: null
})

const emit = defineEmits<{
  (e: 'update:startDate', value: Date | null): void
  (e: 'update:endDate', value: Date | null): void
  (e: 'change', payload: { start: Date | null; end: Date | null }): void
}>()

const today = new Date()

const mesInicial = props.initialDate ?? today
const currentYear = ref(mesInicial.getFullYear())
const currentMonth = ref(mesInicial.getMonth())

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const todayFormatted = computed(() => {
  const dayName = today.toLocaleDateString('es-CL', { weekday: 'short' })
  const monthName = today.toLocaleDateString('es-CL', { month: 'short' })
  const formattedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1)
  return `Hoy: ${formattedDay} ${today.getDate()} ${monthName}`
})

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOffset = computed(() => {
  const day = new Date(currentYear.value, currentMonth.value, 1).getDay()
  return day === 0 ? 6 : day - 1
})

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function goToToday() {
  const now = new Date()
  currentYear.value = now.getFullYear()
  currentMonth.value = now.getMonth()
}

function formatDateISO(dayNum: number): string {
  const y = currentYear.value
  const m = String(currentMonth.value + 1).padStart(2, '0')
  const d = String(dayNum).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toISO(fecha: Date): string {
  const m = String(fecha.getMonth() + 1).padStart(2, '0')
  const d = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${m}-${d}`
}

/** La llegada ya está elegida y falta la salida: los días posteriores se evalúan como salida. */
function esperandoSalida(): boolean {
  return !props.single && !!props.startDate && !props.endDate
}

function medianoche(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  return d
}

function isDisabled(dayNum: number): boolean {
  const iso = formatDateISO(dayNum)

  // Bloquear días pasados por defecto
  const cellDate = new Date(currentYear.value, currentMonth.value, dayNum)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (cellDate < now) return true

  const sirveDeLlegada = !(props.isDateDisabledFn && props.isDateDisabledFn(iso))

  // Con la llegada ya elegida, los días posteriores se evalúan como salida de la estadía: el día de salida
  // no es una noche, así que puede ser un día ocupado. Si no sirve de salida pero sí de llegada, se puede
  // tocar para empezar de nuevo desde ahí (así nunca queda la selección pegada).
  if (props.isRangeBlockedFn && esperandoSalida()) {
    const inicio = medianoche(props.startDate as Date)
    if (cellDate > inicio) return props.isRangeBlockedFn(toISO(inicio), iso) && !sirveDeLlegada
  }

  return !sirveDeLlegada
}

/** Un día posterior a la llegada sirve de salida si la estadía completa se puede reservar. */
function sirveDeSalida(iso: string): boolean {
  if (props.isRangeBlockedFn) return !props.isRangeBlockedFn(toISO(medianoche(props.startDate as Date)), iso)
  return !(props.isDateDisabledFn && props.isDateDisabledFn(iso))
}

function emitirCambio(start: Date | null, end: Date | null) {
  emit('update:startDate', start)
  emit('update:endDate', end)
  emit('change', { start, end })
}

function clearDates() {
  emitirCambio(null, null)
}

function handleDateClick(dayNum: number) {
  if (isDisabled(dayNum)) return

  const clickedDate = new Date(currentYear.value, currentMonth.value, dayNum)
  clickedDate.setHours(0, 0, 0, 0)
  const clicked = clickedDate.getTime()

  const start = props.startDate ? medianoche(props.startDate) : null
  const end = props.endDate && !props.single ? medianoche(props.endDate) : null

  if (start && clicked === start.getTime()) {
    // Tocar de nuevo la llegada borra las fechas
    emitirCambio(null, null)
  } else if (end && clicked === end.getTime()) {
    // Tocar la salida la quita y deja la llegada
    emitirCambio(start, null)
  } else if (props.single || !start || end || clickedDate < start) {
    emitirCambio(clickedDate, null)
  } else if (sirveDeSalida(formatDateISO(dayNum))) {
    emitirCambio(start, clickedDate)
  } else {
    // No sirve de salida pero sí de llegada: pasa a ser la nueva llegada
    emitirCambio(clickedDate, null)
  }
}

const ayuda = computed(() => {
  if (props.single) return props.startDate ? 'Toca el día elegido otra vez para quitarlo.' : 'Elige el día.'
  if (!props.startDate) return 'Elige el día de llegada.'
  if (!props.endDate) return 'Ahora elige el día de salida. Toca la llegada otra vez para borrar las fechas.'
  return 'Toca la llegada para borrar las fechas, o un día nuevo para empezar de nuevo.'
})

function isSelectedStart(dayNum: number) {
  if (!props.startDate) return false
  const d = new Date(currentYear.value, currentMonth.value, dayNum)
  return d.getTime() === new Date(props.startDate).setHours(0, 0, 0, 0)
}

function isSelectedEnd(dayNum: number) {
  if (!props.endDate) return false
  const d = new Date(currentYear.value, currentMonth.value, dayNum)
  return d.getTime() === new Date(props.endDate).setHours(0, 0, 0, 0)
}

function isInRange(dayNum: number) {
  if (!props.startDate || !props.endDate) return false
  const d = new Date(currentYear.value, currentMonth.value, dayNum)
  const start = new Date(props.startDate).setHours(0, 0, 0, 0)
  const end = new Date(props.endDate).setHours(0, 0, 0, 0)
  return d.getTime() > start && d.getTime() < end
}

function isToday(dayNum: number) {
  const d = new Date(currentYear.value, currentMonth.value, dayNum)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate()
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between bg-brand-light p-2.5 rounded-2xl border-2 border-brand-border">
      <button 
        type="button"
        @click="prevMonth"
        class="w-11 h-11 rounded-xl hover:bg-white text-brand-dark flex items-center justify-center touch-target active:scale-95 transition-transform"
        aria-label="Mes anterior"
      >
        <ChevronLeft class="w-6 h-6 stroke-[2.5]" />
      </button>

      <div class="text-center">
        <span class="text-lg font-extrabold text-brand-dark block leading-tight">
          {{ monthNames[currentMonth] }} {{ currentYear }}
        </span>
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">{{ todayFormatted }}</span>
      </div>

      <button 
        type="button"
        @click="nextMonth"
        class="w-11 h-11 rounded-xl hover:bg-white text-brand-dark flex items-center justify-center touch-target active:scale-95 transition-transform"
        aria-label="Mes siguiente"
      >
        <ChevronRight class="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>

    <div class="text-center">
      <button 
        type="button"
        @click="goToToday"
        class="px-5 py-2 bg-white border-2 border-brand-border text-brand-dark font-extrabold text-xs rounded-full hover:bg-brand-light active:scale-95 transition-transform shadow-xs"
      >
        Ir a hoy
      </button>
    </div>

    <div class="pt-1">
      <div class="grid grid-cols-7 text-center font-extrabold text-xs text-gray-500 mb-2 uppercase tracking-wider">
        <span v-for="d in dayNames" :key="d">{{ d }}</span>
      </div>

      <div class="grid grid-cols-7 gap-y-1.5 text-center font-extrabold text-base">
        <span v-for="blank in firstDayOffset" :key="'b-' + blank" class="h-12"></span>

        <button 
          type="button"
          v-for="day in daysInMonth" 
          :key="day"
          @click="handleDateClick(day)"
          :disabled="isDisabled(day)"
          :class="[
            'h-12 w-full relative flex items-center justify-center rounded-full transition-all touch-target focus:outline-none focus:ring-2 focus:ring-brand-accent',
            isDisabled(day)
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
              : isSelectedStart(day) || isSelectedEnd(day)
                ? 'bg-brand-dark text-white shadow-md z-10 font-black scale-105'
                : isInRange(day)
                  ? 'bg-emerald-100 text-brand-dark rounded-none font-black'
                  : isToday(day)
                    ? 'border-2 border-brand-dark bg-emerald-50 text-brand-dark font-black'
                    : 'hover:bg-brand-light text-brand-dark'
          ]"
        >
          {{ day }}
          <span
            v-if="isDateMarkedFn && !isDisabled(day) && isDateMarkedFn(formatDateISO(day))"
            class="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-amber-500"
            aria-hidden="true"
          ></span>
        </button>
      </div>
    </div>

    <div class="text-center space-y-2">
      <p class="text-sm font-bold text-gray-700">{{ ayuda }}</p>
      <button
        v-if="startDate"
        type="button"
        @click="clearDates"
        class="px-4 py-2 bg-white border-2 border-brand-border text-brand-dark font-extrabold text-sm rounded-full hover:bg-brand-light active:scale-95 transition-transform touch-target"
      >
        Borrar fechas
      </button>
    </div>

    <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs font-extrabold pt-3 border-t border-gray-200">
      <span class="flex items-center gap-1.5">
        <span class="w-3.5 h-3.5 bg-brand-dark rounded-full inline-block"></span> Elegido
      </span>
      <span class="flex items-center gap-1.5 text-gray-400">
        <span class="w-3.5 h-3.5 bg-gray-200 rounded-full inline-block"></span> Sin cupo
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-3.5 h-3.5 border-2 border-brand-dark rounded-full inline-block"></span> Hoy
      </span>
      <span v-if="isDateMarkedFn" class="flex items-center gap-1.5">
        <span class="w-2 h-2 bg-amber-500 rounded-full inline-block"></span> {{ markedLabel }}
      </span>
    </div>
  </div>
</template>