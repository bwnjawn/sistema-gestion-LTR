<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  CalendarDays, ChevronLeft, ChevronRight, X, User, Phone, 
  Layers, Home, Tent, Utensils 
} from 'lucide-vue-next'
import AdminCalendarGrid from '../../components/ui/AdminCalendarGrid.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { formatCLP } from '../../lib/format'
import { getDayOccupancy } from '../../services/availability'
import type { ReservationRequest } from '../../types/domain'

type ViewMode = 'mensual' | 'semanal' | 'diario'
const currentViewMode = ref<ViewMode>('mensual')

const viewModes: { id: ViewMode; label: string }[] = [
  { id: 'mensual', label: 'Mensual' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'diario', label: 'Diario' }
]

const requestsStore = useRequestsStore()

// Filtros Activos por Área
const activeFilters = ref<string[]>(['cabana', 'camping', 'restaurante'])
const isAllSelected = computed(() => activeFilters.value.length === 3)

const selectAllFilters = () => {
  activeFilters.value = ['cabana', 'camping', 'restaurante']
}

const toggleFilter = (serviceKey: string) => {
  if (activeFilters.value.includes(serviceKey)) {
    if (activeFilters.value.length > 1) {
      activeFilters.value = activeFilters.value.filter(id => id !== serviceKey)
    }
  } else {
    activeFilters.value.push(serviceKey)
  }
}

// Control de Fecha Activa y Modales
const selectedDate = ref<Date>(new Date())
const showDayDetail = ref(false)
const selectedRequestDetail = ref<ReservationRequest | null>(null)

const selectedDateISO = computed(() => {
  const d = selectedDate.value
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
})

