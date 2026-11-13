<script setup lang="ts">
// Piscina (SCRUM-44), paso 2: datos de contacto. Solo nombre y teléfono son obligatorios.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { User, Phone, Waves, CalendarDays } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { isClientContactValid, isClientPhoneIncomplete } from '../../../services/wizard'
import { formatDateShort } from '../../../lib/dates'

const router = useRouter()
const store = useReservationStore()

const isFormValid = computed(() => isClientContactValid(store.clientName, store.clientPhone))
const phoneIncomplete = computed(() => isClientPhoneIncomplete(store.clientPhone))

function handleNext() {
  if (!isFormValid.value) return
  store.nextStep()
  router.push('/piscina/paso3')
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-contenido-nav">
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="2" />
    </div>

    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-5">
      <div class="space-y-1.5">
        <label class="block text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Nombre *
        </label>
        <input
          type="text"
          v-model="store.clientName"
          placeholder="Ej: Juan Pérez"
          class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
        />
      </div>

      <div class="space-y-1.5">
        <label class="block text-sm font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
          <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Teléfono de contacto *
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
      </div>

      <div class="bg-brand-light p-3.5 rounded-xl border border-brand-border space-y-1 text-sm font-bold text-gray-700">
        <div class="flex justify-between">
          <span>Servicio:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1">
            <Waves class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" /> Piscina
          </span>
        </div>
        <div class="flex justify-between">
          <span>Fecha:</span>
          <span class="text-brand-dark font-extrabold flex items-center gap-1">
            <CalendarDays class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" /> {{ formatDateShort(store.checkInDate) }}
          </span>
        </div>
        <div class="flex justify-between">
          <span>Personas:</span>
          <span class="text-brand-dark font-extrabold">{{ store.guestsCount }}</span>
        </div>
      </div>
    </div>

    <BarraAccionInferior :disabled="!isFormValid" @click="handleNext">Revisar</BarraAccionInferior>
  </div>
</template>
