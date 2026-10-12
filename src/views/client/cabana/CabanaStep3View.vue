<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Phone, 
  FileText, 
  Building2, 
  Clock 
} from 'lucide-vue-next'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useAdminStore } from '../../../stores/adminStore'

const router = useRouter()
const store = useReservationStore()
const adminStore = useAdminStore()

const nightsCount = computed(() => {
  if (!store.checkInDate || !store.checkOutDate) return 1
  const start = new Date(store.checkInDate)
  const end = new Date(store.checkOutDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
})

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  if (!day || !month) return dateStr
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthIdx = parseInt(month, 10) - 1
  return `${parseInt(day, 10)} ${months[monthIdx] || ''}`
}

// FORMATO UNIFICADO Y DINÁMICO: Remplaza "Día de ingreso/salida" por las fechas reales del cliente
const formattedScheduleDisplay = computed(() => {
  const inTime = adminStore.cabinSchedules.checkIn
  const outTime = adminStore.cabinSchedules.checkOut
  if (store.checkInDate && store.checkOutDate) {
    const inDate = formatDateShort(store.checkInDate)
    const outDate = formatDateShort(store.checkOutDate)
    return `${inDate} (${inTime} hrs) - ${outDate} (${outTime} hrs)`
  }
  return `Día de ingreso (${inTime} hrs) - Día de salida (${outTime} hrs)`
})

const selectedCabin = computed(() => {
  return adminStore.cabins.find(c => c.id === store.selectedCabinId)
})

const isFormValid = computed(() => {
  return store.clientName.trim().length >= 2 && store.clientPhone.trim().length >= 8
})

function handleNext() {
  if (isFormValid.value) {
    router.push('/cabana/paso4')
  }
}

function handleBack() {
  router.push('/cabana/paso2')
}
</script>

<template>
  <div class="space-y-4 pb-24">
    <!-- 1. Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="3" />
    </div>

    <!-- 2. Alerta Guiada -->
    <BaseAlert variant="info" title="Tus datos de contacto">
      Ingresa tu información para que los dueños puedan confirmar tu solicitud de reserva por teléfono.
    </BaseAlert>

    <!-- 3. Formulario "Tus Datos" -->
    <div class="bg-white p-5 rounded-2xl border-2 border-brand-border shadow-sm space-y-5">
      
      <!-- Campo: Nombre o Institución -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Nombre o Institución *
        </label>
        <input 
          type="text"
          v-model="store.clientName"
          placeholder="Ej: Juan Pérez / Colegio San Martín"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
      </div>

      <!-- Campo: Teléfono de Contacto (inputmode="numeric") -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Teléfono de Contacto *
        </label>
        <input 
          type="tel"
          inputmode="numeric"
          v-model="store.clientPhone"
          placeholder="+56 9 1234 5678"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
        <span class="text-[11px] font-semibold text-gray-500 block">
          Te contactaremos a este número para confirmar los detalles.
        </span>
      </div>

      <!-- Campo: Comentarios u Observaciones -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileText class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Comentarios u Observaciones (Opcional)
        </label>
        <textarea 
          v-model="store.comments"
          rows="3"
          placeholder="¿Alguna solicitud especial para tu llegada o estadía?"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-semibold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors resize-none"
        ></textarea>
      </div>

      <!-- Resumen Fijo Unificado (Sin Duplicidad) -->
      <div class="bg-brand-light p-3.5 rounded-xl border border-brand-border space-y-1 text-xs font-bold text-gray-700">
        <div class="flex justify-between">
          <span>Servicio:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1">
            <Building2 class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Cabaña ({{ selectedCabin?.name || 'Cabaña' }})
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span>Fechas y Horario:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1 text-right">
            <Clock class="w-3.5 h-3.5 text-brand-accent stroke-[2.5] shrink-0" />
            {{ formattedScheduleDisplay }} ({{ nightsCount }} {{ nightsCount === 1 ? 'noc.' : 'noc.' }})
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