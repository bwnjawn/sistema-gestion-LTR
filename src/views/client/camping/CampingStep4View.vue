<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, Calendar, Pencil, Clock, Receipt, User, Phone, 
  FileText, Send, CheckCircle2, FileCheck, Utensils, Home, RotateCcw 
} from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import DepositInfoCard from '../../../components/ui/DepositInfoCard.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useCatalogStore } from '../../../stores/catalogStore'
import { formatCLP } from '../../../lib/format'
import { useRequestsStore } from '../../../stores/requestsStore'

const router = useRouter()
const store = useReservationStore()
const catalogStore = useCatalogStore()

const isSubmitted = ref(false)
const reservationCode = ref('')

const selectedCampingSite = computed(() => {
  return catalogStore.campingSites.find(s => s.id === store.selectedCampingId)
})

const isDiario = computed(() => store.campingType === 'diario')

const nightsCount = computed(() => {
  if (isDiario.value || !store.checkInDate || !store.checkOutDate) return 1
  const diff = new Date(store.checkOutDate).getTime() - new Date(store.checkInDate).getTime()
  const days = Math.ceil(diff / (1000 * 3600 * 24))
  return days > 0 ? days : 1
})

const subtotal = computed(() => {
  const price = selectedCampingSite.value?.pricePerPerson || 10000
  return price * store.guestsCount * (isDiario.value ? 1 : nightsCount.value)
})

const ivaAmount = computed(() => {
  return Math.round(subtotal.value * 0.19)
})

