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

const fullMenuCatalog: Record<string, { name: string; price: number; mealType: string }> = {
  'desayuno-campesino': { name: 'Desayuno Campesino', price: 8000, mealType: 'Desayuno' },
  'desayuno-tradicional': { name: 'Desayuno Tradicional', price: 6000, mealType: 'Desayuno' },
  'almuerzo-cordero-cerdo': { name: 'Cordero y cerdo', price: 20000, mealType: 'Almuerzo' },
  'almuerzo-vacuno-bechamel': { name: 'Vacuno con bechamel', price: 21000, mealType: 'Almuerzo' },
  'almuerzo-salmon-camarones': { name: 'Salmón con salsa de camarones', price: 21000, mealType: 'Almuerzo' },
  'almuerzo-chuletas-cerdo': { name: 'Chuletas de cerdo', price: 13000, mealType: 'Almuerzo' },
  'once-campesina': { name: 'Once Campesina', price: 10000, mealType: 'Once' },
  'once-tradicional': { name: 'Once Tradicional', price: 7000, mealType: 'Once' }
}

const selectedItemList = computed(() => {
  const list: { id: string; name: string; mealType: string; count: number; unitPrice: number; totalPrice: number; sides: string }[] = []
  const menus = store.selectedMenus || {}
  
  Object.entries(menus).forEach(([id, data]) => {
    if (data && data.count > 0) {
      const itemInfo = fullMenuCatalog[id]
      if (itemInfo) {
        const sidesText = Object.entries(data.sides || {})
          .filter(([_, qty]) => qty > 0)
          .map(([sideName, qty]) => `${qty} ${sideName}`)
          .join(', ')
        
        list.push({
          id,
          name: itemInfo.name,
          mealType: itemInfo.mealType,
          count: data.count,
          unitPrice: itemInfo.price,
          totalPrice: itemInfo.price * data.count,
          sides: sidesText || 'Sin acompañamientos'
        })
      }
    }
  })
  
  return list
})

const subtotal = computed(() => {
  return selectedItemList.value.reduce((sum, item) => sum + item.totalPrice, 0)
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

function handleEditDateTime() {
  router.push({ name: 'restaurant-step1' })
}

function handleEditMenus() {
  router.push({ name: 'restaurant-step2' })
}

function handleEditContact() {
  router.push({ name: 'restaurant-step3' })
}

function handleSendRequest() {
  const randomNum = Math.floor(1000 + Math.random() * 9000)
  reservationCode.value = `SOL-${randomNum}`
  isSubmitted.value = true
}

function handleGoToCabana() {
  store.resetStore()
  store.setService('cabana')
  router.push({ name: 'cabana-step1' })
}

function handleGoToCamping() {
  store.resetStore()
  store.setService('camping')
  router.push({ name: 'camping-step1' })
}

function handleGoHome() {
  store.resetStore()
  router.push('/')
}

function handleBack() {
  store.prevStep()
  router.push({ name: 'restaurant-step3' })
}
</script>

<template>
  <div :class="['space-y-5 max-w-md mx-auto', !isSubmitted ? 'pb-28' : 'pb-6']">
    
    <div v-if="!isSubmitted" class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="4" />
    </div>

    <div v-if="!isSubmitted" class="space-y-4">
      
      <BaseAlert variant="info" title="Revisa tu solicitud antes de enviar">
        Puedes modificar cualquier sección antes de confirmar tu reserva.
      </BaseAlert>

      <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
        
        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              1. Fecha y Horario
            </h3>
            <button 
              type="button" 
              @click="handleEditDateTime"
              class="text-xs font-black text-brand-accent hover:underline flex items-center gap-1"
            >
              <Edit2 class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Editar</span>
            </button>
          </div>

          <div class="bg-brand-light p-4 rounded-2xl border border-brand-border space-y-2.5 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">Fecha:</span>
              <span class="font-extrabold text-brand-dark flex items-center gap-1">
                <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                {{ formatDateShort(store.checkInDate) }}
              </span>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">Comensales:</span>
              <span class="font-extrabold text-brand-dark flex items-center gap-1">
                <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                {{ store.guestsCount }} {{ store.guestsCount === 1 ? 'Persona' : 'Personas' }}
              </span>
            </div>

            <div class="border-t border-gray-200/80 pt-2 space-y-1">
              <span class="text-[11px] font-extrabold text-gray-500 uppercase block">Horarios solicitados:</span>
              <div 
                v-for="(time, mealKey) in store.mealTimes" 
                :key="mealKey" 
                class="flex justify-between items-center text-xs font-bold text-brand-dark"
              >
                <span class="capitalize">{{ mealKey }}:</span>
                <span>{{ time || 'Sin hora' }} hrs</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Utensils class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              2. Platos y Acompañamientos
            </h3>
            <button 
              type="button" 
              @click="handleEditMenus"
              class="text-xs font-black text-brand-accent hover:underline flex items-center gap-1"
            >
              <Edit2 class="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Editar</span>
            </button>
          </div>

          <div v-if="selectedItemList.length > 0" class="space-y-2.5">
            <div 
              v-for="item in selectedItemList" 
              :key="item.id"
              class="bg-brand-light p-3.5 rounded-2xl border border-brand-border space-y-1 text-xs"
            >
              <div class="flex justify-between items-start font-black text-brand-dark text-sm">
                <div>
                  <span class="text-[10px] font-extrabold uppercase text-brand-accent block">{{ item.mealType }}</span>
                  <span>{{ item.name }} (x{{ item.count }})</span>
                </div>
                <span class="text-brand-dark font-black text-base">{{ formatCLP(item.totalPrice) }}</span>
              </div>
              <p class="font-semibold text-gray-600 pt-0.5">
                <strong class="text-gray-700">Acompañamientos:</strong> {{ item.sides }}
              </p>
            </div>
          </div>
          <div v-else class="text-xs font-bold text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
            No se han seleccionado platos aún.
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
              <span>Subtotal Neto:</span>
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
          ¡Solicitud Enviada!
        </h2>

        <p class="text-xs sm:text-sm font-semibold text-gray-600 leading-relaxed max-w-xs mx-auto">
          Registramos tu reserva de Restaurante para <strong class="text-brand-dark font-black">{{ store.guestsCount }} personas</strong>. Te avisaremos al teléfono <strong class="text-brand-dark font-black">{{ store.clientPhone }}</strong>.
        </p>
      </div>

      <div class="bg-brand-light p-4 rounded-2xl border border-brand-border text-left space-y-2 text-xs font-bold text-gray-700">
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Servicio:</span>
          <span class="text-brand-dark font-black">Restaurante</span>
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
          <BedDouble class="w-5 h-5 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>¿Se quedan a dormir?</span>
        </div>

        <p class="text-xs font-semibold text-amber-900 leading-relaxed">
          Puedes complementar tu visita reservando una cabaña o un sitio de camping para tu mismo grupo de <strong>{{ store.guestsCount }} personas</strong>.
        </p>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            @click="handleGoToCabana"
            class="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs touch-target active:scale-95 transition-transform"
          >
            <BedDouble class="w-4 h-4 stroke-[2.5]" />
            <span>Cabañas</span>
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