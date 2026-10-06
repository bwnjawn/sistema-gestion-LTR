<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  CheckCircle2, 
  Send, 
  Calendar, 
  Users, 
  Phone, 
  User, 
  BedDouble, 
  RotateCcw,
  Receipt,
  Utensils,
  Edit2,
  FileCheck,
  Tent
} from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'

const router = useRouter()
const store = useReservationStore()

const isSubmitted = ref(false)
const reservationCode = ref('')

const isDiario = computed(() => store.campingType === 'diario')

const campingCatalog: Record<string, { name: string; pricePerPerson: number }> = {
  'camping-diario-estandar': { name: 'Paseo por el Día - Entrada General', pricePerPerson: 5000 },
  'camping-diario-quincho': { name: 'Paseo por el Día + Quincho / Asador', pricePerPerson: 7000 },
  'camping-pernoctar-estandar': { name: 'Camping Noche - Sitio Estándar', pricePerPerson: 8000 },
  'camping-pernoctar-premium': { name: 'Camping Noche - Sitio Privado con Quincho', pricePerPerson: 10000 }
}

const selectedCampingInfo = computed(() => {
  const id = store.selectedCabinId || (isDiario.value ? 'camping-diario-estandar' : 'camping-pernoctar-estandar')
  return campingCatalog[id] || { name: 'Servicio de Camping', pricePerPerson: 5000 }
})

const nightsCount = computed(() => {
  if (isDiario.value) return 1
  if (!store.checkInDate || !store.checkOutDate) return 1
  const d1 = new Date(store.checkInDate + 'T00:00:00')
  const d2 = new Date(store.checkOutDate + 'T00:00:00')
  const diffTime = d2.getTime() - d1.getTime()
  return Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)))
})

const guests = computed(() => store.guestsCount || 1)

const subtotal = computed(() => {
  if (isDiario.value) {
    return selectedCampingInfo.value.pricePerPerson * guests.value
  }
  return selectedCampingInfo.value.pricePerPerson * guests.value * nightsCount.value
})

const ivaAmount = computed(() => Math.round(subtotal.value * 0.19))
const totalWithIva = computed(() => subtotal.value + ivaAmount.value)

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

function handleEditDates() {
  router.push({ name: 'camping-step1' })
}

function handleEditOption() {
  router.push({ name: 'camping-step2' })
}

function handleEditContact() {
  router.push({ name: 'camping-step3' })
}

function handleSendRequest() {
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  reservationCode.value = `SOL-${randomNum}`
  isSubmitted.value = true
}

function handleGoToCabana() {
  const savedGuests = store.guestsCount
  const savedDate = store.checkInDate
  const savedClientName = store.clientName
  const savedClientPhone = store.clientPhone

  store.resetStore()
  store.setService('cabana')

  if (savedGuests) store.guestsCount = savedGuests
  if (savedDate) store.checkInDate = savedDate
  if (savedClientName) store.clientName = savedClientName
  if (savedClientPhone) store.clientPhone = savedClientPhone

  router.push('/cabanas/paso-1').catch(() => {
    router.push({ name: 'cabana-step1' })
  })
}

