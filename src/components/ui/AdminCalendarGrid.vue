<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useRequestsStore } from '../../stores/requestsStore'
import { getDayOccupancy } from '../../services/availability'

type BookingStatus = 'disponible' | 'ocupado' | 'sobrecupo'

const props = withDefaults(defineProps<{
  modelValue?: Date
}>(), {
  modelValue: () => new Date()
})

const emit = defineEmits<{
  (e: 'update:modelValue', date: Date): void
  (e: 'select-day', date: Date): void
}>()

const requestsStore = useRequestsStore()
const viewDate = ref<Date>(new Date(props.modelValue))

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    viewDate.value = new Date(newVal)
  }
})

const weekDayNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const currentMonthName = computed(() => {
  return viewDate.value.toLocaleDateString('es-CL', { month: 'long' })
})

const currentYear = computed(() => {
  return viewDate.value.getFullYear()
})

const blankDaysAtStart = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const firstDay = new Date(year, month, 1)
  const dayOfWeek = firstDay.getDay()
  return (dayOfWeek + 6) % 7
})

const monthDays = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = []
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(i).padStart(2, '0')
    const dateStr = `${yyyy}-${mm}-${dd}`

    const occupancy = getDayOccupancy(dateStr, requestsStore.requests)

    days.push({
      date: d,
      dateStr,
      dayNum: i,
      status: occupancy.status as BookingStatus
    })
  }
  return days
})

const prevMonth = () => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}

const nextMonth = () => {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}

const isToday = (date: Date) => {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

const isSameDay = (d1: Date, d2?: Date) => {
  if (!d2) return false
  return d1.toDateString() === d2.toDateString()
}

const handleDayClick = (date: Date) => {
  emit('update:modelValue', date)
  emit('select-day', date)
}

const getStatusBgClass = (status: BookingStatus) => {
  if (status === 'disponible') return 'bg-emerald-500'
  if (status === 'ocupado') return 'bg-red-500'
  return 'bg-amber-500'
}
</script>

<template>
  <div class="space-y-3 select-none">
    <div class="flex items-center justify-between px-1">
      <button 
        type="button" 
        @click="prevMonth"
        class="w-9 h-9 rounded-xl bg-brand-light border-2 border-brand-border text-brand-dark active:scale-95 transition-transform flex items-center justify-center shrink-0 touch-target"
        title="Mes anterior"
      >
        <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
      </button>

      <div class="text-center">
        <h3 class="text-sm font-black text-brand-dark capitalize leading-tight">
          {{ currentMonthName }}
        </h3>
        <p class="text-[10px] font-extrabold text-gray-500">
          {{ currentYear }}
        </p>
      </div>

      <button 
        type="button" 
        @click="nextMonth"
        class="w-9 h-9 rounded-xl bg-brand-light border-2 border-brand-border text-brand-dark active:scale-95 transition-transform flex items-center justify-center shrink-0 touch-target"
        title="Mes siguiente"
      >
        <ChevronRight class="w-5 h-5 stroke-[2.5]" />
      </button>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center border-b-2 border-brand-border/40 pb-1.5">
      <span 
        v-for="dayName in weekDayNames" 
        :key="dayName"
        class="text-[10px] font-black text-gray-400 uppercase tracking-wider"
      >
        {{ dayName }}
      </span>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center">
      <div 
        v-for="blank in blankDaysAtStart" 
        :key="'blank-' + blank" 
        class="h-11 rounded-2xl bg-transparent opacity-0 pointer-events-none"
      ></div>

      <button
        v-for="dayObj in monthDays"
        :key="dayObj.dateStr"
        type="button"
        @click="handleDayClick(dayObj.date)"
        :class="[
          'h-11 rounded-2xl border-2 flex flex-col items-center justify-between p-1 relative transition-all active:scale-95 touch-target overflow-hidden',
          isSameDay(dayObj.date, modelValue)
            ? 'bg-[#c5d7be] border-brand-border font-black text-brand-dark shadow-2xs'
            : isToday(dayObj.date)
              ? 'bg-emerald-50/90 border-brand-accent font-black text-brand-dark'
              : 'bg-white border-brand-border/40 hover:bg-brand-light text-gray-700 font-bold'
        ]"
      >
        <div class="flex items-center justify-center w-full h-full">
          <span 
            :class="[
              'text-xs leading-none',
              isToday(dayObj.date) && !isSameDay(dayObj.date, modelValue) ? 'text-brand-accent font-black' : ''
            ]"
          >
            {{ dayObj.dayNum }}
          </span>
        </div>

        <div class="w-full h-1 rounded-full overflow-hidden flex gap-0.5 mt-auto">
          <span 
            class="h-full flex-1 rounded-full"
            :class="getStatusBgClass(dayObj.status)"
          ></span>
        </div>
      </button>
    </div>
  </div>
</template>