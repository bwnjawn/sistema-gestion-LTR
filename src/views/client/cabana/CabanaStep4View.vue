<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  CheckCircle2, 
  Send, 
  Building2, 
  Calendar, 
  Users, 
  Phone, 
  User, 
  Info, 
  Utensils, 
  RotateCcw,
  Receipt,
  BedDouble,
  FileCheck
} from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore.ts'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'

const router = useRouter()
const store = useReservationStore()

const isSubmitted = ref(false)
const reservationCode = ref('')

// Tarifas base de las cabañas
const cabinPrices: Record<string, { name: string; pricePerNight: number }> = {
  'cabana-6': { name: 'Cabaña 6', pricePerNight: 65000 },
  'cabana-8': { name: 'Cabaña 8', pricePerNight: 120000 }
}

const selectedCabin = computed(() => {
  const id = store.selectedCabinId || 'cabana-6'
  return cabinPrices[id] || cabinPrices['cabana-6']
})

// Cálculo dinámico de noches de estadía
const nightsCount = computed(() => {
  if (!store.checkInDate || !store.checkOutDate) return 1
  const start = new Date(store.checkInDate + 'T00:00:00')
  const end = new Date(store.checkOutDate + 'T00:00:00')
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
})

// Cálculos Monetarios
const pricePerNight = computed(() => selectedCabin.value.pricePerNight)
const subtotal = computed(() => pricePerNight.value * nightsCount.value)
const ivaAmount = computed(() => Math.round(subtotal.value * 0.19))
const totalWithIva = computed(() => subtotal.value + ivaAmount.value)
const deposit30 = computed(() => Math.round(totalWithIva.value * 0.3))
const remainingBalance = computed(() => totalWithIva.value - deposit30.value)

function formatCLP(val: number): string {
  return '\$' + val.toLocaleString('es-CL')
}

