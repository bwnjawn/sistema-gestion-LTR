<script setup lang="ts">
// Cancelar una reserva confirmada (SCRUM-284). Primero se explica qué pasa y se pide confirmar; después, con la
// reserva ya cancelada, se ofrece avisar al cliente (la app no envía mensajes sola).
import { computed, ref, watch } from 'vue'
import { Check } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import HojaModal from '../ui/HojaModal.vue'
import AccionesContactoCliente from './AccionesContactoCliente.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { formatCLP } from '../../lib/format'
import { getPaymentSummary } from '../../services/payments'
import { buildAsuntoCancelacion, buildMensajeCancelacion, describirFechasSolicitud } from '../../services/mensajesCliente'

const props = defineProps<{
  /** Reserva confirmada que se quiere cancelar; null mantiene la hoja cerrada. */
  requestId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const requestsStore = useRequestsStore()
const request = computed(() => requestsStore.requests.find(r => r.id === props.requestId) ?? null)
const abonado = computed(() => (request.value ? getPaymentSummary(request.value).totalPaid : 0))

/** `confirmar`: pregunta · `avisar`: ya se canceló, se ofrece avisar al cliente. */
const fase = ref<'confirmar' | 'avisar'>('confirmar')
const cancelando = ref(false)
watch(() => props.requestId, () => { fase.value = 'confirmar'; cancelando.value = false })

async function cancelar() {
  if (!request.value || cancelando.value) return
  cancelando.value = true
  // Si no se pudo guardar, el store ya avisó el motivo y la hoja se queda para reintentar
  const ok = await requestsStore.cancelConfirmedRequest(request.value.id)
  cancelando.value = false
  if (ok) fase.value = 'avisar'
}
</script>

<template>
  <HojaModal
    v-if="request"
    :abierto="true"
    :titulo="fase === 'confirmar' ? 'Cancelar reserva' : 'Reserva cancelada'"
    ocultar-cierre
    :cerrar-al-tocar-fuera="false"
    :nivel="70"
    @cerrar="emit('close')"
  >
    <template v-if="fase === 'confirmar'">
      <p class="text-base text-gray-800">
        ¿Cancelar la reserva de <strong class="font-bold">{{ request.clientName }}</strong>
        ({{ request.requestCode }}) del {{ describirFechasSolicitud(request) }}?
      </p>
      <ul class="space-y-1.5 text-base text-gray-800 list-disc pl-5">
        <li>Las fechas y los cupos quedan <strong class="font-bold">libres</strong> para otras reservas.</li>
        <li>Queda en el historial, en las <strong class="font-bold">Descartadas</strong> (anotada como cancelada en el Excel).</li>
        <li>No se puede deshacer desde la app.</li>
      </ul>
      <p v-if="abonado > 0" class="text-base text-amber-950 bg-amber-50 border border-amber-500 rounded-xl p-3">
        Tiene <strong class="font-bold">{{ formatCLP(abonado) }}</strong> abonados. Esos pagos se conservan anotados:
        la app no registra devoluciones, el abono recibido no se devuelve desde aquí.
      </p>
    </template>

    <template v-else>
      <p class="flex items-start gap-2 text-base text-emerald-950 bg-emerald-50 border border-status-success rounded-xl p-3">
        <Check class="w-5 h-5 stroke-[3] shrink-0 mt-0.5" aria-hidden="true" />
        <span>La reserva quedó cancelada y sus fechas están libres.</span>
      </p>
      <section class="space-y-2">
        <h3 class="text-base font-bold text-brand-dark">Avisar al cliente (la app no envía nada sola)</h3>
        <AccionesContactoCliente
          :telefono="request.clientPhone"
          :correo="request.clientEmail"
          :mensaje="buildMensajeCancelacion(request)"
          :asunto="buildAsuntoCancelacion(request)"
        />
      </section>
    </template>

    <template #pie>
      <div v-if="fase === 'confirmar'" class="grid grid-cols-2 gap-2">
        <BaseButton variant="danger" size="md" class="!text-base" :loading="cancelando" @click="cancelar">Sí, cancelar</BaseButton>
        <BaseButton variant="outline" size="md" class="!text-base" :disabled="cancelando" @click="emit('close')">No, volver</BaseButton>
      </div>
      <BaseButton v-else variant="primary" size="md" full-width class="!text-base" @click="emit('close')">Listo</BaseButton>
    </template>
  </HojaModal>
</template>
