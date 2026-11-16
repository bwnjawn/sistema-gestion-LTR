<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useRequestsStore } from '../../stores/requestsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCatalogStore } from '../../stores/catalogStore'
import { getResumenDia } from '../../services/availability'
import MarcasDia from './MarcasDia.vue'
import type { ServiceType } from '../../types/domain'

const props = withDefaults(defineProps<{
  modelValue?: Date
  /** Servicios que se cuentan en la ocupación; todos si no se indica. */
  services?: ServiceType[]
}>(), {
  modelValue: () => new Date()
})

const emit = defineEmits<{
  (e: 'update:modelValue', date: Date): void
  (e: 'select-day', date: Date): void
}>()

const requestsStore = useRequestsStore()
const settingsStore = useSettingsStore()
const catalogStore = useCatalogStore()
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

    const resumen = getResumenDia(dateStr, requestsStore.requests, props.services, {
      cabins: catalogStore.cabins,
      limites: settingsStore.limitesAforo
    })

    days.push({
      date: d,
      dateStr,
      dayNum: i,
      resumen
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
        <p class="text-xs font-extrabold text-gray-700">
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
        class="text-xs font-black text-gray-700 uppercase tracking-wider"
      >
        {{ dayName }}
      </span>
    </div>

    <div class="grid grid-cols-7 gap-1 text-center">
      <div 
        v-for="blank in blankDaysAtStart" 
        :key="'blank-' + blank" 
        class="h-12 rounded-2xl bg-transparent opacity-0 pointer-events-none"
      ></div>

      <button
        v-for="dayObj in monthDays"
        :key="dayObj.dateStr"
        type="button"
        @click="handleDayClick(dayObj.date)"
        :class="[
          'h-12 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 p-1 relative transition-all active:scale-95 touch-target overflow-hidden',
          isSameDay(dayObj.date, modelValue)
            ? ['border-brand-border font-black text-brand-dark shadow-2xs', dayObj.resumen.lleno ? 'bg-rose-200' : 'bg-[#c5d7be]']
            : isToday(dayObj.date)
              ? ['border-brand-accent font-black text-brand-dark', dayObj.resumen.lleno ? 'bg-rose-100' : 'bg-emerald-50/90']
              : dayObj.resumen.lleno
                ? 'bg-rose-100 border-rose-300 text-rose-950 font-bold'
                : 'bg-white border-brand-border/40 hover:bg-brand-light text-gray-700 font-bold'
        ]"
      >
        <span
          :class="[
            'text-xs leading-none',
            isToday(dayObj.date) && !isSameDay(dayObj.date, modelValue) ? 'text-brand-accent font-black' : ''
          ]"
        >
          {{ dayObj.dayNum }}
        </span>
        <MarcasDia :resumen="dayObj.resumen" />
      </button>
    </div>
  </div>
</template>