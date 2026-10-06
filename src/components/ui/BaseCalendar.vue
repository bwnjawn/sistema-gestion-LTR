<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

interface Props {
  startDate?: Date | null
  endDate?: Date | null
}

const props = withDefaults(defineProps<Props>(), {
  startDate: null,
  endDate: null
})

const emit = defineEmits<{
  (e: 'update:startDate', value: Date | null): void
  (e: 'update:endDate', value: Date | null): void
  (e: 'change', payload: { start: Date | null; end: Date | null }): void
}>()

// Año y Mes (Predeterminado Octubre 2026)
const currentYear = ref(2026)
const currentMonth = ref(9)

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

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
  currentYear.value = 2026
  currentMonth.value = 9
}

function handleDateClick(dayNum: number) {
  const clickedDate = new Date(currentYear.value, currentMonth.value, dayNum)
  clickedDate.setHours(0, 0, 0, 0)

  let newStart = props.startDate ? new Date(props.startDate) : null
  let newEnd = props.endDate ? new Date(props.endDate) : null

  if (!newStart || (newStart && newEnd)) {
    newStart = clickedDate
    newEnd = null
  } else if (newStart && !newEnd) {
    if (clickedDate < newStart) {
      // Inversión: Si la fecha seleccionada es anterior a la llegada, pasa a ser la nueva llegada
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
</script>

<template>
  <div class="space-y-4">
    <!-- Navegación de Mes -->
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
        <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Hoy: Lun 5 oct</span>
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

    <!-- Botón Hoy -->
    <div class="text-center">
      <button 
        type="button"
        @click="goToToday"
        class="px-5 py-2 bg-white border-2 border-brand-border text-brand-dark font-extrabold text-xs rounded-full hover:bg-brand-light active:scale-95 transition-transform shadow-xs"
      >
        Ir a hoy
      </button>
    </div>

    <!-- Grilla del Calendario Táctil e Inclusiva -->
    <div class="pt-1">
      <!-- Días de la Semana -->
      <div class="grid grid-cols-7 text-center font-extrabold text-xs text-gray-500 mb-2 uppercase tracking-wider">
        <span v-for="d in dayNames" :key="d">{{ d }}</span>
      </div>

      <!-- Celdas de los Días (Mínimo 48x48px para accesibilidad) -->
      <div class="grid grid-cols-7 gap-y-1.5 text-center font-extrabold text-base">
        <span v-for="blank in firstDayOffset" :key="'b-' + blank" class="h-12"></span>

        <button 
          type="button"
          v-for="day in daysInMonth" 
          :key="day"
          @click="handleDateClick(day)"
          :class="[
            'h-12 w-full flex items-center justify-center rounded-full transition-all touch-target focus:outline-none focus:ring-2 focus:ring-brand-accent',
            isSelectedStart(day) || isSelectedEnd(day)
              ? 'bg-brand-dark text-white shadow-md z-10 font-black scale-105'
              : isInRange(day)
                ? 'bg-emerald-100 text-brand-dark rounded-none font-black'
                : 'hover:bg-brand-light text-brand-dark'
          ]"
        >
          {{ day }}
        </button>
      </div>
    </div>

    <!-- Leyenda de Colores -->
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