const selectedDateFullFormatted = computed(() => {
  return selectedDate.value.toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

const weekRangeFormatted = computed(() => {
  const start = new Date(selectedDate.value)
  start.setDate(start.getDate() - start.getDay() + 1)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${start.getDate()} - ${end.getDate()} ${end.toLocaleDateString('es-CL', { month: 'short' })}`
})

const goToday = () => {
  selectedDate.value = new Date()
  selectedRequestDetail.value = null
  if (currentViewMode.value !== 'diario') {
    showDayDetail.value = true
  }
}

const onDateSelect = (date: Date) => {
  selectedDate.value = date
  selectedRequestDetail.value = null
  showDayDetail.value = true
}

const closeDayDetail = () => {
  showDayDetail.value = false
  selectedRequestDetail.value = null
}

const changeDay = (offset: number) => {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() + offset)
  selectedDate.value = newDate
  selectedRequestDetail.value = null
}

const isSelectedDay = (date: Date) => {
  return date.toDateString() === selectedDate.value.toDateString()
}

// Solicitudes Reales Filtradas para el Día Seleccionado
const filteredRequestsForDay = computed(() => {
  const iso = selectedDateISO.value
  return requestsStore.requests.filter(req => {
    const rawType = req.type as string
    const normType = rawType === 'cabaña' ? 'cabana' : rawType
    if (!activeFilters.value.includes(normType)) return false

    const reqStart = req.details?.startDate || req.date
    const reqEnd = req.details?.endDate || req.timeOrDuration
    
    if (reqStart === iso) return true
    if (reqStart && reqEnd && iso >= reqStart && iso <= reqEnd) return true
    return false
  })
})

const weekDays = computed(() => {
  const days = []
  const start = new Date(selectedDate.value)
  start.setDate(start.getDate() - start.getDay() + 1)

  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const occ = getDayOccupancy(iso, requestsStore.requests)

    days.push({
      date: d,
      dateStr: iso,
      dayName: d.toLocaleDateString('es-CL', { weekday: 'narrow' }),
      dayNum: d.getDate(),
      status: occ.status
    })
  }
  return days
})

function getStatusBgClass(status: string) {
  if (status === 'disponible') return 'bg-emerald-500'
  if (status === 'ocupado') return 'bg-red-500'
  return 'bg-amber-500'
}

function formatStatusText(status: string): string {
  if (status === 'confirmed' || status === 'confirmada') return 'Confirmada'
  if (status === 'rejected' || status === 'rechazada') return 'Rechazada'
  return 'Pendiente'
}
</script>

<template>
  <div class="space-y-4 pb-6">
    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-center gap-2 flex-wrap">
        <button
          type="button"
          @click="selectAllFilters"
          :class="[
            'px-3.5 py-2 rounded-2xl text-xs font-black border transition-all active:scale-95 flex items-center gap-1.5 touch-target shadow-2xs',
            isAllSelected
              ? 'bg-brand-dark text-white border-brand-dark'
              : 'bg-white text-gray-600 border-brand-border hover:bg-gray-50'
          ]"
        >
          <Layers class="w-4 h-4 stroke-[2.5]" />
          <span>Todo</span>
        </button>

        <button
          type="button"
          @click="toggleFilter('cabana')"
          title="Cabañas"
          :class="[
            'p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center touch-target shadow-2xs',
            activeFilters.includes('cabana')
              ? 'bg-[#c5d7be] text-brand-dark border-brand-border font-black'
              : 'bg-white text-gray-400 border-gray-200'
          ]"
        >
          <Home class="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          @click="toggleFilter('camping')"
          title="Camping"
          :class="[
            'p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center touch-target shadow-2xs',
            activeFilters.includes('camping')
              ? 'bg-[#c5d7be] text-brand-dark border-brand-border font-black'
              : 'bg-white text-gray-400 border-gray-200'
          ]"
        >
          <Tent class="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          @click="toggleFilter('restaurante')"
          title="Restaurante"
          :class="[
            'p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center touch-target shadow-2xs',
            activeFilters.includes('restaurante')
              ? 'bg-[#c5d7be] text-brand-dark border-brand-border font-black'
              : 'bg-white text-gray-400 border-gray-200'
          ]"
        >
          <Utensils class="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <div class="pt-2.5 border-t-2 border-brand-border/40 flex items-center justify-center gap-6 text-[10px] font-black">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span class="text-gray-700">Disponible</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span class="text-gray-700">Ocupado</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span class="text-gray-700">Sobrecupo</span>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-3xl border-2 border-brand-border shadow-xs overflow-hidden">
      <div class="bg-brand-light border-b-2 border-brand-border p-1.5 flex items-center gap-1.5">
        <button
          type="button"
          @click="goToday"
          class="px-3 py-2 text-xs font-black rounded-xl bg-white text-brand-dark border border-brand-border hover:bg-[#c5d7be] active:scale-95 transition-all touch-target flex items-center gap-1 shrink-0 shadow-2xs"
          title="Ir a la fecha actual"
        >
          <CalendarDays class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <span>Hoy</span>
        </button>

        <div class="grid grid-cols-3 gap-1 bg-white p-1 rounded-2xl border border-brand-border w-full">
          <button
            v-for="mode in viewModes"
            :key="mode.id"
            type="button"
            @click="currentViewMode = mode.id"
            :class="[
              'py-2 text-xs font-black rounded-xl transition-all active:scale-95 touch-target flex items-center justify-center text-center',
              currentViewMode === mode.id
                ? 'bg-[#c5d7be] text-brand-dark shadow-2xs border border-brand-border'
                : 'text-gray-500 hover:text-brand-dark'
            ]"
          >
            {{ mode.label }}
          </button>
        </div>
      </div>

      <div class="p-4">
        <div v-if="currentViewMode === 'mensual'">
          <AdminCalendarGrid 
            v-model="selectedDate" 
            @select-day="onDateSelect"
          />
        </div>

        <div v-else-if="currentViewMode === 'semanal'" class="space-y-3">
          <div class="flex items-center justify-between text-xs font-black text-brand-dark px-1">
            <span>Semana actual</span>
            <span class="text-brand-accent capitalize">{{ weekRangeFormatted }}</span>
          </div>
          <div class="grid grid-cols-7 gap-1 text-center">
            <button
              v-for="day in weekDays"
              :key="day.dateStr"
              type="button"
              @click="onDateSelect(day.date)"
              :class="[
                'p-2 rounded-2xl border-2 text-xs flex flex-col items-center gap-1.5 touch-target active:scale-95 transition-all overflow-hidden',
                isSelectedDay(day.date)
                  ? 'bg-[#c5d7be] border-brand-border font-black text-brand-dark shadow-2xs'
                  : 'bg-brand-light border-brand-border/60 text-gray-600'
              ]"
            >
              <span class="text-[10px] uppercase font-bold text-gray-500">{{ day.dayName }}</span>
              <span class="font-black text-sm">{{ day.dayNum }}</span>
              <span 
                class="w-full h-1 rounded-full"
                :class="getStatusBgClass(day.status)"
              ></span>
            </button>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center justify-between bg-brand-light p-2 rounded-2xl border border-brand-border">
            <button 
              type="button" 
              @click="changeDay(-1)" 
              class="w-10 h-10 rounded-xl bg-white border border-brand-border text-brand-dark active:scale-95 touch-target flex items-center justify-center shrink-0"
            >
              <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
            </button>

            <span class="text-xs font-black text-brand-dark capitalize text-center">
              {{ selectedDateFullFormatted }}
            </span>

            <button 
              type="button" 
              @click="changeDay(1)" 
              class="w-10 h-10 rounded-xl bg-white border border-brand-border text-brand-dark active:scale-95 touch-target flex items-center justify-center shrink-0"
            >
              <ChevronRight class="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <div class="space-y-2">
            <div 
              v-for="req in filteredRequestsForDay" 
              :key="req.id"
              @click="selectedRequestDetail = req"
              class="p-3 bg-white rounded-2xl border-2 border-brand-border hover:border-brand-dark cursor-pointer text-xs font-bold space-y-1 shadow-2xs"
            >
              <div class="flex justify-between items-center">
                <span class="font-black text-brand-dark">{{ req.clientName }}</span>
                <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-light border border-brand-border">
                  {{ formatStatusText(req.status) }}
                </span>
              </div>
              <div class="flex justify-between text-gray-600 text-[11px]">
                <span>{{ req.resourceName }} ({{ req.guestsCount }} pers)</span>
                <span class="font-black text-brand-dark">{{ formatCLP(req.totalAmount) }}</span>
              </div>
            </div>

            <div v-if="filteredRequestsForDay.length === 0" class="text-center py-6 text-gray-500 text-xs font-bold bg-brand-light rounded-2xl border border-brand-border">
              No hay reservas registradas para este día.
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Detalle del Día -->
    <div 
      v-if="showDayDetail && currentViewMode !== 'diario'" 
      class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-2 sm:p-4"
    >
      <div class="bg-white w-full max-w-md rounded-3xl border-2 border-brand-border p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between border-b-2 border-brand-border/60 pb-3">
          <div>
            <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">
              Resumen de Reservas
            </span>
            <h3 class="text-base font-black text-brand-dark capitalize leading-tight">
              {{ selectedDateFullFormatted }}
            </h3>
          </div>

          <button 
            type="button" 
            @click="closeDayDetail"
            class="w-9 h-9 rounded-full bg-brand-light border-2 border-brand-border text-brand-dark hover:bg-gray-200 active:scale-95 transition-transform touch-target flex items-center justify-center shrink-0"
          >
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div class="space-y-2">
          <div 
            v-for="req in filteredRequestsForDay" 
            :key="req.id"
            class="p-3 bg-brand-light rounded-2xl border border-brand-border text-xs font-bold space-y-1.5"
          >
            <div class="flex justify-between items-start">
              <div>
                <span class="font-black text-brand-dark block text-sm">{{ req.clientName }}</span>
                <span class="text-[11px] text-gray-500 font-extrabold">{{ req.resourceName }} - {{ req.requestCode }}</span>
              </div>
              <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-brand-border">
                {{ formatStatusText(req.status) }}
              </span>
            </div>

            <div class="flex items-center gap-3 text-[11px] text-gray-600 border-t border-gray-200/60 pt-1.5">
              <span class="flex items-center gap-1"><User class="w-3.5 h-3.5 text-brand-accent" /> {{ req.guestsCount }} pers.</span>
              <span class="flex items-center gap-1"><Phone class="w-3.5 h-3.5 text-brand-accent" /> {{ req.clientPhone }}</span>
              <span class="font-black text-brand-dark ml-auto">{{ formatCLP(req.totalAmount) }}</span>
            </div>
          </div>

          <div v-if="filteredRequestsForDay.length === 0" class="text-center py-6 text-gray-500 text-xs font-bold">
            Sin reservas para este día.
          </div>
        </div>

        <button
          type="button"
          @click="closeDayDetail"
          class="w-full py-3 bg-brand-dark hover:bg-emerald-900 text-white font-black text-xs rounded-2xl border-2 border-brand-border transition-colors touch-target active:scale-95 shadow-2xs"
        >
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>