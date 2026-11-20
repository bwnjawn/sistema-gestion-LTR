<script setup lang="ts">
// Fila compacta de una solicitud en la lista de PC (SCRUM-278): quién, qué y cuándo, el estado y el total.
// Elegirla muestra su detalle al lado; las acciones están en el detalle, no en la fila.
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import EstadoSolicitud from './EstadoSolicitud.vue'
import EtiquetaSinSincronizar from './EtiquetaSinSincronizar.vue'
import { formatCLP } from '../../lib/format'
import { resumirSolicitud, senalDeSolicitud, tonoDeEstado } from '../../services/resumenSolicitud'
import type { ReservationRequest } from '../../types/domain'

const props = defineProps<{
  request: ReservationRequest
  seleccionada: boolean
  /** Cantidad de solicitudes con las que se topa. */
  conflictCount?: number
  /** Quién ocupa su fecha (una confirmada); vacío si no aplica. */
  bloqueo?: string
}>()

defineEmits<{ (e: 'select', id: string): void }>()

const resumen = computed(() => resumirSolicitud(props.request))
const senal = computed(() => senalDeSolicitud(props.request, { bloqueo: props.bloqueo, cruces: props.conflictCount }))
const tono = computed(() => tonoDeEstado(props.request.status, !!props.bloqueo))
const franja = computed(() => ({
  confirmada: 'bg-status-success',
  'por-mover': 'bg-status-danger',
  descartada: 'bg-gray-400',
  pendiente: 'bg-amber-500'
})[tono.value])
</script>

<template>
  <button
    type="button"
    :aria-current="seleccionada ? 'true' : undefined"
    :class="[
      'w-full flex items-center gap-3 pl-2 pr-3 py-3 rounded-xl text-left border transition-colors',
      seleccionada ? 'bg-emerald-50 border-emerald-200' : 'border-transparent hover:bg-brand-light',
      tono === 'descartada' ? 'opacity-75' : ''
    ]"
    @click="$emit('select', request.id)"
  >
    <span :class="['w-1.5 self-stretch rounded-full shrink-0', franja]" aria-hidden="true"></span>
    <span class="min-w-0 grow">
      <span class="block text-base font-bold text-gray-900 truncate">{{ request.clientName }}</span>
      <span class="block text-sm text-gray-600 truncate">
        {{ resumen.recurso }} · {{ resumen.fechas }}<template v-if="resumen.noches > 0"> · {{ resumen.noches }} {{ resumen.noches === 1 ? 'noche' : 'noches' }}</template>
      </span>
      <span v-if="senal" :class="['flex items-center gap-1 text-sm font-bold mt-0.5', senal.urgente ? 'text-rose-900' : 'text-amber-900']">
        <AlertTriangle class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
        <span class="truncate">{{ senal.texto }}</span>
      </span>
    </span>
    <span class="shrink-0 text-right space-y-1">
      <span class="flex flex-col items-end gap-1">
        <EstadoSolicitud :status="request.status" :por-mover="!!bloqueo" :en-conflicto="request.enConflicto" />
        <EtiquetaSinSincronizar :solicitud-id="request.id" />
      </span>
      <span class="block text-sm font-bold text-gray-800">{{ formatCLP(request.totalAmount) }}</span>
    </span>
  </button>
</template>
