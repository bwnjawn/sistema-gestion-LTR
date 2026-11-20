<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { useCambiosAdminStore } from '../../stores/cambiosAdminStore'

// Barra bajo el encabezado del panel: hay cambios hechos sin conexión que no han llegado al servidor (SCRUM-250).
const cambios = useCambiosAdminStore()
const total = computed(() => cambios.entradas.length)
const texto = computed(() => {
  if (cambios.pendientes.length === 0) {
    const n = cambios.rechazados.length
    return n === 1 ? '1 cambio no se pudo enviar' : `${n} cambios no se pudieron enviar`
  }
  const n = cambios.pendientes.length
  return n === 1 ? '1 cambio sin sincronizar' : `${n} cambios sin sincronizar`
})
</script>

<template>
  <RouterLink
    v-if="total > 0"
    :to="{ name: 'admin-sync' }"
    role="status"
    class="block bg-sky-100 border-t-2 border-sky-700 text-sky-950"
  >
    <span class="max-w-md mx-auto px-4 py-2 flex items-center gap-2 text-base font-bold">
      <RefreshCw :class="['w-4 h-4 stroke-[2.5] shrink-0', cambios.sincronizando ? 'animate-spin motion-reduce:animate-none' : '']" aria-hidden="true" />
      <span class="grow min-w-0">{{ texto }}</span>
      <span class="underline shrink-0">Ver</span>
    </span>
  </RouterLink>
</template>
