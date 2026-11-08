<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Building2, Calendar, Check, Tent, Users, Utensils, X } from 'lucide-vue-next'
import { formatCLP } from '../../lib/format'
import { getPaymentSummary } from '../../services/payments'
import { describeRequest, isStalePending } from '../../services/requests'
import type { ReservationRequest } from '../../types/domain'

const props = defineProps<{
  request: ReservationRequest
}>()

const emit = defineEmits<{
  (e: 'open', id: string): void
  (e: 'approve', id: string): void
  (e: 'reject', id: string): void
}>()

const view = computed(() => describeRequest(props.request))
const payment = computed(() => getPaymentSummary(props.request))
const isStale = computed(() => isStalePending(props.request))
const isPending = computed(() => props.request.status === 'pending')

const serviceIcon = computed(() => {
  if (props.request.type === 'cabana') return Building2
  if (props.request.type === 'camping') return Tent
  return Utensils
})

const serviceClass = computed(() => {
  if (props.request.type === 'cabana') return 'bg-amber-100 text-amber-950 border-amber-300'
  if (props.request.type === 'camping') return 'bg-emerald-100 text-emerald-950 border-emerald-300'
  return 'bg-sky-100 text-sky-950 border-sky-300'
})

const statusClass = computed(() => {
  switch (props.request.status) {
    case 'confirmed': return 'bg-emerald-600 text-white'
    case 'rejected': return 'bg-rose-600 text-white'
    case 'cancelled': return 'bg-gray-500 text-white'
    default: return 'bg-amber-400 text-amber-950'
  }
})

const paymentClass = computed(() => {
  if (payment.value.tone === 'emerald') return 'bg-emerald-100 text-emerald-900 border-emerald-300'
  if (payment.value.tone === 'amber') return 'bg-amber-100 text-amber-900 border-amber-300'
  return 'bg-rose-100 text-rose-900 border-rose-300'
})
</script>

<template>
  <article
    :class="[
      'bg-white p-4 rounded-3xl border-2 space-y-3 shadow-sm',
      isStale ? 'border-amber-400 ring-2 ring-amber-300/60' : 'border-brand-border'
    ]"
  >
    <div v-if="isStale" class="bg-amber-100 border border-amber-300 text-amber-950 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5">
      <AlertTriangle class="w-4 h-4 text-amber-700 stroke-[2.5] shrink-0" />
      <span>Pendiente hace más de 24 horas sin gestionar</span>
    </div>

    <!-- Servicio, código y estado -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2 min-w-0">
        <span :class="['p-2 rounded-xl border shrink-0', serviceClass]">
          <component :is="serviceIcon" class="w-5 h-5 stroke-[2.5]" />
        </span>
        <div class="min-w-0">
          <span class="text-xs font-black uppercase text-gray-600 block leading-tight">{{ view.serviceLabel }} · {{ request.requestCode }}</span>
          <span class="text-base font-black text-brand-dark block truncate">{{ request.clientName }}</span>
        </div>
      </div>
      <span :class="['px-3 py-1 rounded-full text-xs uppercase font-black tracking-wide shrink-0', statusClass]">
        {{ view.statusLabel }}
      </span>
    </div>

    <!-- Fechas -->
    <div class="bg-brand-light border border-brand-border rounded-2xl p-3 space-y-1.5">
      <div class="flex items-start gap-2 text-sm font-black text-brand-dark">
        <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5] shrink-0 mt-0.5" />
        <span>{{ view.stayHeadline }}</span>
      </div>
      <div class="flex items-center gap-2 text-sm font-bold text-gray-700">
        <Users class="w-4 h-4 text-brand-accent stroke-[2.5] shrink-0" />
        <span>{{ view.guestsLabel }} · {{ request.resourceName }}</span>
      </div>
    </div>

    <!-- Dinero -->
    <div class="grid grid-cols-3 gap-2 text-center">
      <div class="bg-brand-light rounded-xl border border-brand-border p-2">
        <span class="text-xs font-bold text-gray-600 block">Total</span>
        <span class="text-sm font-black text-brand-dark">{{ formatCLP(payment.total) }}</span>
      </div>
      <div class="bg-brand-light rounded-xl border border-brand-border p-2">
        <span class="text-xs font-bold text-gray-600 block">Abono exigido</span>
        <span class="text-sm font-black text-brand-dark">{{ formatCLP(payment.depositRequired) }}</span>
      </div>
      <div class="bg-brand-light rounded-xl border border-brand-border p-2">
        <span class="text-xs font-bold text-gray-600 block">Pagado</span>
        <span class="text-sm font-black text-brand-dark">{{ formatCLP(payment.totalPaid) }}</span>
      </div>
    </div>
    <span :class="['inline-block px-3 py-1 rounded-full text-xs font-black border', paymentClass]">
      {{ payment.label }}<template v-if="payment.state !== 'pagado_total'"> · falta {{ formatCLP(payment.balance) }}</template>
    </span>

    <!-- Acciones -->
    <div class="flex gap-2 pt-1">
      <button
        type="button"
        @click="emit('open', request.id)"
        class="flex-1 py-3 bg-brand-light border-2 border-brand-border text-brand-dark rounded-xl font-black text-sm hover:bg-gray-100 active:scale-95 transition-transform touch-target"
      >
        Ver detalle completo
      </button>
      <button
        v-if="isPending"
        type="button"
        @click="emit('approve', request.id)"
        aria-label="Aprobar solicitud"
        class="py-3 px-4 bg-emerald-600 text-white rounded-xl font-black text-sm flex items-center gap-1 active:scale-95 transition-transform touch-target"
      >
        <Check class="w-4 h-4 stroke-[3]" /> Aprobar
      </button>
      <button
        v-if="isPending"
        type="button"
        @click="emit('reject', request.id)"
        aria-label="Rechazar solicitud"
        class="py-3 px-3 bg-rose-600 text-white rounded-xl font-black text-sm active:scale-95 transition-transform touch-target"
      >
        <X class="w-5 h-5 stroke-[3]" />
      </button>
    </div>
  </article>
</template>
