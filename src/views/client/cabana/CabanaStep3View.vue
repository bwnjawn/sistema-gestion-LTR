<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, ArrowLeft, User, Phone, Mail, FileText, Tag, Building2 } from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'

const router = useRouter()
const store = useReservationStore()

const categories = [
  { id: 'Particular', label: 'Particular' },
  { id: 'Empresa', label: 'Empresa' },
  { id: 'Colegio', label: 'Colegio' },
  { id: 'Institución', label: 'Institución' }
]

const selectedCategory = ref(store.eventReason || 'Particular')
const fullName = ref(store.clientName || '')
const phone = ref(store.clientPhone || '+56 9 ')
const email = ref('')
const eventReason = ref('')
const comments = ref('')

const nightsCount = computed(() => {
  if (!store.checkInDate || !store.checkOutDate) return 1
  const d1 = new Date(store.checkInDate + 'T00:00:00')
  const d2 = new Date(store.checkOutDate + 'T00:00:00')
  const diffTime = d2.getTime() - d1.getTime()
  return Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)))
})

function formatDateShort(dateStr: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

const isFormValid = computed(() => {
  return fullName.value.trim().length >= 2 && phone.value.trim().length >= 8
})

function handleNext() {
  if (!isFormValid.value) return
  
  store.clientName = fullName.value.trim()
  store.clientPhone = phone.value.trim()
  store.eventReason = selectedCategory.value
  
  store.nextStep()
  router.push({ name: 'cabana-step4' })
}

function handleBack() {
  store.prevStep()
  router.push({ name: 'cabana-step2' })
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto pb-28">
    
    <!-- 1. Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="3" />
    </div>

    <!-- 2. Alerta Guiada -->
    <BaseAlert variant="info" title="Tus datos de contacto">
      Ingresa tu información para que los dueños puedan confirmar tu solicitud de reserva por teléfono.
    </BaseAlert>

    <!-- 3. Formulario "Tus Datos" (Paso 3) -->
    <div class="bg-white p-5 rounded-2xl border-2 border-brand-border shadow-sm space-y-5">
      
      <!-- Selector de Tipo de Cliente / Categoría -->
      <div class="space-y-2">
        <label class="block text-xs font-extrabold text-gray-500 uppercase tracking-wider">
          Categoría de Cliente
        </label>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            v-for="cat in categories"
            :key="cat.id"
            @click="selectedCategory = cat.id"
            :class="[
              'py-3 px-3 rounded-xl font-extrabold text-xs transition-all touch-target border-2',
              selectedCategory === cat.id
                ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                : 'bg-brand-light text-brand-dark border-brand-border hover:bg-gray-200'
            ]"
          >
            {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- Campo: Nombre o Institución -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Nombre o Institución *
        </label>
        <input 
          type="text"
          v-model="fullName"
          placeholder="Ej: Juan Pérez / Colegio San Martín"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
      </div>

      <!-- Campo: Teléfono (+56 9) -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Teléfono de Contacto *
        </label>
        <input 
          type="tel"
          v-model="phone"
          placeholder="+56 9 1234 5678"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
        <span class="text-[11px] font-semibold text-gray-500 block">
          Te contactaremos a este número para confirmar los detalles.
        </span>
      </div>

      <!-- Campo: Correo Electrónico (Opcional) -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Mail class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Correo Electrónico (Opcional)
        </label>
        <input 
          type="email"
          v-model="email"
          placeholder="ejemplo@correo.com"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
      </div>

      <!-- Campo: Evento o Motivo -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Tag class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Evento o Motivo (Opcional)
        </label>
        <input 
          type="text"
          v-model="eventReason"
          placeholder="Ej: Paseo familiar, Cumpleaños, Reunión"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
      </div>

      <!-- Campo: Comentarios u Observaciones (Opcional) -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileText class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Comentarios u Observaciones (Opcional)
        </label>
        <textarea 
          v-model="comments"
          rows="3"
          placeholder="¿Alguna solicitud especial para tu llegada o estadía?"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-semibold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors resize-none"
        ></textarea>
      </div>

      <!-- Resumen Fijo -->
      <div class="bg-brand-light p-3.5 rounded-xl border border-brand-border space-y-1 text-xs font-bold text-gray-700">
        <div class="flex justify-between">
          <span>Servicio:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1">
            <Building2 class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Cabaña ({{ store.selectedCabinId === 'cabana-2' ? 'Cabaña 8' : 'Cabaña 6' }})
          </span>
        </div>
        <div class="flex justify-between">
          <span>Fechas:</span>
          <span class="text-brand-dark font-extrabold">
            {{ formatDateShort(store.checkInDate) }} → {{ formatDateShort(store.checkOutDate) }} ({{ nightsCount }} noc.)
          </span>
        </div>
        <div class="flex justify-between">
          <span>Integrantes:</span>
          <span class="text-brand-dark font-extrabold">{{ store.guestsCount }} personas</span>
        </div>
      </div>

    </div>

    <!-- 4. Botones de Navegación Flotantes Fijos -->
    <div class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-3.5 shadow-2xl">
      <div class="max-w-md mx-auto flex items-center gap-3">
        <BaseButton variant="outline" size="lg" @click="handleBack">
          <ArrowLeft class="w-5 h-5 mr-1.5 stroke-[2.5]" />
          Volver
        </BaseButton>

        <BaseButton 
          variant="primary" 
          size="lg" 
          fullWidth 
          :disabled="!isFormValid"
          @click="handleNext"
        >
          Revisar Solicitud
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>

  </div>
</template>