<script setup lang="ts">
// Confirmación de rechazo desde la lista: un toque en "Rechazar" pregunta aquí mismo, sin abrir el detalle.
import { computed } from 'vue'
import BaseButton from '../ui/BaseButton.vue'
import { useBloqueoScroll } from '../../composables/useBloqueoScroll'
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

useBloqueoScroll(computed(() => !!request.value))

async function rechazar() {
  if (!request.value) return
  await requestsStore.rejectRequest(request.value.id)
  emit('close')
}
</script>

<template>
  <div
    v-if="request"
    class="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center sm:p-4"
    role="alertdialog"
    aria-modal="true"
    aria-label="Rechazar solicitud"
  >
    <div class="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full border-2 border-brand-border shadow-2xl p-4 space-y-3">
      <h2 class="text-lg font-bold text-brand-dark">Rechazar solicitud</h2>
      <p class="text-sm text-gray-800">
        ¿Rechazar la solicitud de <strong class="font-bold">{{ request.clientName }}</strong>
        ({{ request.requestCode }})? Quedará como "Descartada" y el cliente tendrá que volver a solicitarla.
      </p>
      <div class="grid grid-cols-2 gap-2">
        <BaseButton variant="danger" size="md" class="!text-sm" @click="rechazar">Sí, rechazar</BaseButton>
        <BaseButton variant="outline" size="md" class="!text-sm" @click="emit('close')">No, volver</BaseButton>
      </div>
    </div>
  </div>
</template>
