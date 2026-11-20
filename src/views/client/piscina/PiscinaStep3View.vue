<script setup lang="ts">
// Piscina (SCRUM-44), paso 3: resumen y envío. La solicitud queda confirmada al enviarla, sin abono
// ni plazo ni aprobación: sirve para que el administrador sepa quién viene.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, RotateCcw } from 'lucide-vue-next'
import BaseButton from '../../../components/ui/BaseButton.vue'
import AvisoEnvio from '../../../components/ui/AvisoEnvio.vue'
import CodigoSolicitud from '../../../components/ui/CodigoSolicitud.vue'
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

const { isSubmitting, errorEnvio, sinConexion, seGuardaParaDespues, bloqueado, enviar } = useEnvioSolicitud()

function handleSendRequest() {
  return enviar(async () => {
    reservationCode.value = await store.submitReservationRequest()
    isSubmitted.value = true
  })
}

const { terminar: handleGoHome } = useSalidaReserva()
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-contenido-precio">
    <div v-if="!isSubmitted" class="space-y-4">
      <h2 class="text-2xl font-bold text-brand-dark leading-tight">Revisa tu visita</h2>

      <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-4">
        <div class="space-y-0.5">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-bold text-brand-accent">Visita</p>
            <button type="button" @click="router.push('/piscina/paso1')" class="text-sm font-bold text-brand-accent underline py-1 shrink-0">Editar</button>
          </div>
          <p class="text-xl font-bold text-brand-dark">{{ formatDateShort(store.checkInDate) }}</p>
          <p class="text-base text-gray-700">{{ personas }}</p>
        </div>
        <div class="space-y-0.5 pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-bold text-brand-accent">Contacto</p>
            <button type="button" @click="router.push('/piscina/paso2')" class="text-sm font-bold text-brand-accent underline py-1 shrink-0">Editar</button>
          </div>
          <p class="text-base font-bold text-brand-dark">{{ store.clientName }}</p>
          <p class="text-base text-gray-700">{{ store.clientPhone }}</p>
        </div>
        <div class="pt-4 border-t border-gray-200 space-y-1.5 text-sm text-gray-700">
          <div class="flex justify-between gap-3"><span>{{ personas }} × {{ formatCLP(settingsStore.poolEntryPrice) }}</span><span>{{ formatCLP(total) }}</span></div>
        </div>
      </div>

      <AvisoEnvio
        :sin-conexion="sinConexion"
        :se-guarda="seGuardaParaDespues"
        :error="errorEnvio"
        :enviando="isSubmitting"
        @reintentar="handleSendRequest"
      />

      <BarraAccionInferior enviar :total="total" :abono="0" sin-abono :loading="isSubmitting || bloqueado" :disabled="bloqueado" @click="handleSendRequest">{{ bloqueado ? 'Esperando conexión…' : isSubmitting ? 'Enviando…' : 'Enviar' }}</BarraAccionInferior>
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
        <CodigoSolicitud :codigo="reservationCode" />
        <h2 class="text-2xl font-bold text-brand-dark tracking-tight">¡Visita registrada!</h2>
        <p class="text-base text-gray-700 leading-relaxed max-w-xs mx-auto">
          Te esperamos el <strong class="text-brand-dark font-bold">{{ formatDateShort(store.checkInDate) }}</strong> con
          <strong class="text-brand-dark font-bold">{{ personas }}</strong>. No necesitas abonar nada.
        </p>
      </div>

      <div class="bg-brand-light p-4 rounded-2xl border border-brand-border text-left text-sm text-gray-700 flex justify-between items-center">
        <span class="text-gray-600">Total de la entrada:</span>
        <span class="text-base font-bold text-brand-dark">{{ formatCLP(total) }}</span>
      </div>

      <BaseButton variant="outline" size="lg" fullWidth @click="handleGoHome">
        <RotateCcw class="w-5 h-5 mr-1.5 stroke-[2.5]" />
        Volver al Inicio
      </BaseButton>
    </div>
  </div>
</template>
