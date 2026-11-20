<script setup lang="ts">
// Tarjeta de una solicitud en la lista: quién, qué, cuándo, cuánto y, si hace falta, una sola señal.
// Tocar la tarjeta abre el detalle; abajo solo van las acciones que corresponden.
import { computed } from 'vue'
import { AlertTriangle, Building2, CalendarClock, Check, ChevronRight, Tent, Utensils, Waves, X } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import EstadoSolicitud from './EstadoSolicitud.vue'
import EtiquetaSinSincronizar from './EtiquetaSinSincronizar.vue'
import { formatCLP } from '../../lib/format'
import { describirPago, resumirSolicitud, senalDeSolicitud, tonoDeEstado } from '../../services/resumenSolicitud'
import type { ReservationRequest } from '../../types/domain'

const props = defineProps<{
  request: ReservationRequest
  /** Cantidad de solicitudes con las que se topa (SCRUM-60). */
  conflictCount?: number
  /** Quién ocupa su fecha (una confirmada): no se puede aprobar, solo mover o rechazar. Vacío si no aplica. */
  bloqueo?: string
}>()

const emit = defineEmits<{
  (e: 'open', id: string): void
  (e: 'approve', id: string): void
  (e: 'reject', id: string): void
  (e: 'move', id: string): void
}>()

const resumen = computed(() => resumirSolicitud(props.request))
const pago = computed(() => describirPago(props.request))
const senal = computed(() => senalDeSolicitud(props.request, { bloqueo: props.bloqueo, cruces: props.conflictCount }))
const esPendiente = computed(() => props.request.status === 'pending')

const icono = computed(() => {
  if (props.request.type === 'cabana') return Building2
  if (props.request.type === 'camping') return Tent
  if (props.request.type === 'piscina') return Waves
  return Utensils
})

const tono = computed(() => tonoDeEstado(props.request.status, !!props.bloqueo))
// Las descartadas se ven apagadas: ya no hay nada que hacer con ellas
const apagada = computed(() => tono.value === 'descartada')
// Franja de color a la izquierda: se reconoce el estado de lejos, antes de leer
const franja = computed(() => ({
  confirmada: 'border-l-status-success',
  'por-mover': 'border-l-status-danger',
  descartada: 'border-l-gray-400',
  pendiente: 'border-l-amber-500'
})[tono.value])
const iconoFondo = computed(() => ({
  confirmada: 'bg-emerald-100 border-status-success text-emerald-950',
  'por-mover': 'bg-rose-100 border-status-danger text-rose-950',
  descartada: 'bg-gray-200 border-gray-400 text-gray-700',
  pendiente: 'bg-amber-100 border-amber-600 text-amber-950'
})[tono.value])
</script>

<template>
  <article :class="['bg-white rounded-3xl border-2 border-brand-border border-l-8 shadow-xs overflow-hidden', franja, apagada ? 'opacity-75' : '']">
    <button
      type="button"
      @click="emit('open', request.id)"
      :aria-label="`Abrir la solicitud de ${request.clientName}`"
      class="w-full text-left p-4 space-y-2.5 active:bg-brand-light transition-colors"
    >
      <div class="flex items-start gap-3">
        <span :class="['w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0', iconoFondo]">
          <component :is="icono" class="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex items-baseline justify-between gap-2">
            <h2 class="text-base font-bold text-gray-900 leading-tight truncate">{{ request.clientName }}</h2>
            <span class="text-base font-bold text-gray-900 shrink-0">{{ formatCLP(request.totalAmount) }}</span>
          </div>
          <p class="text-sm text-gray-800 leading-snug mt-0.5">
            {{ resumen.recurso }} · <span class="font-bold">{{ resumen.fechas }}</span><template v-if="resumen.noches > 0"> · {{ resumen.noches }} {{ resumen.noches === 1 ? 'noche' : 'noches' }}</template>
          </p>
          <p class="text-xs text-gray-700 mt-0.5">{{ resumen.personas }} · {{ request.requestCode }}</p>
        </div>
        <ChevronRight class="w-5 h-5 text-gray-500 shrink-0 mt-2.5" aria-hidden="true" />
      </div>

      <div class="flex items-center justify-between gap-3">
        <span class="flex items-center gap-1.5 flex-wrap min-w-0">
          <EstadoSolicitud :status="request.status" :por-mover="!!bloqueo" :en-conflicto="request.enConflicto" />
          <EtiquetaSinSincronizar :solicitud-id="request.id" />
        </span>
        <div v-if="!apagada" class="flex items-center gap-2 min-w-0">
          <div class="w-16 h-1.5 rounded-full bg-gray-200 overflow-hidden shrink-0" aria-hidden="true">
            <div class="h-full bg-brand-dark" :style="{ width: pago.porcentaje + '%' }"></div>
          </div>
          <span class="text-xs text-gray-700 truncate">{{ pago.texto }}</span>
        </div>
      </div>

      <!-- Una sola señal, la más importante -->
      <p
        v-if="senal"
        :class="[
          'flex items-start gap-2 rounded-xl px-3 py-2 text-sm font-bold',
          senal.urgente ? 'bg-rose-50 text-rose-950 border border-status-danger' : 'bg-amber-50 text-amber-950 border border-amber-500'
        ]"
      >
        <AlertTriangle class="w-4 h-4 stroke-[2.5] shrink-0 mt-0.5" aria-hidden="true" />
        <span>{{ senal.texto }}</span>
      </p>
    </button>

    <div v-if="esPendiente" class="grid grid-cols-2 gap-2 px-4 pb-4">
      <BaseButton variant="outline" size="md" class="!text-sm !border-status-danger !text-status-danger" @click="emit('reject', request.id)">
        <X class="w-4 h-4 mr-1 stroke-[3]" aria-hidden="true" /> Rechazar
      </BaseButton>
      <BaseButton v-if="bloqueo" variant="primary" size="md" class="!text-sm" @click="emit('move', request.id)">
        <CalendarClock class="w-4 h-4 mr-1 stroke-[3]" aria-hidden="true" /> Mover fecha
      </BaseButton>
      <BaseButton v-else variant="success" size="md" class="!text-sm" @click="emit('approve', request.id)">
        <Check class="w-4 h-4 mr-1 stroke-[3]" aria-hidden="true" /> Aprobar
      </BaseButton>
    </div>
  </article>
</template>
