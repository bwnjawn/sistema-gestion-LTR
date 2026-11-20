<script setup lang="ts">
// Estado de una solicitud como insignia con color, ícono y texto (tres señales, no solo el color):
// Pendiente = ámbar con reloj · Por mover = rojo con calendario · Confirmada = verde con check ·
// Descartada (rechazada o cancelada) = gris con X · En conflicto (una confirmación hecha sin conexión chocó
// con otra al sincronizar, SCRUM-250) = rojo con triángulo.
import { computed } from 'vue'
import { CalendarClock, Check, Clock, TriangleAlert, X } from 'lucide-vue-next'
import { etiquetaEstado, tonoDeEstado } from '../../services/resumenSolicitud'
import type { BookingStatus } from '../../types/domain'

const props = defineProps<{ status: BookingStatus; porMover?: boolean; enConflicto?: boolean }>()

const conflicto = computed(() => !!props.enConflicto && props.status === 'pending')

const tono = computed(() => tonoDeEstado(props.status, !!props.porMover || conflicto.value))
const texto = computed(() => {
  if (conflicto.value) return 'En conflicto'
  return props.porMover && props.status === 'pending' ? 'Por mover' : etiquetaEstado(props.status)
})

const clase = computed(() => {
  switch (tono.value) {
    case 'confirmada': return 'bg-emerald-100 text-emerald-950 border-status-success'
    case 'por-mover': return 'bg-rose-100 text-rose-950 border-status-danger'
    case 'descartada': return 'bg-gray-200 text-gray-800 border-gray-500'
    default: return 'bg-amber-100 text-amber-950 border-amber-600'
  }
})
const icono = computed(() => {
  if (conflicto.value) return TriangleAlert
  switch (tono.value) {
    case 'confirmada': return Check
    case 'por-mover': return CalendarClock
    case 'descartada': return X
    default: return Clock
  }
})
</script>

<template>
  <span :class="['inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold', clase]">
    <component :is="icono" class="w-3.5 h-3.5 stroke-[3] shrink-0" aria-hidden="true" />
    {{ texto }}
  </span>
</template>
