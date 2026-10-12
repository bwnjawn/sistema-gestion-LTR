<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, ArrowRight, User, Phone, Mail, FileText, 
  Building2, Clock, Utensils 
} from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import { useReservationStore } from '../../../stores/reservationStore'

const router = useRouter()
const store = useReservationStore()

const clientTypes = ['Particular', 'Empresa', 'Colegio', 'Institución']
const selectedClientType = ref('Particular')

const mealLabels: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  once: 'Once'
}

const activeMealNames = computed(() => {
  const order = ['desayuno', 'almuerzo', 'once']
  return order
    .filter(m => store.selectedMealTypes.includes(m))
    .map(m => mealLabels[m])
    .join(', ') || 'Restaurante'
})

const totalDishesCount = computed(() => {
  return (store.selectedMeals as any[]).reduce((sum, item) => sum + (item.quantity || item.count || 0), 0)
})

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-'
  const [, m, d] = dateStr.split('-').map(Number)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d} ${months[m - 1]}`
}

const formattedScheduleDisplay = computed(() => {
  if (!store.checkInDate) return 'Sin fecha'
  const timeStr = store.restaurantTime ? ` (${store.restaurantTime} hrs)` : ''
  return `${formatDateShort(store.checkInDate)}${timeStr}`
})

const isFormValid = computed(() => {
  const nameOk = !!store.clientName.trim()
  const phoneOk = !!store.clientPhone.trim() && store.clientPhone.trim() !== '+56 9'
  return nameOk && phoneOk
})

function handleBack() {
  store.prevStep()
  router.push('/restaurante/paso2')
}

function handleNext() {
  if (isFormValid.value) {
    store.nextStep()
    router.push('/restaurante/paso4')
  }
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    <!-- Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="3" />
    </div>

    <!-- Alerta Guiada -->
    <BaseAlert variant="info" title="Tus datos de contacto">
      Ingresa tu información para asociar la reserva de restaurante y coordinar la confirmación con el equipo.
    </BaseAlert>

    <!-- Formulario "Tus Datos" -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-5">
      
      <!-- Selector Exclusivo: Tipo de Cliente -->
      <div class="space-y-2">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Building2 class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Tipo de Cliente *
        </label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="type in clientTypes"
            :key="type"
            type="button"
            @click="selectedClientType = type"
            :class="[
              'py-2.5 px-3 rounded-xl font-black text-xs transition-all border-2 text-center touch-target active:scale-95',
              selectedClientType === type
                ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
                : 'bg-brand-light text-brand-dark border-brand-border hover:bg-gray-100'
            ]"
          >
            {{ type }}
          </button>
        </div>
      </div>

      <!-- Campo: Nombre / Razón Social -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          {{ selectedClientType === 'Particular' ? 'Nombre Completo *' : 'Nombre de Empresa / Institución *' }}
        </label>
        <input 
          type="text"
          v-model="store.clientName"
          :placeholder="selectedClientType === 'Particular' ? 'Ej: Juan Pérez' : 'Ej: Colegio San Martín / Empresa XYZ'"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
      </div>

      <!-- Campo: Teléfono de Contacto -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Teléfono / WhatsApp *
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

      <!-- Campo: Correo Electrónico (Opcional) -->
      <div class="space-y-1.5">
        <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Mail class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Correo Electrónico (Opcional)
        </label>
        <input 
          type="email"
          v-model="store.clientEmail"
          placeholder="ejemplo@correo.com"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-semibold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
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
          placeholder="¿Requerimientos de alergias, restricción alimentaria o mesa especial?"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-semibold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors resize-none"
        ></textarea>
      </div>

      <!-- Resumen Fijo Unificado -->
      <div class="bg-brand-light p-3.5 rounded-xl border border-brand-border space-y-1 text-xs font-bold text-gray-700">
        <div class="flex justify-between">
          <span>Servicio:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1">
            <Utensils class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Restaurante ({{ activeMealNames }})
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span>Fecha y Atentados:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1 text-right">
            <Clock class="w-3.5 h-3.5 text-brand-accent stroke-[2.5] shrink-0" />
            {{ formattedScheduleDisplay }}
          </span>
        </div>
        <div class="flex justify-between">
          <span>Comensales y Menús:</span>
          <span class="text-brand-dark font-extrabold">
            {{ store.guestsCount }} pers. ({{ totalDishesCount }} menús)
          </span>
        </div>
      </div>

    </div>

    <!-- Navegación Flotante Fija -->
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