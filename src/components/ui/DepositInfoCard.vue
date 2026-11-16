<script setup lang="ts">
import { computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import DatosTransferencia from './DatosTransferencia.vue'
import { useSettingsStore } from '../../stores/settingsStore'

// Plegable "Cómo pagar el abono". La política (qué es una solicitud, porcentaje y plazo) vive en la ayuda
// del encabezado; aquí solo quedan los datos para transferir. Sin abono (institución) no se muestra.
defineProps<{
  /** Institución en restaurante: no paga abono (SCRUM-264). */
  exempt?: boolean
}>()

const settingsStore = useSettingsStore()
const deadlineHours = computed(() => settingsStore.depositDeadlineHours)
</script>

<template>
  <details v-if="!exempt" class="group bg-white rounded-3xl border-2 border-brand-border">
    <summary class="list-none cursor-pointer p-4 flex items-center justify-between gap-2 text-sm font-bold text-brand-dark touch-target [&::-webkit-details-marker]:hidden">
      Cómo pagar el abono
      <ChevronDown class="w-5 h-5 stroke-[2.5] transition-transform group-open:rotate-180" aria-hidden="true" />
    </summary>
    <div class="px-4 pb-4 space-y-3">
      <p class="text-sm text-gray-700">
        Transfiere después de enviar la solicitud: tienes {{ deadlineHours }} horas. El saldo se paga al llegar.
      </p>
      <DatosTransferencia />
    </div>
  </details>
</template>
