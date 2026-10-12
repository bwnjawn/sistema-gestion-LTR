<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  User, 
  Phone, 
  FileText, 
  ArrowLeft, 
  ArrowRight,
  Utensils,
  Clock,
  Building2
} from 'lucide-vue-next'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import { useReservationStore } from '../../../stores/reservationStore'

const router = useRouter()
const store = useReservationStore()

// Categorías exclusivas para Restaurante
const clientCategories = [
  'Particular', 
  'Organización', 
  'Empresa', 
  'Institución', 
  'Paseo escolar'
]

function formatDateShort(dateStr: string): string {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-')
  if (!day || !month) return dateStr
  const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
  const monthIdx = parseInt(month, 10) - 1
  return `${parseInt(day, 10)} ${months[monthIdx] || ''}`
}

const isFormValid = computed(() => {
  return (store.clientName || '').trim().length > 0 && (store.clientPhone || '').trim().length >= 8
})

function handleNext() {
  if (!isFormValid.value) return
  router.push('/restaurante/paso4')
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
      Ingresa tu información y categoría para confirmar los detalles de la reserva de restaurante.
    </BaseAlert>

    <!-- 3. Formulario "Tus Datos" -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-5">
      
      <!-- SECCIÓN EXCLUSIVA: Categoría del Cliente (Particular, Organización, Empresa, Institución, Paseo escolar) -->
      <div class="space-y-2">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Tipo / Categoría de Cliente *
        </label>

        <div class="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            v-for="cat in clientCategories"
            :key="cat"
            @click="(store as any).clientCategory = cat"
            :class="[
              'py-2.5 px-3.5 rounded-xl font-black text-xs transition-all touch-target border-2 active:scale-95',
              (store as any).clientCategory === cat || (!(store as any).clientCategory && cat === 'Particular')
                ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                : 'bg-brand-light text-brand-dark border-brand-border hover:bg-gray-200'
            ]"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Campo: Nombre o Institución -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Nombre o Nombre de Institución *
        </label>
        <input 
          type="text"
          v-model="store.clientName"
          placeholder="Ej: Juan Pérez / Colegio San Martín"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
      </div>

      <!-- Campo: Teléfono de Contacto -->
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
          Te llamaremos a este número para coordinar detalles de tu menú.
        </span>
      </div>

      <!-- Campo: Comentarios u Observaciones -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileText class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Comentarios / Restricciones Alimentarias (Opcional)
        </label>
        <textarea 
          v-model="store.comments"
          rows="3"
          placeholder="Alergias, menú vegetariano especial, sillas para niños..."
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-semibold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors resize-none"
        ></textarea>
      </div>

      <!-- Resumen Fijo Inferior -->
      <div class="bg-brand-light p-3.5 rounded-2xl border border-brand-border space-y-1 text-xs font-bold text-gray-700">
        <div class="flex justify-between">
          <span>Servicio:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1">
            <Utensils class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Restaurante ({{ (store as any).clientCategory || 'Particular' }})
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span>Fecha:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1">
            <Clock class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            {{ formatDateShort(store.checkInDate) }}
          </span>
        </div>
        <div class="flex justify-between">
          <span>Comensales:</span>
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