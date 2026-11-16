<script setup lang="ts">
import { computed } from 'vue'
import { useReservationStore } from '../../stores/reservationStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { isDepositExempt } from '../../services/pricing'

// Contenido de la ayuda del último paso del cliente; el marco (modal) lo pone ModalAyuda.
const store = useReservationStore()
const settingsStore = useSettingsStore()

const esPiscina = computed(() => store.selectedService === 'piscina')
const sinAbono = computed(() => isDepositExempt(store.selectedService, store.clientType))
</script>

<template>
  <ul class="space-y-3 text-sm text-gray-700">
    <li v-if="esPiscina">
      <b class="font-bold text-brand-dark">Qué pasa al enviar.</b> Tu visita queda registrada. No necesitas abonar nada.
    </li>
    <template v-else>
      <li><b class="font-bold text-brand-dark">Esto es una solicitud.</b> Tu reserva queda confirmada cuando transfieres el abono y te lo confirmamos.</li>
      <li v-if="sinAbono"><b class="font-bold text-brand-dark">Sin abono.</b> Tu institución no necesita pagar abono. Te contactaremos para confirmar y el pago se coordina después con el restaurante.</li>
      <template v-else>
        <li><b class="font-bold text-brand-dark">Abono.</b> Para confirmar se pide el {{ settingsStore.defaultDepositPercentage }}% del total. El saldo se paga directamente al llegar al centro turístico.</li>
        <li><b class="font-bold text-brand-dark">Plazo.</b> Tienes {{ settingsStore.depositDeadlineHours }} horas desde que envías la solicitud para transferir. Si no llega a tiempo, nos pondremos en contacto contigo.</li>
      </template>
    </template>
    <li><b class="font-bold text-brand-dark">¿Algo está mal?</b> Usa "Editar" en cada bloque para corregirlo antes de enviar.</li>
  </ul>
</template>
