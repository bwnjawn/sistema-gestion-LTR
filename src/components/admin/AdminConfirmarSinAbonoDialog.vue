<script setup lang="ts">
// Aviso al aprobar una solicitud a la que aún le falta abono (SCRUM-264).
// Solo el administrador decide si confirma sin el abono completo; la app solo se lo advierte.
import { computed } from 'vue'
import BaseButton from '../ui/BaseButton.vue'
import HojaModal from '../ui/HojaModal.vue'
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
  <HojaModal v-if="request && payment" :abierto="true" titulo="Falta el abono" ocultar-cierre :nivel="70" @cerrar="emit('close')">
    <p class="text-base text-gray-800">
      A la solicitud de <strong class="font-bold">{{ request.clientName }}</strong> le faltan
      <strong class="font-bold">{{ formatCLP(payment.depositPending) }}</strong> para completar el abono exigido de
      {{ formatCLP(payment.depositRequired) }}.
    </p>
    <p class="text-base text-gray-800">
      Si la confirmas ahora, retiene las fechas y quedará como "Confirmada sin abono". Puedes anotar el pago antes desde el detalle.
    </p>
    <template #pie>
      <div class="grid grid-cols-2 gap-2">
        <BaseButton variant="success" size="md" class="!text-base" @click="emit('confirm', request.id)">Confirmar igual</BaseButton>
        <BaseButton variant="outline" size="md" class="!text-base" @click="emit('close')">Volver</BaseButton>
      </div>
    </template>
  </HojaModal>
</template>
