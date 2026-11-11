<script setup lang="ts">
// Aviso al aprobar una solicitud a la que aún le falta abono (SCRUM-264).
// Solo el administrador decide si confirma sin el abono completo; la app solo se lo advierte.
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { formatCLP } from '../../lib/format'
import { getPaymentSummary } from '../../services/payments'

const props = defineProps<{
  /** Solicitud que se quiere aprobar; null mantiene el aviso cerrado. */
  requestId: string | null
}>()

const emit = defineEmits<{
  (e: 'confirm', id: string): void
  (e: 'close'): void
}>()

const requestsStore = useRequestsStore()
const request = computed(() => requestsStore.requests.find(r => r.id === props.requestId) ?? null)
const payment = computed(() => (request.value ? getPaymentSummary(request.value) : null))
</script>

<template>
  <div
    v-if="request && payment"
    class="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center sm:p-4"
    role="alertdialog"
    aria-modal="true"
    aria-label="Falta el abono"
  >
    <div class="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full border-2 border-gray-500 shadow-2xl p-4 space-y-3">
      <h2 class="text-xl font-black text-brand-dark flex items-center gap-1.5">
        <AlertTriangle class="w-6 h-6 text-amber-700 stroke-[2.5] shrink-0" aria-hidden="true" /> Falta el abono
      </h2>
      <p class="text-base font-bold text-gray-800">
        A la solicitud de <strong class="font-black">{{ request.clientName }}</strong> le faltan
        <strong class="font-black">{{ formatCLP(payment.depositPending) }}</strong> para completar el abono exigido de
        {{ formatCLP(payment.depositRequired) }}.
      </p>
      <p class="text-base font-bold text-gray-800">
        Si la confirmas ahora, retiene las fechas y quedará como "Confirmada sin abono". Puedes anotar el pago antes desde el detalle.
      </p>
      <div class="grid grid-cols-2 gap-2">
        <BaseButton variant="success" @click="emit('confirm', request.id)">Confirmar igual</BaseButton>
        <BaseButton variant="outline" @click="emit('close')">Volver</BaseButton>
      </div>
    </div>
  </div>
</template>