function handleGoToRestaurant() {
  const savedGuests = store.guestsCount
  const savedDate = store.checkInDate
  const savedClientName = store.clientName
  const savedClientPhone = store.clientPhone

  store.resetStore()
  store.setService('restaurant')

  if (savedGuests) store.guestsCount = savedGuests
  if (savedDate) store.checkInDate = savedDate
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

function handleBack() {
  store.prevStep()
  router.push({ name: 'camping-step3' })
}
</script>

<template>
  <div :class="['space-y-5 max-w-md mx-auto', !isSubmitted ? 'pb-28' : 'pb-6']">
    
    <div v-if="!isSubmitted" class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="4" />
    </div>

    <div v-if="!isSubmitted" class="space-y-4">
      
      <BaseAlert variant="info" title="Revisa tu solicitud antes de enviar">
        Puedes modificar cualquier sección antes de confirmar la reserva de camping.
      </BaseAlert>

      <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
        
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              1. Fechas y Modalidad
            </h3>
            <button 
              type="button" 
              @click="handleEditDates"
              class="text-xs font-black text-brand-accent hover:underline flex items-center gap-1"
            >
              <Edit2 class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Editar</span>
            </button>
          </div>

          <div class="bg-brand-light p-4 rounded-2xl border border-brand-border space-y-2.5 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">Modalidad:</span>
              <span class="font-extrabold text-brand-dark uppercase text-xs bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {{ isDiario ? 'Paseo por el Día' : 'Pernoctar' }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">Fecha:</span>
              <span class="font-extrabold text-brand-dark flex items-center gap-1">
                <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                {{ formatDateShort(store.checkInDate) }} {{ !isDiario ? 'al ' + formatDateShort(store.checkOutDate) : '' }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">Visitantes:</span>
              <span class="font-extrabold text-brand-dark flex items-center gap-1">
                <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                {{ guests }} personas
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tent class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              2. Espacio Elegido
            </h3>
            <button 
              type="button" 
              @click="handleEditOption"
              class="text-xs font-black text-brand-accent hover:underline flex items-center gap-1"
            >
              <Edit2 class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Editar</span>
            </button>
          </div>

          <div class="bg-brand-light p-4 rounded-2xl border border-brand-border space-y-1.5 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-sm font-black text-brand-dark">{{ selectedCampingInfo.name }}</span>
              <span class="text-brand-dark font-black text-base">{{ formatCLP(selectedCampingInfo.pricePerPerson) }} / pers.</span>
            </div>
            <p class="font-semibold text-gray-500">
              Acceso a baños, duchas con agua caliente, piscina, zonas de descanso y entorno natural.
            </p>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              3. Desglose de Valores
            </h3>
            <span class="text-[11px] font-extrabold text-brand-accent bg-brand-light px-2.5 py-0.5 rounded-full border border-brand-border">
              Valores en CLP
            </span>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between items-center text-gray-700 font-extrabold">
              <span>Subtotal ({{ guests }} pers. {{ !isDiario ? 'x ' + nightsCount + ' noc.' : '' }}):</span>
              <span class="text-brand-dark text-base">{{ formatCLP(subtotal) }}</span>
            </div>

            <div class="flex justify-between items-center text-gray-600 font-bold">
              <span>IVA (19%):</span>
              <span class="text-gray-700 font-extrabold">{{ formatCLP(ivaAmount) }}</span>
            </div>

            <div class="bg-brand-dark text-white p-4 rounded-2xl flex justify-between items-center shadow-xs mt-2">
              <div>
                <span class="text-xs font-extrabold block text-emerald-300 uppercase tracking-wider">Total Estimado</span>
                <span class="text-[10px] text-gray-300 font-bold">IVA incluido</span>
              </div>
              <span class="text-2xl font-black text-white">{{ formatCLP(totalWithIva) }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              4. Contacto del Cliente
            </h3>
            <button 
              type="button" 
              @click="handleEditContact"
              class="text-xs font-black text-brand-accent hover:underline flex items-center gap-1"
            >
              <Edit2 class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Editar</span>
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

      </div>

    </div>

    <!-- BOTONES FIJOS EN LA PARTE INFERIOR -->
    <div v-if="!isSubmitted" class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-3.5 shadow-2xl">
      <div class="max-w-md mx-auto flex items-center gap-3">
        <BaseButton variant="outline" size="lg" @click="handleBack">
          <ArrowLeft class="w-5 h-5 mr-1 stroke-[2.5]" />
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

    <!-- PANTALLA DE CONFIRMACIÓN DE ENVÍO -->
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
          <span class="text-brand-dark font-black">{{ selectedCampingInfo.name }}</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Fecha:</span>
          <span class="text-brand-dark font-black">{{ formatDateShort(store.checkInDate) }}</span>
        </div>
        <div class="flex justify-between items-center border-t border-gray-200/60 pt-2 mt-1">
          <span class="text-gray-500">Total Estimado:</span>
          <span class="text-sm font-black text-brand-dark">{{ formatCLP(totalWithIva) }}</span>
        </div>
      </div>

      <div class="bg-amber-50/90 border-2 border-amber-200 p-4 rounded-2xl text-left space-y-3">
        <div class="flex items-center gap-2 text-amber-950 font-black text-sm">
          <Utensils class="w-5 h-5 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>¿Quieres agregar comida o alojar en cabaña?</span>
        </div>

        <p class="text-xs font-semibold text-amber-900 leading-relaxed">
          Puedes reservar menú de restaurante o una cabaña equipada para tu mismo grupo de <strong>{{ guests }} personas</strong>.
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