<script setup lang="ts">
// Confirmación de rechazo desde la lista: un toque en "Rechazar" pregunta aquí mismo, sin abrir el detalle.
import { computed } from 'vue'
import BaseButton from '../ui/BaseButton.vue'
import HojaModal from '../ui/HojaModal.vue'
import { useRequestsStore } from '../../stores/requestsStore'

const props = defineProps<{
  /** Solicitud que se quiere rechazar; null mantiene el aviso cerrado. */
  requestId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const requestsStore = useRequestsStore()
const request = computed(() => requestsStore.requests.find(r => r.id === props.requestId) ?? null)

async function rechazar() {
  if (!request.value) return
  await requestsStore.rejectRequest(request.value.id)
  emit('close')
}
</script>

<template>
  <HojaModal v-if="request" :abierto="true" titulo="Rechazar solicitud" ocultar-cierre :nivel="70" @cerrar="emit('close')">
    <p class="text-base text-gray-800">
      ¿Rechazar la solicitud de <strong class="font-bold">{{ request.clientName }}</strong>
      ({{ request.requestCode }})? Quedará como "Descartada" y el cliente tendrá que volver a solicitarla.
    </p>
    <template #pie>
      <div class="grid grid-cols-2 gap-2">
        <BaseButton variant="danger" size="md" class="!text-base" @click="rechazar">Sí, rechazar</BaseButton>
        <BaseButton variant="outline" size="md" class="!text-base" @click="emit('close')">No, volver</BaseButton>
      </div>
    </template>
  </HojaModal>
</template>
