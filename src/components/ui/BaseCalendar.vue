<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  startDate?: Date | null
  endDate?: Date | null
  isDateDisabledFn?: (dateStr: string) => boolean
}

const props = withDefaults(defineProps<Props>(), {
  startDate: null,
  endDate: null,
  isDateDisabledFn: undefined
})

const emit = defineEmits<{
  (e: 'update:startDate', value: Date | null): void
  (e: 'update:endDate', value: Date | null): void
  (e: 'change', payload: { start: Date | null; end: Date | null }): void
}>()

const today = new Date()

const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

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

function isDisabled(dayNum: number): boolean {
  const iso = formatDateISO(dayNum)
  
  // Bloquear días pasados por defecto
  const cellDate = new Date(currentYear.value, currentMonth.value, dayNum)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  if (cellDate < now) return true

  if (props.isDateDisabledFn) {
    return props.isDateDisabledFn(iso)
  }
  return false
}

function handleDateClick(dayNum: number) {
  if (isDisabled(dayNum)) return

  const clickedDate = new Date(currentYear.value, currentMonth.value, dayNum)
  clickedDate.setHours(0, 0, 0, 0)

  let newStart = props.startDate ? new Date(props.startDate) : null
  let newEnd = props.endDate ? new Date(props.endDate) : null

  if (!newStart || (newStart && newEnd)) {
    newStart = clickedDate
    newEnd = null
  } else if (newStart && !newEnd) {
    if (clickedDate < newStart) {
      newStart = clickedDate
      newEnd = null
    } else if (clickedDate.getTime() === newStart.getTime()) {
      newEnd = null
    } else {
      newEnd = clickedDate
    }
  }

  emit('update:startDate', newStart)
  emit('update:endDate', newEnd)
  emit('change', { start: newStart, end: newEnd })
}

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
            'h-12 w-full flex items-center justify-center rounded-full transition-all touch-target focus:outline-none focus:ring-2 focus:ring-brand-accent',
            isDisabled(day)
              ? 'bg-gray-100 text-gray-300 cursor-not-allowed line-through'
              : isSelectedStart(day) || isSelectedEnd(day)
                ? 'bg-brand-dark text-white shadow-md z-10 font-black scale-105'
                : isInRange(day)
                  ? 'bg-emerald-100 text-brand-dark rounded-none font-black'
                  : isToday(day)
                    ? 'border-2 border-brand-dark text-brand-dark font-black'
                    : 'hover:bg-brand-light text-brand-dark'
          ]"
        >
          {{ day }}
        </button>
      </div>
    </div>

    <div class="flex items-center justify-center gap-4 text-xs font-extrabold pt-3 border-t border-gray-200">
      <span class="flex items-center gap-1.5">
        <span class="w-3.5 h-3.5 bg-brand-dark rounded-full inline-block"></span> Elegido
      </span>
      <span class="flex items-center gap-1.5 text-gray-400">
        <span class="w-3.5 h-3.5 bg-gray-200 rounded-full inline-block"></span> Sin cupo
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-3.5 h-3.5 border-2 border-brand-dark rounded-full inline-block"></span> Hoy
      </span>
    </div>
  </div>
</template>