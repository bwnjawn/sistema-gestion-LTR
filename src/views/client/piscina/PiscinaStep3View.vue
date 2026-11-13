<script setup lang="ts">
// Piscina (SCRUM-44), paso 3: resumen y envío. La solicitud queda confirmada al enviarla, sin abono
// ni plazo ni aprobación: sirve para que el administrador sepa quién viene.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, FileCheck, Pencil, RotateCcw } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import AvisoEnvio from '../../../components/ui/AvisoEnvio.vue'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import ConfirmacionReservaAdmin from '../../../components/ui/ConfirmacionReservaAdmin.vue'
import { useEnvioSolicitud } from '../../../composables/useEnvioSolicitud'
import { useSalidaReserva } from '../../../composables/useSalidaReserva'
import { useReservationStore } from '../../../stores/reservationStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { formatCLP } from '../../../lib/format'
import { formatDateShort } from '../../../lib/dates'

const router = useRouter()
const store = useReservationStore()
const settingsStore = useSettingsStore()

const isSubmitted = ref(false)
const reservationCode = ref('')

const total = computed(() => store.priceBreakdown?.totalWithIva ?? 0)
const personas = computed(() => `${store.guestsCount} ${store.guestsCount === 1 ? 'persona' : 'personas'}`)

const { isSubmitting, errorEnvio, sinConexion, enviar } = useEnvioSolicitud()

function handleSendRequest() {
  return enviar(async () => {
    reservationCode.value = await store.submitReservationRequest()
    isSubmitted.value = true
  })
}

const { terminar: handleGoHome } = useSalidaReserva()
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-contenido-nav">
    <div v-if="!isSubmitted" class="space-y-4">
      <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
        <StepIndicator :current-step="3" />
      </div>

      <BaseAlert variant="info" title="Revisa tu visita antes de enviar">
        No necesitas abonar nada: al enviar, tu visita queda registrada.
      </BaseAlert>

      <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-4">
        <div class="space-y-1.5">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-sm font-extrabold text-gray-500 uppercase tracking-wider">Visita a la piscina</h3>
            <button type="button" @click="router.push('/piscina/paso1')" class="text-sm font-black text-brand-accent hover:underline flex items-center gap-1">
              <Pencil class="w-3.5 h-3.5" /> Editar
            </button>
          </div>
          <p class="text-sm font-black text-brand-dark">{{ formatDateShort(store.checkInDate) }} · {{ personas }}</p>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-sm font-extrabold text-gray-500 uppercase tracking-wider">Datos de contacto</h3>
            <button type="button" @click="router.push('/piscina/paso2')" class="text-sm font-black text-brand-accent hover:underline flex items-center gap-1">
              <Pencil class="w-3.5 h-3.5" /> Editar
            </button>
          </div>
          <p class="text-sm font-black text-brand-dark">{{ store.clientName }}</p>
          <p class="text-sm font-bold text-gray-700">{{ store.clientPhone }}</p>
        </div>

        <div class="border-t border-gray-200/60 pt-3 space-y-1 text-sm font-bold text-gray-600">
          <div class="flex justify-between">
            <span>{{ personas }} × {{ formatCLP(settingsStore.poolEntryPrice) }}</span>
            <span>{{ formatCLP(total) }}</span>
          </div>
          <div class="flex justify-between text-base font-black text-brand-dark">
            <span>Total</span>
            <span>{{ formatCLP(total) }}</span>
          </div>
        </div>
      </div>

      <AvisoEnvio
        :sin-conexion="sinConexion"
        :error="errorEnvio"
        :enviando="isSubmitting"
        @reintentar="handleSendRequest"
      />

      <BarraAccionInferior enviar :loading="isSubmitting || sinConexion" :disabled="sinConexion" @click="handleSendRequest">{{ sinConexion ? 'Esperando conexión…' : isSubmitting ? 'Enviando…' : 'Enviar' }}</BarraAccionInferior>
    </div>

    <!-- El administrador ve su propia confirmación, sin el texto dirigido al cliente -->
    <ConfirmacionReservaAdmin
      v-else-if="store.isAdminMode"
      :codigo="reservationCode"
      servicio="Piscina"
      :fechas="formatDateShort(store.checkInDate)"
      :total="total"
    />

    <div v-else class="bg-white p-6 rounded-3xl border-2 border-brand-border shadow-md space-y-5 text-center">
      <div class="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs border-2 border-emerald-300">
        <CheckCircle2 class="w-10 h-10 stroke-[2.5]" />
      </div>

      <div class="space-y-2.5">
        <div class="inline-flex items-center gap-1.5 bg-brand-light border border-brand-border px-3.5 py-1 rounded-full text-sm font-black text-brand-dark">
          <FileCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <span>Código: {{ reservationCode }}</span>
        </div>
        <h2 class="text-2xl font-black text-brand-dark tracking-tight">¡Visita registrada!</h2>
        <p class="text-sm font-semibold text-gray-600 leading-relaxed max-w-xs mx-auto">
          Te esperamos el <strong class="text-brand-dark font-black">{{ formatDateShort(store.checkInDate) }}</strong> con
          <strong class="text-brand-dark font-black">{{ personas }}</strong>. No necesitas abonar nada.
        </p>
      </div>

      <div class="bg-brand-light p-4 rounded-2xl border border-brand-border text-left text-sm font-bold text-gray-700 flex justify-between items-center">
        <span class="text-gray-500">Total de la entrada:</span>
        <span class="text-base font-black text-brand-dark">{{ formatCLP(total) }}</span>
      </div>

      <BaseButton variant="outline" size="lg" fullWidth @click="handleGoHome">
        <RotateCcw class="w-5 h-5 mr-1.5 stroke-[2.5]" />
        Volver al Inicio
      </BaseButton>
    </div>
  </div>
</template>
