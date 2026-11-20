<script setup lang="ts">
import { computed } from 'vue'
import { CloudOff } from 'lucide-vue-next'
import { useColaEnvioStore } from '../../stores/colaEnvioStore'

// Aviso del inicio cuando hay solicitudes guardadas en el teléfono que aún no se enviaron (SCRUM-250).
const cola = useColaEnvioStore()
const total = computed(() => cola.entradas.length)
const texto = computed(() => {
  const rechazadas = cola.rechazadas.length
  if (rechazadas > 0 && cola.pendientes.length === 0) {
    return rechazadas === 1 ? 'Una solicitud no se pudo enviar' : `${rechazadas} solicitudes no se pudieron enviar`
  }
  return total.value === 1 ? 'Tienes 1 solicitud por enviar' : `Tienes ${total.value} solicitudes por enviar`
})
</script>

<template>
  <RouterLink
    v-if="total > 0"
    to="/pendientes"
    role="status"
    class="flex items-center gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3 text-amber-950 active:scale-98 transition-transform"
  >
    <CloudOff class="w-6 h-6 stroke-[2.5] shrink-0" aria-hidden="true" />
    <span class="grow min-w-0">
      <span class="block text-sm font-bold">{{ texto }}</span>
      <span class="block text-sm font-bold">Toca para verla</span>
    </span>
  </RouterLink>
</template>
