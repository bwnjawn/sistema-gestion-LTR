<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Phone, 
  FileText, 
  Utensils, 
  Clock 
} from 'lucide-vue-next'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import { useReservationStore } from '../../../stores/reservationStore'

const router = useRouter()
const store = useReservationStore()

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  if (!day || !month) return dateStr
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthIdx = parseInt(month, 10) - 1
  return `${parseInt(day, 10)} ${months[monthIdx] || ''}`
}

const isFormValid = computed(() => {
  return store.clientName.trim().length >= 2 && store.clientPhone.trim().length >= 8
})

function handleNext() {
  if (isFormValid.value) {
    router.push('/restaurante/paso4')
  }
}

function handleBack() {
  router.push('/restaurante/paso2')
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
      Ingresa tu información para coordinar la reserva de menú en el restaurante.
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
          placeholder="Ej: María González"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
      </div>

      <!-- Campo: Teléfono de Contacto con inputmode="numeric" -->
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
      </div>

      <!-- Campo: Comentarios u Observaciones (Opcional) -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileText class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Comentarios u Observaciones (Opcional)
        </label>
        <textarea 
          v-model="store.comments"
          rows="3"
          placeholder="¿Restricciones alimentarias, alergias o solicitudes especiales?"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-semibold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors resize-none"
        ></textarea>
      </div>

      <!-- Resumen Fijo -->
      <div class="bg-brand-light p-3.5 rounded-xl border border-brand-border space-y-1 text-xs font-bold text-gray-700">
        <div class="flex justify-between">
          <span>Servicio:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1">
            <Utensils class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Restaurante
          </span>
        </div>
        <div class="flex justify-between">
          <span>Fecha y Hora:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1">
            <Clock class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            {{ formatDateShort(store.checkInDate) }} ({{ store.restaurantTime || 'Por definir' }})
          </span>
        </div>
        <div class="flex justify-between">
          <span>Comensales:</span>
          <span class="text-brand-dark font-extrabold">{{ store.guestsCount }} personas</span>
        </div>
      </div>

    </div>

    <!-- 4. Botones de Navegación Flotantes -->
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