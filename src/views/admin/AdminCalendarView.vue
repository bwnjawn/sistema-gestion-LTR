<template>
  <div class="space-y-4 pb-6">
    <!-- 1. CAJA SUPERIOR: FILTROS POR ÁREA CON SÍMBOLOS Y LEYENDA -->
    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-center gap-2 flex-wrap">
        <!-- Todo (Ícono + Texto) -->
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

        <!-- Cabañas (Solo Ícono) -->
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

        <!-- Camping (Solo Ícono) -->
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

        <!-- Restaurante (Solo Ícono) -->
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

      <!-- Leyenda Semántica -->
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

    <!-- 2. CAJA PRINCIPAL DEL CALENDARIO -->
    <div class="bg-white rounded-3xl border-2 border-brand-border shadow-xs overflow-hidden">
      <!-- PESTAÑAS Y BOTÓN "HOY" -->
      <div class="bg-brand-light border-b-2 border-brand-border p-1.5 flex items-center gap-1.5">
        <!-- Botón Hoy -->
        <button
          type="button"
          @click="goToday"
          class="px-3 py-2 text-xs font-black rounded-xl bg-white text-brand-dark border border-brand-border hover:bg-[#c5d7be] active:scale-95 transition-all touch-target flex items-center gap-1 shrink-0 shadow-2xs"
          title="Ir a la fecha actual"
        >
          <CalendarDays class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <span>Hoy</span>
        </button>

        <!-- Modos Mensual, Semanal, Diario -->
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

      <!-- CUERPO SEGÚN VISTA -->
      <div class="p-4">
        <!-- VISTA MENSUAL -->
        <div v-if="currentViewMode === 'mensual'">
          <AdminCalendarGrid 
            v-model="selectedDate" 
            @select-day="onDateSelect"
          />
        </div>

        <!-- VISTA SEMANAL -->
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

        <!-- VISTA DIARIA (Directo en caja) -->
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between bg-brand-light p-2 rounded-2xl border border-brand-border">
            <button 
              type="button" 
              @click="changeDay(-1)" 
              class="w-10 h-10 rounded-xl bg-white border border-brand-border text-brand-dark active:scale-95 touch-target flex items-center justify-center shrink-0"
              title="Día anterior"
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
              title="Día siguiente"
            >
              <ChevronRight class="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <!-- Si no hay reserva seleccionada muestra el Nivel 1, si hay muestra el Nivel 2 -->
          <div v-if="!selectedBookingDetail">
            <DaySummaryList 
              :bookings="filteredBookingsForDay" 
              @select-booking="openBookingDetail" 
            />
          </div>
          <div v-else>
            <BookingDetailCard 
              :booking="selectedBookingDetail" 
              @go-back="selectedBookingDetail = null" 
            />
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL DE DETALLE DIARIO (Únicamente para Vista Mensual y Semanal) -->
    <div 
      v-if="showDayDetail && currentViewMode !== 'diario'" 
      class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-2 sm:p-4"
    >
      <div class="bg-white w-full max-w-md rounded-3xl border-2 border-brand-border p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl">
        <!-- Encabezado con navegación Nivel 1 vs Nivel 2 -->
        <div class="flex items-center justify-between border-b-2 border-brand-border/60 pb-3">
          <div class="flex items-center gap-2">
            <!-- Botón Volver al Nivel 1 si estamos en el Nivel 2 -->
            <button
              v-if="selectedBookingDetail"
              type="button"
              @click="selectedBookingDetail = null"
              class="w-8 h-8 rounded-xl bg-brand-light border border-brand-border text-brand-dark flex items-center justify-center shrink-0 active:scale-95"
              title="Volver a la lista"
            >
              <ChevronLeft class="w-4 h-4 stroke-[2.5]" />
            </button>

            <div>
              <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">
                {{ selectedBookingDetail ? 'Ficha de Reserva' : 'Resumen Diario' }}
              </span>
              <h3 class="text-base font-black text-brand-dark capitalize leading-tight">
                {{ selectedDateFullFormatted }}
              </h3>
            </div>
          </div>

          <button 
            type="button" 
            @click="closeDayDetail"
            class="w-9 h-9 rounded-full bg-brand-light border-2 border-brand-border text-brand-dark hover:bg-gray-200 active:scale-95 transition-transform touch-target flex items-center justify-center shrink-0"
            title="Cerrar detalle"
          >
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <!-- VISTA DE NIVEL 1: Lista de Reservas del Día -->
        <div v-if="!selectedBookingDetail">
          <DaySummaryList 
            :bookings="filteredBookingsForDay" 
            @select-booking="openBookingDetail" 
          />
        </div>

        <!-- VISTA DE NIVEL 2: Ficha Operativa Completa del Cliente -->
        <div v-else>
          <BookingDetailCard 
            :booking="selectedBookingDetail" 
            @go-back="selectedBookingDetail = null" 
          />
        </div>

        <!-- Botón Inferior para Cerrar -->
        <button
          type="button"
          @click="closeDayDetail"
          class="w-full py-3 bg-brand-dark hover:bg-emerald-900 text-white font-black text-xs rounded-2xl border-2 border-brand-border transition-colors touch-target active:scale-95 shadow-2xs"
        >
          Cerrar Ventana
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { 
  CalendarDays,
  ChevronLeft, 
  ChevronRight, 
  X, 
  User, 
  Clock, 
  CalendarX,
  Layers,
  Home,
  Tent,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Phone,
  MessageCircle,
  Mail,
  CalendarCheck,
  DollarSign,
  FileText
} from 'lucide-vue-next'
import AdminCalendarGrid from '../../components/ui/AdminCalendarGrid.vue'

