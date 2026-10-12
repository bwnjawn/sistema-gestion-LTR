<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Calendar, 
  Receipt, 
  Send, 
  ArrowLeft, 
  FileText, 
  CheckCircle2, 
  FileCheck, 
  Utensils, 
  Tent, 
  RotateCcw,
  User,
  Phone,
  Clock
} from 'lucide-vue-next'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import DepositInfoCard from '../../../components/ui/DepositInfoCard.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useAdminStore } from '../../../stores/adminStore'

const router = useRouter()
const store = useReservationStore()
const adminStore = useAdminStore()

const isSubmitted = ref(false)
const reservationCode = ref('')

const nightsCount = computed(() => {
  if (!store.checkInDate || !store.checkOutDate) return 1
  const start = new Date(store.checkInDate)
  const end = new Date(store.checkOutDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
})

const selectedCabin = computed(() => {
  return adminStore.cabins.find(c => c.id === store.selectedCabinId) || adminStore.cabins[0]
})

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  if (!day || !month) return dateStr
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthIdx = parseInt(month, 10) - 1
  return `${parseInt(day, 10)} ${months[monthIdx] || ''}`
}

// Rango de horarios estandarizado: "15 oct (15:00 hrs) - 17 oct (11:00 hrs)"
const formattedScheduleRange = computed(() => {
  const inDate = formatDateShort(store.checkInDate)
  const outDate = formatDateShort(store.checkOutDate)
  const inTime = adminStore.cabinSchedules.checkIn
  const outTime = adminStore.cabinSchedules.checkOut
  return `${inDate} (${inTime} hrs) - ${outDate} (${outTime} hrs)`
})

const subtotal = computed(() => {
  return (selectedCabin.value?.pricePerNight || 0) * nightsCount.value
})