function formatDateShort(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

function handleSendRequest() {
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  reservationCode.value = `SOL-${randomNum}`
  isSubmitted.value = true
}

function handleGoToRestaurant() {
  const savedGuests = store.guestsCount
  const savedDate = store.checkInDate
  const savedClientName = store.clientName
  const savedClientPhone = store.clientPhone

  store.resetStore()
  store.setService('restaurant')
  
  if (savedGuests) store.guestsCount = savedGuests
  if (savedDate) {
    store.checkInDate = savedDate
    store.checkOutDate = savedDate
  }
  if (savedClientName) store.clientName = savedClientName
  if (savedClientPhone) store.clientPhone = savedClientPhone

  router.push('/restaurante/paso-1').catch(() => {
    router.push({ name: 'restaurant-step1' })
  })
}

function handleGoHome() {
  store.resetStore()
  router.push('/')
}

function handleEditContact() {
  router.push({ name: 'cabana-step3' })
}

function handleBack() {
  store.prevStep()
  router.push({ name: 'cabana-step3' })
}
</script>

<template>
  <div class="space-y-5 max-w-md mx-auto pb-6">
    
    <!-- Indicador de Pasos (Visible durante revisión) -->
    <div v-if="!isSubmitted" class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="4" />
    </div>

    <!-- PANTALLA A: REVISIÓN DE LA SOLICITUD -->
    <div v-if="!isSubmitted" class="space-y-4">
      
      <BaseAlert variant="info" title="Revisa tu solicitud antes de enviar">
        Comprueba que los datos estén correctos. Nos comunicaremos contigo por teléfono para confirmar la reserva.
      </BaseAlert>

      <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
        
        <!-- Detalle de la Reserva -->
        <div class="space-y-3">
          <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 flex items-center gap-1.5">
            <BedDouble class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Detalle de la Reserva
          </h3>

          <div class="bg-brand-light p-4 rounded-2xl border border-brand-border space-y-3 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">Alojamiento:</span>
              <span class="font-black text-brand-dark flex items-center gap-1.5">
                <Building2 class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                {{ selectedCabin.name }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">Fechas:</span>
              <span class="font-extrabold text-brand-dark flex items-center gap-1.5">
                <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                {{ formatDateShort(store.checkInDate) }} → {{ formatDateShort(store.checkOutDate) }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">Duración:</span>
              <span class="font-extrabold text-brand-dark">
                {{ nightsCount }} {{ nightsCount === 1 ? 'Noche' : 'Noches' }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">Integrantes:</span>
              <span class="font-extrabold text-brand-dark flex items-center gap-1.5">
                <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                {{ store.guestsCount }} {{ store.guestsCount === 1 ? 'Persona' : 'Personas' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Desglose del Presupuesto -->
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Desglose del Presupuesto
            </h3>
            <span class="text-[11px] font-extrabold text-brand-accent bg-brand-light px-2.5 py-0.5 rounded-full border border-brand-border">
              Valores en CLP
            </span>
          </div>

          <div class="space-y-2.5 text-sm">
            <div class="flex justify-between items-center text-gray-600 font-bold">
              <span>Tarifa por noche:</span>
              <span class="text-brand-dark font-extrabold">{{ formatCLP(pricePerNight) }}</span>
            </div>

            <div class="flex justify-between items-center text-gray-600 font-bold">
              <span>Cantidad de noches:</span>
              <span class="text-brand-dark font-extrabold">{{ nightsCount }} {{ nightsCount === 1 ? 'noche' : 'noches' }}</span>
            </div>

            <div class="flex justify-between items-center text-gray-700 font-extrabold pt-2 border-t border-gray-100">
              <span>Subtotal Neto:</span>
              <span class="text-brand-dark text-base">{{ formatCLP(subtotal) }}</span>
            </div>

            <div class="flex justify-between items-center text-gray-600 font-bold">
              <span>IVA (19%):</span>
              <span class="text-gray-700 font-extrabold">{{ formatCLP(ivaAmount) }}</span>
            </div>

            <!-- Total Destacado -->
            <div class="bg-brand-dark text-white p-4 rounded-2xl flex justify-between items-center shadow-xs">
              <div>
                <span class="text-xs font-extrabold block text-emerald-300 uppercase tracking-wider">Total Estimado</span>
                <span class="text-[10px] text-gray-300 font-bold">IVA incluido</span>
              </div>
              <span class="text-2xl font-black text-white">{{ formatCLP(totalWithIva) }}</span>
            </div>
          </div>

          <!-- Información de Abono -->
          <div class="bg-amber-50/90 border-2 border-amber-200 p-4 rounded-2xl space-y-2 text-amber-950">
            <div class="flex items-center gap-2 font-black text-sm">
              <Info class="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />
              <span>Forma de Pago y Confirmación</span>
            </div>
            
            <div class="space-y-1.5 text-xs font-bold text-amber-900 border-t border-amber-200/80 pt-2">
              <div class="flex justify-between items-center">
                <span>Abono requerido para reservar (30%):</span>
                <span class="text-sm font-black text-amber-950">{{ formatCLP(deposit30) }}</span>
              </div>
              <div class="flex justify-between items-center text-amber-800">
                <span>Saldo pendiente al llegar:</span>
                <span class="font-extrabold">{{ formatCLP(remainingBalance) }}</span>
              </div>
            </div>

            <p class="text-[11px] font-semibold text-amber-800 leading-relaxed pt-1">
              No se cobra en línea. El abono del 30% se coordina por llamada telefónica tras confirmar la disponibilidad.
            </p>
          </div>
        </div>

        <!-- Datos de Contacto -->
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Datos de Contacto
            </h3>
            <button 
              type="button" 
              @click="handleEditContact"
              class="text-xs font-black text-brand-accent hover:underline"
            >
              Cambiar
            </button>
          </div>

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
            <div class="flex justify-between">
              <span>Categoría:</span>
              <span class="text-brand-dark font-black">{{ store.eventReason || 'Particular' }}</span>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="pt-2 flex items-center gap-3">
          <BaseButton variant="outline" size="lg" @click="handleBack">
            <ArrowLeft class="w-5 h-5 mr-1.5 stroke-[2.5]" />
            Volver
          </BaseButton>

          <BaseButton 
            variant="success" 
            size="lg" 
            fullWidth 
            @click="handleSendRequest"
          >
            <Send class="w-5 h-5 mr-1.5 stroke-[2.5]" />
            Enviar Solicitud
          </BaseButton>
        </div>

      </div>

    </div>

    <!-- PANTALLA B: CONFIRMACIÓN DE ENVÍO EXITOSO (DISEÑO ARMONIZADO) -->
    <div v-else class="bg-white p-6 sm:p-7 rounded-3xl border-2 border-brand-border shadow-md space-y-6 text-center">
      
      <!-- Icono Principal de Éxito -->
      <div class="w-18 h-18  text-status-success rounded-full flex items-center justify-center mx-auto shadow-xs">
        <CheckCircle2 class="w-12 h-12 stroke-[2.5]" />
      </div>

      <!-- Encabezado y Código de Solicitud -->
      <div class="space-y-2.5">
        <div class="inline-flex items-center gap-1.5 bg-brand-light border border-brand-border px-3.5 py-1 rounded-full text-xs font-black text-brand-dark shadow-2xs">
          <FileCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <span>Código: {{ reservationCode }}</span>
        </div>

        <h2 class="text-2xl font-black text-brand-dark tracking-tight">
          ¡Solicitud Recibida!
        </h2>

        <p class="text-xs sm:text-sm font-semibold text-gray-600 leading-relaxed max-w-xs mx-auto">
          Hemos registrado tu solicitud para la <strong class="text-brand-dark font-black">{{ selectedCabin.name }}</strong>. Nos comunicaremos al número <strong class="text-brand-dark font-black">{{ store.clientPhone }}</strong> a la brevedad para confirmar los detalles.
        </p>
      </div>

      <!-- Resumen Compacto de la Solicitud -->
      <div class="bg-brand-light p-4 rounded-2xl border border-brand-border text-left space-y-2 text-xs font-bold text-gray-700">
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Alojamiento:</span>
          <span class="text-brand-dark font-black">{{ selectedCabin.name }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Fechas:</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(store.checkInDate) }} → {{ formatDateShort(store.checkOutDate) }}</span>
        </div>
        <div class="flex justify-between items-center border-t border-gray-200/60 pt-2 mt-1">
          <span class="text-gray-500">Total Estimado:</span>
          <span class="text-sm font-black text-brand-dark">{{ formatCLP(totalWithIva) }}</span>
        </div>
      </div>

      <!-- Módulo de Venta Cruzada (Restaurante) -->
      <div class="bg-amber-50/90 border-2 border-amber-200 p-4 rounded-2xl text-left space-y-3">
        <div class="flex items-center gap-2 text-amber-950 font-black text-sm">
          <Utensils class="w-5 h-5 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>¿Deseas agregar comida en el Restaurante?</span>
        </div>

        <p class="text-xs font-semibold text-amber-900 leading-relaxed">
          Puedes asegurar con anticipación desayunos campesinos, almuerzo tradicional u once para tu grupo de <strong>{{ store.guestsCount }} personas</strong>.
        </p>

        <button
          type="button"
          @click="handleGoToRestaurant"
          class="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-xs touch-target active:scale-95 transition-transform"
        >
          <Utensils class="w-4 h-4 stroke-[2.5]" />
          <span>Reservar Menú de Restaurante</span>
        </button>
      </div>

      <!-- Botón de Retorno -->
      <div class="pt-1">
        <BaseButton variant="outline" size="lg" fullWidth @click="handleGoHome">
          <RotateCcw class="w-5 h-5 mr-1.5 stroke-[2.5]" />
          Volver al Inicio
        </BaseButton>
      </div>

    </div>

  </div>
</template>