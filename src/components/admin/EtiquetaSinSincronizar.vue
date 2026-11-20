<script setup lang="ts">
import { CloudOff } from 'lucide-vue-next'
import { useCambiosAdminStore } from '../../stores/cambiosAdminStore'

// Marca "Sin sincronizar" en una solicitud con cambios hechos sin conexión que aún no llegaron al servidor
// (SCRUM-250). Ícono, texto y color: no depende solo del color.
defineProps<{ solicitudId: string }>()
const cambios = useCambiosAdminStore()
</script>

<template>
  <span
    v-if="cambios.estaSinSincronizar(solicitudId)"
    class="inline-flex items-center gap-1 rounded-full border border-sky-700 bg-sky-100 px-2.5 py-0.5 text-sm font-bold text-sky-950"
  >
    <CloudOff class="w-3.5 h-3.5 stroke-[3] shrink-0" aria-hidden="true" />
    Sin sincronizar
  </span>
</template>
