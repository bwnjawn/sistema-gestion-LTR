<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { User, Phone, Mail, FileText, Tent, Clock } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { isClientContactValid, isClientPhoneIncomplete } from '../../../services/wizard'
import { useCatalogStore } from '../../../stores/catalogStore'
import { formatDateShort, nightsBetween } from '../../../lib/dates'

const router = useRouter()
const store = useReservationStore()
const catalogStore = useCatalogStore()

const selectedCampingSite = computed(() => {
  return catalogStore.campingSites.find(s => s.id === store.selectedCampingId)
})

const isDiario = computed(() => store.campingType === 'diario')

const nightsCount = computed(() => (isDiario.value ? 1 : nightsBetween(store.checkInDate, store.checkOutDate)))

const formattedScheduleDisplay = computed(() => {
  if (!store.checkInDate) return 'Sin fecha'
  if (isDiario.value) {
    return `${formatDateShort(store.checkInDate)} (Día de campo)`
  }
  return `${formatDateShort(store.checkInDate)} al ${formatDateShort(store.checkOutDate)} (${nightsCount.value} noc.)`
})

const isFormValid = computed(() => isClientContactValid(store.clientName, store.clientPhone))
const phoneIncomplete = computed(() => isClientPhoneIncomplete(store.clientPhone))

function handleNext() {
  if (isFormValid.value) {
    store.nextStep()
    router.push('/camping/paso4')
  }
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-contenido-nav">
    <!-- Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="3" />
    </div>

    <!-- Alerta Guiada -->
    <BaseAlert variant="info" title="Tus datos de contacto">
      Ingresa tu información para que la administración pueda coordinar y confirmar tu espacio de camping.
    </BaseAlert>

    <!-- Formulario "Tus Datos" -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-5">
      
      <!-- Campo: Nombre o Institución -->
      <div class="space-y-1.5">
        <label class="block text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Nombre o Institución *
        </label>
        <input 
          type="text"
          v-model="store.clientName"
          placeholder="Ej: Juan Pérez"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
      </div>

      <!-- Campo: Teléfono de Contacto -->
      <div class="space-y-1.5">
        <label class="block text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
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
        <span v-if="phoneIncomplete" class="text-sm font-black text-rose-800 block" role="alert">
          El número está incompleto: son +56 9 y 8 dígitos más.
        </span>
        <span class="text-sm font-semibold text-gray-500 block">
          Te contactaremos a este número para confirmar los detalles.
        </span>
      </div>

      <!-- Campo: Correo Electrónico (Opcional) -->
      <div class="space-y-1.5">
        <label class="block text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
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
        <label class="block text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileText class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Comentarios u Observaciones (Opcional)
        </label>
        <textarea 
          v-model="store.comments"
          rows="3"
          placeholder="¿Traes vehículos grandes, mascotas o requerimientos de energía?"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-semibold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors resize-none"
        ></textarea>
      </div>

      <!-- Resumen Fijo Unificado -->
      <div class="bg-brand-light p-3.5 rounded-xl border border-brand-border space-y-1 text-sm font-bold text-gray-700">
        <div class="flex justify-between">
          <span>Servicio:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1">
            <Tent class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Camping ({{ selectedCampingSite?.name || 'Camping' }})
          </span>
        </div>
        <div class="flex justify-between items-center">
          <span>Modalidad y Fechas:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1 text-right">
            <Clock class="w-3.5 h-3.5 text-brand-accent stroke-[2.5] shrink-0" />
            {{ formattedScheduleDisplay }}
          </span>
        </div>
        <div class="flex justify-between">
          <span>Visitantes:</span>
          <span class="text-brand-dark font-extrabold">{{ store.guestsCount }} personas</span>
        </div>
      </div>

    </div>

    <BarraAccionInferior :disabled="!isFormValid" @click="handleNext">Revisar Solicitud</BarraAccionInferior>
  </div>
</template>