type ViewMode = 'mensual' | 'semanal' | 'diario'
const currentViewMode = ref<ViewMode>('mensual')

const viewModes: { id: ViewMode; label: string }[] = [
  { id: 'mensual', label: 'Mensual' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'diario', label: 'Diario' }
]

type BookingStatus = 'disponible' | 'ocupado' | 'sobrecupo'

interface BookingItem {
  id: string
  type: 'cabana' | 'camping' | 'restaurante'
  resourceName: string
  clientName: string
  clientCategory: string
  pax: number
  phone: string
  rawPhone: string
  email: string
  checkInDate: string
  checkOutDate: string
  nightsOrBlock: string
  eventNote: string
  totalPrice: number
  depositPaid: number
  status: BookingStatus
}

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

// Control de Fecha Activa y Navegación de Nivel 1 / Nivel 2
const selectedDate = ref<Date>(new Date())
const showDayDetail = ref(false)
const selectedBookingDetail = ref<BookingItem | null>(null)

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
  selectedBookingDetail.value = null
  if (currentViewMode.value !== 'diario') {
    showDayDetail.value = true
  }
}

const onDateSelect = (date: Date) => {
  selectedDate.value = date
  selectedBookingDetail.value = null
  showDayDetail.value = true
}

const closeDayDetail = () => {
  showDayDetail.value = false
  selectedBookingDetail.value = null
}

const openBookingDetail = (booking: BookingItem) => {
  selectedBookingDetail.value = booking
}

const changeDay = (offset: number) => {
  const newDate = new Date(selectedDate.value)
  newDate.setDate(newDate.getDate() + offset)
  selectedDate.value = newDate
  selectedBookingDetail.value = null
}

const isSelectedDay = (date: Date) => {
  return date.toDateString() === selectedDate.value.toDateString()
}

const weekDays = computed(() => {
  const days = []
  const start = new Date(selectedDate.value)
  start.setDate(start.getDate() - start.getDay() + 1)

  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    days.push({
      date: d,
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('es-CL', { weekday: 'narrow' }),
      dayNum: d.getDate(),
      status: (i === 2 ? 'sobrecupo' : i % 2 === 0 ? 'ocupado' : 'disponible') as BookingStatus
    })
  }
  return days
})

// MOCK COMPLETO DE RESERVAS
const mockBookings: BookingItem[] = [
  {
    id: '1',
    type: 'cabana',
    resourceName: 'Cabaña 6',
    clientName: 'Juan Pérez',
    clientCategory: 'Particular',
    pax: 4,
    phone: '+56 9 8502 5056',
    rawPhone: '+56985025056',
    email: 'juan.perez@gmail.com',
    checkInDate: 'Vie 10 Oct - 15:00 hrs',
    checkOutDate: 'Dom 12 Oct - 12:00 hrs',
    nightsOrBlock: '2 Noches',
    eventNote: 'Viaje familiar con 2 niños pequeños.',
    totalPrice: 130000,
    depositPaid: 39000,
    status: 'ocupado'
  },
  {
    id: '2',
    type: 'camping',
    resourceName: 'Camping Sitio 3',
    clientName: 'María González',
    clientCategory: 'Institución',
    pax: 6,
    phone: '+56 9 9588 3385',
    rawPhone: '+56995883385',
    email: 'm.gonzalez@hotmail.com',
    checkInDate: 'Sáb 11 Oct - 10:00 hrs',
    checkOutDate: 'Dom 12 Oct - 18:00 hrs',
    nightsOrBlock: 'Pernoctar (1 Noche)',
    eventNote: 'Llevan 2 carpas grandes y parrilla propia.',
    totalPrice: 60000,
    depositPaid: 18000,
    status: 'disponible'
  },
  {
    id: '3',
    type: 'restaurante',
    resourceName: 'Restaurante (Almuerzo)',
    clientName: 'Delegación Escolar',
    clientCategory: 'Colegio',
    pax: 35,
    phone: '+56 9 1234 5678',
    rawPhone: '+56912345678',
    email: 'contacto@colegiosanjose.cl',
    checkInDate: 'Sáb 11 Oct - 13:00 hrs',
    checkOutDate: 'Sáb 11 Oct - 15:00 hrs',
    nightsOrBlock: 'Bloque Almuerzo',
    eventNote: 'Menú especial: 33 platos normales y 2 vegetarianos.',
    totalPrice: 350000,
    depositPaid: 105000,
    status: 'sobrecupo'
  }
]