const totalWithIva = computed(() => {
  return subtotal.value + ivaAmount.value
})

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-'
  const [y, m, d] = dateStr.split('-').map(Number)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d} ${months[m - 1]}`
}

const formattedScheduleDisplay = computed(() => {
  if (!store.checkInDate) return 'Sin fecha'
  if (isDiario.value) {
    return `${formatDateShort(store.checkInDate)} (Día de campo)`
  }
  return `${formatDateShort(store.checkInDate)} al ${formatDateShort(store.checkOutDate)} (${nightsCount.value} noc.)`
})

const requestsStore = useRequestsStore()

function handleSendRequest() {
  // 1. Guardar en el store de solicitudes
  requestsStore.addRequest({
    requestCode: reservationCode.value,
    clientName: store.clientName,
    clientPhone: store.clientPhone,
    clientEmail: store.clientEmail || undefined,
    type: 'camping',
    resourceName: store.campingType === 'pernoctar' ? 'Camping Pernoctar' : 'Camping Día',
    date: store.checkInDate,
    timeOrDuration: store.campingType === 'pernoctar' ? `${nightsCount.value} noche(s)` : 'Día completo',
    guestsCount: store.guestsCount,
    totalAmount: totalWithIva.value,
    depositAmount: Math.round(totalWithIva.value * 0.3),
    details: {
      comments: store.comments
    }
  })

  // 2. Mostrar pantalla de éxito
  isSubmitted.value = true
}

function handleGoToRestaurant() {
  store.prepareCrossServiceBooking('restaurant')
  router.push('/restaurante/paso1')
}

function handleGoToCabana() {
  store.prepareCrossServiceBooking('cabana')
  router.push('/cabana/paso1')
}

function handleGoHome() {
  store.resetStore()
  router.push('/')
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    
    <!-- PANTALLA A: REVISIÓN DE LA SOLICITUD -->
    <div v-if="!isSubmitted" class="space-y-4">
      <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
        <StepIndicator :current-step="4" />
      </div>

      <BaseAlert variant="info" title="Revisa tu solicitud antes de enviar">
        Verifica los parámetros de tu visita de camping antes de confirmar.
      </BaseAlert>

      <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
        
        <!-- 1. Fechas y Horarios con Botón Editar -->
        <div class="space-y-2">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Modalidad y Fechas
            </h3>
            <button 
              type="button" 
              @click="router.push('/camping/paso1')"
              class="text-xs font-black text-brand-accent hover:text-brand-dark flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-light hover:bg-gray-200 border border-brand-border transition-colors touch-target"
            >
              <Pencil class="w-3.5 h-3.5 stroke-[2.5]" />
              Editar
            </button>
          </div>

          <div class="bg-brand-light p-4 rounded-2xl border border-brand-border space-y-2 text-xs font-bold text-gray-700">
            <div class="flex justify-between">
              <span>Opción de Camping:</span>
              <span class="text-brand-dark font-black uppercase">{{ selectedCampingSite?.name }}</span>
            </div>
            <div class="flex justify-between items-start gap-2">
              <span class="shrink-0">Fechas / Modalidad:</span>
              <span class="text-brand-dark font-black text-right flex items-center justify-end gap-1">
                <Clock class="w-3.5 h-3.5 text-brand-accent shrink-0 stroke-[2.5]" />
                {{ formattedScheduleDisplay }}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Visitantes:</span>
              <span class="text-brand-dark font-black">{{ store.guestsCount }} personas</span>
            </div>
          </div>
        </div>

        <!-- 2. Presupuesto -->
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

          <DepositInfoCard :total-with-iva="totalWithIva" service-name="camping" />
        </div>

        <!-- 3. Contacto del Cliente con Botón Editar -->
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Contacto del Cliente
            </h3>
            <button 
              type="button" 
              @click="router.push('/camping/paso3')"
              class="text-xs font-black text-brand-accent hover:text-brand-dark flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-light hover:bg-gray-200 border border-brand-border transition-colors touch-target"
            >
              <Pencil class="w-3.5 h-3.5 stroke-[2.5]" />
              Editar
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
          </div>
        </div>

        <!-- 4. Comentarios con Botón Editar -->
        <div v-if="store.comments" class="space-y-2">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Comentarios u Observaciones
            </h3>
            <button 
              type="button" 
              @click="router.push('/camping/paso3')"
              class="text-xs font-black text-brand-accent hover:text-brand-dark flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-light hover:bg-gray-200 border border-brand-border transition-colors touch-target"
            >
              <Pencil class="w-3.5 h-3.5 stroke-[2.5]" />
              Editar
            </button>
          </div>
          <p class="bg-brand-light p-3.5 rounded-2xl border border-brand-border text-xs font-bold text-gray-700 italic">
            "{{ store.comments }}"
          </p>
        </div>
      </div>

      <!-- Navegación Flotante Fija -->
      <div class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-3.5 shadow-2xl">
        <div class="max-w-md mx-auto flex items-center gap-3">
          <BaseButton variant="outline" size="lg" @click="router.push('/camping/paso3')">
            <ArrowLeft class="w-5 h-5 mr-1 stroke-[2.5]" />
            Volver
          </BaseButton>

          <BaseButton variant="primary" size="lg" fullWidth @click="handleSendRequest">
            <Send class="w-5 h-5 mr-1.5 stroke-[2.5]" />
            Enviar Solicitud
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- PANTALLA B: CONFIRMACIÓN EXITOSA CON VENTA CRUZADA -->
    <div v-else class="bg-white p-6 sm:p-7 rounded-3xl border-2 border-brand-border shadow-md space-y-6 text-center">
      <div class="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs border-2 border-emerald-300">
        <CheckCircle2 class="w-10 h-10 stroke-[2.5]" />
      </div>

      <div class="space-y-2.5">
        <div class="inline-flex items-center gap-1.5 bg-brand-light border border-brand-border px-3.5 py-1 rounded-full text-xs font-black text-brand-dark shadow-2xs">
          <FileCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <span>Código: {{ reservationCode }}</span>
        </div>

        <h2 class="text-2xl font-black text-brand-dark tracking-tight">
          ¡Solicitud de Camping Registrada!
        </h2>

        <p class="text-xs sm:text-sm font-semibold text-gray-600 leading-relaxed max-w-xs mx-auto">
          Registramos tu solicitud para <strong class="text-brand-dark font-black">{{ selectedCampingSite?.name }}</strong> ({{ store.guestsCount }} pers.). Te contactaremos al <strong class="text-brand-dark font-black">{{ store.clientPhone }}</strong>.
        </p>
      </div>

      <div class="bg-brand-light p-4 rounded-2xl border border-brand-border text-left space-y-2 text-xs font-bold text-gray-700">
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Servicio:</span>
          <span class="text-brand-dark font-black">{{ selectedCampingSite?.name }}</span>
        </div>
        <div class="flex justify-between items-start gap-2">
          <span class="text-gray-500 shrink-0">Fechas y Horarios:</span>
          <span class="text-brand-dark font-black text-right">{{ formattedScheduleDisplay }}</span>
        </div>
        <div class="flex justify-between items-center border-t border-gray-200/60 pt-2 mt-1">
          <span class="text-gray-500">Total Estimado:</span>
          <span class="text-sm font-black text-brand-dark">{{ formatCLP(totalWithIva) }}</span>
        </div>
      </div>

      <!-- Venta Cruzada con Conservación de Datos -->
      <div class="bg-amber-50/90 border-2 border-amber-200 p-4 rounded-2xl text-left space-y-3">
        <div class="flex items-center gap-2 text-amber-950 font-black text-sm">
          <Utensils class="w-5 h-5 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>¿Quieres agregar comida o alojar en cabaña?</span>
        </div>

        <p class="text-xs font-semibold text-amber-900 leading-relaxed">
          Conservamos las fechas y tu grupo de <strong class="text-amber-950 font-black">{{ store.guestsCount }} personas</strong> para que selecciones tus servicios adicionales sin volver a llenar datos.
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
            @click="handleGoToCabana"
            class="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs touch-target active:scale-95 transition-transform"
          >
            <Home class="w-4 h-4 stroke-[2.5]" />
            <span>Cabaña</span>
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