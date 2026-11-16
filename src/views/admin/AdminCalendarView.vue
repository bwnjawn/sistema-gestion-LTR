<script setup lang="ts">
import { useBloqueoScroll } from '../../composables/useBloqueoScroll'
import { ref, computed } from 'vue'
import { 
  CalendarDays, ChevronLeft, ChevronRight, X, 
  Layers, Home, Tent, Utensils, Waves
} from 'lucide-vue-next'
import AdminCalendarGrid from '../../components/ui/AdminCalendarGrid.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { getDetalleDia, getRequestsForDay, getResumenDia, getWeekDates } from '../../services/availability'
import { useSettingsStore } from '../../stores/settingsStore'
import { useCatalogStore } from '../../stores/catalogStore'
import MarcasDia from '../../components/ui/MarcasDia.vue'
import DisponibilidadDelDia from '../../components/ui/DisponibilidadDelDia.vue'
import AdminRequestDetailModal from '../../components/admin/AdminRequestDetailModal.vue'
import { isoToDate } from '../../lib/dates'
import type { ReservationRequest, ServiceType } from '../../types/domain'

type ViewMode = 'mensual' | 'semanal' | 'diario'
const currentViewMode = ref<ViewMode>('mensual')

const viewModes: { id: ViewMode; label: string }[] = [
  { id: 'mensual', label: 'Mensual' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'diario', label: 'Diario' }
]

const requestsStore = useRequestsStore()
const settingsStore = useSettingsStore()
const catalogStore = useCatalogStore()

// Filtro por área: se ve un solo servicio a la vez, o "Todo" (panorama con el servicio más lleno de cada día)
type FiltroServicio = 'todo' | ServiceType
const TODOS_LOS_SERVICIOS: ServiceType[] = ['cabana', 'camping', 'restaurante', 'piscina']
const filtroActivo = ref<FiltroServicio>('todo')
const activeFilters = computed<ServiceType[]>(() =>
  filtroActivo.value === 'todo' ? [...TODOS_LOS_SERVICIOS] : [filtroActivo.value]
)

const filtrosDisponibles: { id: FiltroServicio; titulo: string; icono: typeof Layers }[] = [
  { id: 'cabana', titulo: 'Cabañas', icono: Home },
  { id: 'camping', titulo: 'Camping', icono: Tent },
  { id: 'restaurante', titulo: 'Restaurante', icono: Utensils },
  { id: 'piscina', titulo: 'Piscina', icono: Waves }
]

// Control de Fecha Activa y Modales
const selectedDate = ref<Date>(new Date())
const showDayDetail = ref(false)
const selectedRequestDetail = ref<ReservationRequest | null>(null)
// Detalle de la solicitud tocada en el calendario, con sus cruces (SCRUM-60)
const openedRequestId = ref<string | null>(null)

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
  const fechas = getWeekDates(selectedDateISO.value)
  if (fechas.length === 0) return ''
  const inicio = isoToDate(fechas[0]) as Date
  const fin = isoToDate(fechas[6]) as Date
  return `${inicio.getDate()} - ${fin.getDate()} ${fin.toLocaleDateString('es-CL', { month: 'short' })}`
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
// La regla de qué solicitudes ocupan un día vive en services/availability.ts.
const filteredRequestsForDay = computed(() =>
  getRequestsForDay(selectedDateISO.value, requestsStore.requests, activeFilters.value)
)

// Detalle de disponibilidad del día seleccionado, de los servicios del filtro (sin resumir)
const detalleDelDia = computed(() =>
  getDetalleDia(selectedDateISO.value, requestsStore.requests, activeFilters.value, {
    cabins: catalogStore.cabins,
    limites: settingsStore.limitesAforo
  })
)

const weekDays = computed(() =>
  getWeekDates(selectedDateISO.value).map(iso => {
    const d = isoToDate(iso) as Date
    const resumen = getResumenDia(iso, requestsStore.requests, activeFilters.value, {
      cabins: catalogStore.cabins,
      limites: settingsStore.limitesAforo
    })
    return {
      date: d,
      dateStr: iso,
      dayName: d.toLocaleDateString('es-CL', { weekday: 'narrow' }),
      dayNum: d.getDate(),
      resumen
    }
  })
)

function hasConflict(id: string): boolean {
  return (requestsStore.conflictsByRequestId[id]?.length ?? 0) > 0
}

useBloqueoScroll(computed(() => showDayDetail.value && currentViewMode.value !== 'diario'))
</script>