const filteredBookingsForDay = computed(() => {
  return mockBookings.filter(b => activeFilters.value.includes(b.type))
})

// Subcomponente Nivel 1: Lista Resumida del Día
const DaySummaryList = (props: { bookings: BookingItem[] }, { emit }: any) => {
  if (props.bookings.length === 0) {
    return h('div', { class: 'text-center py-8 space-y-3' }, [
      h('div', { class: 'w-12 h-12 rounded-full bg-brand-light border-2 border-brand-border flex items-center justify-center mx-auto text-brand-dark' }, [
        h(CalendarX, { class: 'w-6 h-6 stroke-[2.5]' })
      ]),
      h('p', { class: 'text-xs font-black text-brand-dark' }, 'No existen registros cargados para las áreas seleccionadas en esta fecha.')
    ])
  }

  return h('div', { class: 'space-y-3' }, props.bookings.map(b => {
    const ServiceIcon = b.type === 'cabana' ? Home : b.type === 'camping' ? Tent : Utensils
    const StatusIcon = b.status === 'disponible' ? CheckCircle2 : b.status === 'ocupado' ? XCircle : AlertTriangle
    const statusBadgeClass = b.status === 'disponible' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : b.status === 'ocupado' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
    const statusText = b.status === 'disponible' ? 'Disponible' : b.status === 'ocupado' ? 'Ocupado' : 'Sobrecupo'

    return h('div', { 
      key: b.id, 
      onClick: () => emit('select-booking', b),
      class: 'p-3.5 rounded-2xl border-2 border-brand-border bg-brand-light space-y-2.5 cursor-pointer hover:bg-white active:scale-98 transition-all shadow-2xs touch-target' 
    }, [
      h('div', { class: 'flex items-center justify-between gap-2' }, [
        h('span', { class: 'text-xs font-black text-brand-dark flex items-center gap-1.5' }, [
          h(ServiceIcon, { class: 'w-4 h-4 text-brand-accent stroke-[2.5]' }),
          h('span', b.resourceName)
        ]),
        h('span', { class: `text-[10px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 uppercase ${statusBadgeClass}` }, [
          h(StatusIcon, { class: 'w-3 h-3 stroke-[2.5]' }),
          h('span', statusText)
        ])
      ]),
      h('div', { class: 'flex items-start justify-between gap-2 border-t border-brand-border/40 pt-2' }, [
        h('div', [
          h('p', { class: 'text-sm font-black text-brand-dark flex items-center gap-1.5' }, [
            h(User, { class: 'w-4 h-4 text-brand-accent stroke-[2.5]' }),
            h('span', b.clientName)
          ]),
          h('p', { class: 'text-xs font-bold text-gray-600 mt-0.5' }, `${b.pax} personas • ${b.phone}`)
        ]),
        h('div', { class: 'text-right shrink-0' }, [
          h('span', { class: 'text-xs font-bold text-gray-600 flex items-center justify-end gap-1' }, [
            h(Clock, { class: 'w-3.5 h-3.5 text-brand-accent stroke-[2.5]' }),
            h('span', b.nightsOrBlock)
          ]),
          h('span', { class: 'text-[11px] font-black text-brand-accent underline block mt-1' }, 'Ver ficha →')
        ])
      ])
    ])
  }))
}