const ivaAmount = computed(() => Math.round(subtotal.value * 0.19))
const totalWithIva = computed(() => subtotal.value + ivaAmount.value)

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`
}

function handleSendRequest() {
  reservationCode.value = 'SOL-' + Math.floor(1000 + Math.random() * 9000)
  isSubmitted.value = true
}

function handleGoHome() {
  store.resetStore()
  router.push('/')
}

function handleGoToRestaurant() {
  store.selectedService = 'restaurant'
  router.push('/restaurante/paso1')
}

function handleGoToCamping() {
  store.selectedService = 'camping'
  router.push('/camping/paso1')
}
</script>

<template>
  <div class="space-y-4 pb-24">
    <div v-if="!isSubmitted" class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="4" />
    </div>

    <!-- PANTALLA A: REVISIÓN DE LA SOLICITUD -->
    <div v-if="!isSubmitted" class="space-y-4">
      <BaseAlert variant="info" title="Revisa tu solicitud antes de enviar">
        Verifica todos los parámetros antes de confirmar la reserva de cabaña.
      </BaseAlert>

      <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
        <!-- 1. Fechas y Horario Dinámico -->
        <div class="space-y-2">
          <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Fechas y Horarios
          </h3>

          <div class="bg-brand-light p-4 rounded-2xl border border-brand-border space-y-2 text-xs font-bold text-gray-700">
            <div class="flex justify-between">
              <span>Cabaña:</span>
              <span class="text-brand-dark font-black uppercase">{{ selectedCabin?.name }}</span>
            </div>
            <div class="flex justify-between items-start gap-2">
              <span class="shrink-0">Horario Permitido:</span>
              <span class="text-brand-dark font-black text-right flex items-center justify-end gap-1">
                <Clock class="w-3.5 h-3.5 text-brand-accent shrink-0 stroke-[2.5]" />
                {{ formattedScheduleRange }}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Duración:</span>
              <span class="text-brand-dark font-black">{{ nightsCount }} noche(s)</span>
            </div>
            <div class="flex justify-between">
              <span>Huéspedes:</span>
              <span class="text-brand-dark font-black">{{ store.guestsCount }} personas</span>
            </div>
          </div>
        </div>

        <!-- 2. Presupuesto + Componente DepositInfoCard -->
        <div class="space-y-3">
          <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <Receipt class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Presupuesto
          </h3>

          <div class="space-y-2 text-sm font-bold">
            <div class="flex justify-between">
              <span>Subtotal Neto:</span>
              <span class="text-brand-dark">{{ formatCLP(subtotal) }}</span>
            </div>
            <div class="flex justify-between text-gray-500">
              <span>IVA (19%):</span>
              <span>{{ formatCLP(ivaAmount) }}</span>
            </div>
            <div class="bg-brand-dark text-white p-3.5 rounded-2xl flex justify-between items-center text-lg font-black">
              <span>Total con IVA:</span>
              <span>{{ formatCLP(totalWithIva) }}</span>
            </div>
          </div>

          <!-- Componente Reutilizable de Abono (30% Configurable) -->
          <DepositInfoCard :total-with-iva="totalWithIva" service-name="cabana" />
        </div>

        <!-- 3. Contacto del Cliente -->
        <div class="space-y-3">
          <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Contacto del Cliente
          </h3>

          <div class="bg-brand-light p-3.5 rounded-2xl border border-brand-border space-y-2 text-xs font-bold text-gray-700">
            <div class="flex justify-between">
              <span>Cliente:</span>
              <span class="text-brand-dark font-black">{{ store.clientName || 'Sin registrar' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Teléfono:</span>
              <span class="text-brand-dark font-black flex items-center gap-1">
                <Phone class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
                {{ store.clientPhone || 'Sin registrar' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 4. Comentarios -->
        <div v-if="store.comments" class="space-y-2">
          <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
            <FileText class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Comentarios u Observaciones
          </h3>
          <p class="bg-brand-light p-3.5 rounded-2xl border border-brand-border text-xs font-bold text-gray-700 italic">
            "{{ store.comments }}"
          </p>
        </div>
      </div>

      <!-- Navegación Flotante -->
      <div class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-3.5 shadow-2xl">
        <div class="max-w-md mx-auto flex items-center gap-3">
          <BaseButton variant="outline" size="lg" @click="router.push('/cabana/paso3')">
            <ArrowLeft class="w-5 h-5 mr-1 stroke-[2.5]" />
            Volver
          </BaseButton>

          <BaseButton variant="success" size="lg" fullWidth @click="handleSendRequest">
            <Send class="w-5 h-5 mr-1.5 stroke-[2.5]" />
            Enviar Solicitud
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- PANTALLA B: CONFIRMACIÓN EXITOSA -->
    <div v-else class="bg-white p-6 sm:p-7 rounded-3xl border-2 border-brand-border shadow-md space-y-6 text-center">
      <div class="w-16 h-16 bg-emerald-100 text-status-success rounded-full flex items-center justify-center mx-auto shadow-xs">
        <CheckCircle2 class="w-10 h-10 stroke-[2.5]" />
      </div>

      <div class="space-y-2.5">
        <div class="inline-flex items-center gap-1.5 bg-brand-light border border-brand-border px-3.5 py-1 rounded-full text-xs font-black text-brand-dark shadow-2xs">
          <FileCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <span>Código: {{ reservationCode }}</span>
        </div>

        <h2 class="text-2xl font-black text-brand-dark tracking-tight">
          ¡Solicitud de Cabaña Registrada!
        </h2>

        <p class="text-xs sm:text-sm font-semibold text-gray-600 leading-relaxed max-w-xs mx-auto">
          Registramos tu solicitud para <strong class="text-brand-dark font-black">{{ selectedCabin?.name }}</strong> ({{ nightsCount }} noche/s). Te contactaremos al <strong class="text-brand-dark font-black">{{ store.clientPhone }}</strong>.
        </p>
      </div>

      <div class="bg-brand-light p-4 rounded-2xl border border-brand-border text-left space-y-2 text-xs font-bold text-gray-700">
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Servicio:</span>
          <span class="text-brand-dark font-black">{{ selectedCabin?.name }}</span>
        </div>
        <div class="flex justify-between items-start gap-2">
          <span class="text-gray-500 shrink-0">Horarios:</span>
          <span class="text-brand-dark font-black text-right">{{ formattedScheduleRange }}</span>
        </div>
        <div class="flex justify-between items-center border-t border-gray-200/60 pt-2 mt-1">
          <span class="text-gray-500">Total Estimado:</span>
          <span class="text-sm font-black text-brand-dark">{{ formatCLP(totalWithIva) }}</span>
        </div>
      </div>

      <!-- Venta Cruzada -->
      <div class="bg-amber-50/90 border-2 border-amber-200 p-4 rounded-2xl text-left space-y-3">
        <div class="flex items-center gap-2 text-amber-950 font-black text-sm">
          <Utensils class="w-5 h-5 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>¿Quieres agregar comida o espacio de camping?</span>
        </div>

        <p class="text-xs font-semibold text-amber-900 leading-relaxed">
          Puedes reservar menú de restaurante o sitio de camping para tu grupo.
        </p>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            @click="handleGoToRestaurant"
            class="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs touch-target active:scale-95 transition-transform"
          >
            <Utensils class="w-4 h-4 stroke-[2.5]" />
            <span>Restaurante</span>
          </button>

          <button
            type="button"
            @click="handleGoToCamping"
            class="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs touch-target active:scale-95 transition-transform"
          >
            <Tent class="w-4 h-4 stroke-[2.5]" />
            <span>Camping</span>
          </button>
        </div>
      </div>

      <div class="pt-1">
        <BaseButton variant="outline" size="lg" fullWidth @click="handleGoHome">
          <RotateCcw class="w-5 h-5 mr-1.5 stroke-[2.5]" />
          Volver al Inicio
        </BaseButton>
      </div>
    </div>
  </div>
</template>