<template>
  <div class="space-y-4 pb-6">
    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-center gap-2 flex-wrap">
        <button
          type="button"
          @click="filtroActivo = 'todo'"
          :aria-pressed="filtroActivo === 'todo'"
          :class="[
            'px-3.5 py-2 rounded-2xl text-xs font-black border transition-all active:scale-95 flex items-center gap-1.5 touch-target shadow-2xs',
            filtroActivo === 'todo'
              ? 'bg-brand-dark text-white border-brand-dark'
              : 'bg-white text-gray-600 border-brand-border hover:bg-gray-50'
          ]"
        >
          <Layers class="w-4 h-4 stroke-[2.5]" />
          <span>Todo</span>
        </button>

        <button
          v-for="filtro in filtrosDisponibles"
          :key="filtro.id"
          type="button"
          @click="filtroActivo = filtro.id"
          :title="filtro.titulo"
          :aria-label="filtro.titulo"
          :aria-pressed="filtroActivo === filtro.id"
          :class="[
            'p-2.5 rounded-2xl border transition-all active:scale-95 flex items-center justify-center touch-target shadow-2xs',
            filtroActivo === filtro.id
              ? 'bg-[#c5d7be] text-brand-dark border-brand-border font-black'
              : 'bg-white text-gray-700 border-gray-400'
          ]"
        >
          <component :is="filtro.icono" class="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <div class="pt-2.5 border-t-2 border-brand-border/40">
        <div class="flex items-center justify-center gap-x-4 gap-y-1 flex-wrap text-xs font-black">
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-brand-dark"></span>
            <span class="text-gray-700">Confirmadas</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-md bg-rose-100 border-2 border-rose-300"></span>
            <span class="text-gray-700">Lleno</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-white border-2 border-amber-600"></span>
            <span class="text-gray-700">Por resolver</span>
          </div>
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
                : 'text-gray-700 hover:text-brand-dark'
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
            :services="activeFilters"
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
                'p-2 min-h-[4.5rem] rounded-2xl border-2 text-xs flex flex-col items-center gap-1 touch-target active:scale-95 transition-all overflow-hidden relative',
                isSelectedDay(day.date)
                  ? ['border-brand-border font-black text-brand-dark shadow-2xs', day.resumen.lleno ? 'bg-rose-200' : 'bg-[#c5d7be]']
                  : day.resumen.lleno
                    ? 'bg-rose-100 border-rose-300 text-rose-950'
                    : 'bg-brand-light border-brand-border/60 text-gray-600'
              ]"
            >
              <span class="text-xs uppercase font-bold text-gray-700">{{ day.dayName }}</span>
              <span class="font-black text-sm">{{ day.dayNum }}</span>
              <MarcasDia :resumen="day.resumen" />
            </button>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center justify-between bg-brand-light p-2 rounded-2xl border border-brand-border">
            <button aria-label="Día anterior" 
              type="button" 
              @click="changeDay(-1)" 
              class="w-10 h-10 rounded-xl bg-white border border-brand-border text-brand-dark active:scale-95 touch-target flex items-center justify-center shrink-0"
            >
              <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
            </button>

            <span class="text-xs font-black text-brand-dark capitalize text-center">
              {{ selectedDateFullFormatted }}
            </span>

            <button aria-label="Día siguiente" 
              type="button" 
              @click="changeDay(1)" 
              class="w-10 h-10 rounded-xl bg-white border border-brand-border text-brand-dark active:scale-95 touch-target flex items-center justify-center shrink-0"
            >
              <ChevronRight class="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <DisponibilidadDelDia
            :franjas="detalleDelDia"
            :reservas="filteredRequestsForDay"
            :fecha="selectedDateISO"
            :se-cruza="hasConflict"
            @abrir="openedRequestId = $event"
          />

        </div>
      </div>
    </div>

    <!-- Modal Detalle del Día -->
    <div 
      v-if="showDayDetail && currentViewMode !== 'diario'" 
      class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-2 sm:p-4"
    >
      <div class="bg-white w-full max-w-md rounded-3xl border-2 border-brand-border p-5 space-y-4 max-h-[85dvh] overflow-y-auto shadow-2xl">
        <div class="flex items-center justify-between border-b-2 border-brand-border/60 pb-3">
          <div>
            <span class="text-xs font-black text-brand-accent uppercase tracking-wider block">
              Resumen de Reservas
            </span>
            <h3 class="text-base font-black text-brand-dark capitalize leading-tight">
              {{ selectedDateFullFormatted }}
            </h3>
          </div>

          <button aria-label="Cerrar" 
            type="button" 
            @click="closeDayDetail"
            class="w-9 h-9 rounded-full bg-brand-light border-2 border-brand-border text-brand-dark hover:bg-gray-200 active:scale-95 transition-transform touch-target flex items-center justify-center shrink-0"
          >
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <DisponibilidadDelDia
          :franjas="detalleDelDia"
          :reservas="filteredRequestsForDay"
          :fecha="selectedDateISO"
          :se-cruza="hasConflict"
          @abrir="openedRequestId = $event"
        />

        <button
          type="button"
          @click="closeDayDetail"
          class="w-full py-3 bg-brand-dark hover:bg-emerald-900 text-white font-black text-xs rounded-2xl border-2 border-brand-border transition-colors touch-target active:scale-95 shadow-2xs"
        >
          Cerrar
        </button>
      </div>
    </div>

    <AdminRequestDetailModal :request-id="openedRequestId" @close="openedRequestId = null" @open-request="openedRequestId = $event" />
  </div>
</template>