// Subcomponente Nivel 2: Ficha Operativa Completa del Cliente
const BookingDetailCard = (props: { booking: BookingItem }) => {
  const b = props.booking
  const remainingBalance = b.totalPrice - b.depositPaid

  return h('div', { class: 'space-y-4 text-xs' }, [
    // Rango de Entrada y Salida
    h('div', { class: 'p-3.5 bg-brand-light rounded-2xl border-2 border-brand-border space-y-2' }, [
      h('div', { class: 'flex items-center gap-1.5 font-black text-brand-dark' }, [
        h(CalendarCheck, { class: 'w-4 h-4 text-brand-accent stroke-[2.5]' }),
        h('span', `Estancia (${b.nightsOrBlock})`)
      ]),
      h('div', { class: 'grid grid-cols-2 gap-2 pt-1 border-t border-brand-border/40 font-bold text-gray-700' }, [
        h('div', [
          h('span', { class: 'text-[10px] text-gray-400 block uppercase font-extrabold' }, 'Check-in (Entrada)'),
          h('span', { class: 'text-brand-dark font-black' }, b.checkInDate)
        ]),
        h('div', [
          h('span', { class: 'text-[10px] text-gray-400 block uppercase font-extrabold' }, 'Check-out (Salida)'),
          h('span', { class: 'text-brand-dark font-black' }, b.checkOutDate)
        ])
      ])
    ]),

    // Botones de Contacto Inmediato
    h('div', { class: 'space-y-1.5' }, [
      h('span', { class: 'text-[10px] font-black text-gray-400 uppercase tracking-wider block' }, 'Acciones de Contacto:'),
      h('div', { class: 'grid grid-cols-3 gap-2' }, [
        h('a', { 
          href: `tel:${b.rawPhone}`, 
          class: 'py-2.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl border border-brand-border flex items-center justify-center gap-1.5 active:scale-95 touch-target shadow-2xs' 
        }, [
          h(Phone, { class: 'w-4 h-4 stroke-[2.5]' }),
          h('span', 'Llamar')
        ]),
        h('a', { 
          href: `https://wa.me/${b.rawPhone.replace('+', '')}?text=${encodeURIComponent(`Hola \\({b.clientName}, te contactamos de Los Troncos de Repil respecto a tu reserva de \\){b.resourceName}.`)}`, 
          target: '_blank', 
          class: 'py-2.5 px-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl border border-brand-border flex items-center justify-center gap-1.5 active:scale-95 touch-target shadow-2xs' 
        }, [
          h(MessageCircle, { class: 'w-4 h-4 stroke-[2.5]' }),
          h('span', 'WhatsApp')
        ]),
        h('a', { 
          href: `mailto:${b.email}`, 
          class: 'py-2.5 px-2 bg-sky-600 hover:bg-sky-700 text-white font-black rounded-xl border border-brand-border flex items-center justify-center gap-1.5 active:scale-95 touch-target shadow-2xs' 
        }, [
          h(Mail, { class: 'w-4 h-4 stroke-[2.5]' }),
          h('span', 'Correo')
        ])
      ])
    ]),

    // Datos del Cliente y Notas del Evento
    h('div', { class: 'p-3.5 bg-white rounded-2xl border-2 border-brand-border space-y-2' }, [
      h('div', { class: 'flex items-center justify-between' }, [
        h('span', { class: 'font-black text-brand-dark text-sm' }, b.clientName),
        h('span', { class: 'text-[10px] font-black bg-brand-light px-2 py-0.5 rounded-full border border-brand-border text-brand-dark' }, b.clientCategory)
      ]),
      h('p', { class: 'text-gray-600 font-extrabold' }, `Capacidad contratada: ${b.pax} personas`),
      h('div', { class: 'p-2.5 bg-brand-light rounded-xl border border-brand-border text-gray-700 font-medium flex items-start gap-2' }, [
        h(FileText, { class: 'w-4 h-4 text-brand-accent shrink-0 stroke-[2.5] mt-0.5' }),
        h('span', b.eventNote)
      ])
    ]),

    // Desglose Financiero
    h('div', { class: 'p-3.5 bg-amber-50 rounded-2xl border-2 border-amber-300 space-y-2' }, [
      h('div', { class: 'flex items-center gap-1.5 font-black text-amber-900' }, [
        h(DollarSign, { class: 'w-4 h-4 text-amber-700 stroke-[2.5]' }),
        h('span', 'Estado de Pago en Caja')
      ]),
      h('div', { class: 'space-y-1 pt-1 border-t border-amber-200 text-amber-900 font-bold' }, [
        h('div', { class: 'flex justify-between' }, [
          h('span', 'Valor Total Reserva:'),
          h('span', { class: 'font-black' }, `$${b.totalPrice.toLocaleString('es-CL')}`)
        ]),
        h('div', { class: 'flex justify-between text-emerald-700' }, [
          h('span', 'Abono Pagado (30%):'),
          h('span', { class: 'font-black' }, `-$${b.depositPaid.toLocaleString('es-CL')}`)
        ]),
        h('div', { class: 'flex justify-between text-sm font-black text-red-700 pt-1 border-t border-amber-200' }, [
          h('span', 'Saldo Pendiente en Recepción:'),
          h('span', `$${remainingBalance.toLocaleString('es-CL')}`)
        ])
      ])
    ])
  ])
}

const getStatusBgClass = (status: BookingStatus) => {
  if (status === 'disponible') return 'bg-emerald-500'
  if (status === 'ocupado') return 'bg-red-500'
  return 'bg-amber-500'
}
</script>