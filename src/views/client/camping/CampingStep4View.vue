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
  BedDouble, 
  RotateCcw,
  User,
  Phone,
  Clock,
  Tent,
  Pencil
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

// Función utilitaria para formatear la fecha a texto corto (ej: 15 nov)
function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  if (!day || !month) return dateStr
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthIdx = parseInt(month, 10) - 1
  return `${parseInt(day, 10)} ${months[monthIdx] || ''}`
}

function navigateToStep(stepNumber: number) {
  router.push(`/camping/paso${stepNumber}`)
}

const isDiario = computed(() => store.campingType === 'diario')

const guests = computed(() => store.guestsCount || 1)

const nightsCount = computed(() => {
  if (isDiario.value || !store.checkInDate || !store.checkOutDate) return 1
  const start = new Date(store.checkInDate)
  const end = new Date(store.checkOutDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
})

// SOLUCIÓN TS2339: Retorna estrictamente un objeto único (nunca un array)
const selectedCampingOption = computed(() => {
  if (store.selectedCampingId) {
    const found = adminStore.campingSites.find(s => s.id === store.selectedCampingId)
    if (found) return found
  }
  return adminStore.campingSites[0] || {
    id: 'default',
    name: 'Camping General',
    description: 'Sitio de camping equipado',
    pricePerPerson: 10000
  }
})

const pricePerPerson = computed(() => selectedCampingOption.value.pricePerPerson || 10000)

const subtotal = computed(() => {
  return pricePerPerson.value * guests.value * (isDiario.value ? 1 : nightsCount.value)
})

const ivaAmount = computed(() => Math.round(subtotal.value * 0.19))
const totalWithIva = computed(() => subtotal.value + ivaAmount.value)

const formattedScheduleRange = computed(() => {
  if (isDiario.value) {
    return adminStore.campingSchedules.diario.display
  }
  return adminStore.campingSchedules.pernoctar.display
})

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
  store.prepareCrossServiceBooking('restaurante')
  router.push('/restaurante/paso1')
}

function handleGoToCabana() {
  store.prepareCrossServiceBooking('cabana')
  router.push('/cabana/paso1')
}
</script>

<template>
  <div class="space-y-4 pb-24">
    <div v-if="!isSubmitted" class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="4" />
    </div>

    <!-- PANTALLA A: REVISIÓN DE SOLICITUD -->
    <div v-if="!isSubmitted" class="space-y-4">
      <BaseAlert variant="info" title="Revisa tu solicitud antes de enviar">
        Verifica todos los parámetros antes de confirmar la reserva de camping.
      </BaseAlert>

      <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
        
        <!-- 1. Fechas y Horarios con Edición (Uso de formatDateShort) -->
        <div class="space-y-2">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Fechas y Horarios
            </h3>
            <button 
              type="button" 
              @click="navigateToStep(1)"
              class="text-xs font-black text-brand-accent hover:text-brand-dark flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-light hover:bg-gray-200 border border-brand-border transition-colors touch-target"
            >
              <Pencil class="w-3.5 h-3.5 stroke-[2.5]" />
              Editar
            </button>
          </div>

          <div class="bg-brand-light p-4 rounded-2xl border border-brand-border space-y-2 text-xs font-bold text-gray-700">
            <div class="flex justify-between">
              <span>Fecha Visita:</span>
              <span class="text-brand-dark font-black uppercase">
                {{ formatDateShort(store.checkInDate) }}
                <template v-if="!isDiario && store.checkOutDate">
                  a {{ formatDateShort(store.checkOutDate) }}
                </template>
              </span>
            </div>
            <div class="flex justify-between">
              <span>Modalidad:</span>
              <span class="text-brand-dark font-black uppercase">
                {{ isDiario ? 'Por el Día' : 'Pernoctar (' + nightsCount + ' noche/s)' }}
              </span>
            </div>
            <div class="flex justify-between items-start gap-2 border-t border-gray-200/60 pt-1">
              <span class="shrink-0">Horario Permitido:</span>
              <span class="text-brand-dark font-black text-right flex items-center justify-end gap-1">
                <Clock class="w-3.5 h-3.5 text-brand-accent shrink-0 stroke-[2.5]" />
                {{ formattedScheduleRange }}
              </span>
            </div>
            <div class="flex justify-between">
              <span>Visitantes:</span>
              <span class="text-brand-dark font-black">{{ guests }} personas</span>
            </div>
          </div>
        </div>

        <!-- 2. Opción de Camping Seleccionada -->
        <div class="space-y-2">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tent class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Espacio Asignado
            </h3>
            <button 
              type="button" 
              @click="navigateToStep(2)"
              class="text-xs font-black text-brand-accent hover:text-brand-dark flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-light hover:bg-gray-200 border border-brand-border transition-colors touch-target"
            >
              <Pencil class="w-3.5 h-3.5 stroke-[2.5]" />
              Editar
            </button>
          </div>

          <div class="bg-brand-light p-4 rounded-2xl border border-brand-border space-y-1 text-xs font-bold text-gray-700">
            <div class="flex justify-between items-center font-black text-brand-dark text-sm">
              <span>{{ selectedCampingOption.name }}</span>
              <span>{{ formatCLP(pricePerPerson) }} / pers</span>
            </div>
            <p class="text-[11px] text-gray-500 font-semibold">{{ selectedCampingOption.description }}</p>
          </div>
        </div>

        <!-- 3. Presupuesto -->
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

        <!-- 4. Contacto del Cliente -->
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Contacto del Cliente
            </h3>
            <button 
              type="button" 
              @click="navigateToStep(3)"
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

        <!-- 5. Comentarios -->
        <div v-if="store.comments" class="space-y-2">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Comentarios u Observaciones
            </h3>
            <button 
              type="button" 
              @click="navigateToStep(3)"
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

      <!-- Navegación Flotante -->
      <div class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-3.5 shadow-2xl">
        <div class="max-w-md mx-auto flex items-center gap-3">
          <BaseButton variant="outline" size="lg" @click="navigateToStep(3)">
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

    <!-- PANTALLA B: CONFIRMACIÓN EXITOSA CON VENTA CRUZADA -->
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
          ¡Solicitud de Camping Registrada!
        </h2>

        <p class="text-xs sm:text-sm font-semibold text-gray-600 leading-relaxed max-w-xs mx-auto">
          Registramos tu solicitud de Camping ({{ isDiario ? 'Por el Día' : 'Pernoctar' }}) para <strong class="text-brand-dark font-black">{{ guests }} personas</strong>. Te contactaremos al <strong class="text-brand-dark font-black">{{ store.clientPhone }}</strong>.
        </p>
      </div>

      <div class="bg-brand-light p-4 rounded-2xl border border-brand-border text-left space-y-2 text-xs font-bold text-gray-700">
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Servicio:</span>
          <span class="text-brand-dark font-black">{{ selectedCampingOption.name }}</span>
        </div>
        <div class="flex justify-between items-start gap-2">
          <span class="text-gray-500 shrink-0">Horario Asignado:</span>
          <span class="text-brand-dark font-black text-right">{{ formattedScheduleRange }}</span>
        </div>
        <div class="flex justify-between items-center border-t border-gray-200/60 pt-2 mt-1">
          <span class="text-gray-500">Total Estimado:</span>
          <span class="text-sm font-black text-brand-dark">{{ formatCLP(totalWithIva) }}</span>
        </div>
      </div>

      <!-- BANNER DE VENTA CRUZADA CON DATOS CONSERVADOS -->
      <div class="bg-amber-50/90 border-2 border-amber-200 p-4 rounded-2xl text-left space-y-3">
        <div class="flex items-center gap-2 text-amber-950 font-black text-sm">
          <Utensils class="w-5 h-5 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>¿Quieres agregar comida o alojar en cabaña?</span>
        </div>

        <p class="text-xs font-semibold text-amber-900 leading-relaxed">
          Conservamos tu grupo de <strong class="text-amber-950 font-black">{{ guests }} personas</strong> y tus fechas para que reserves tu menú o cabaña sin volver a escribir tus datos.
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
            <BedDouble class="w-4 h-4 stroke-[2.5]" />
            <span>Cabañas</span>
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