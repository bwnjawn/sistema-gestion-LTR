<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, Building2, Calendar, Check, Tent, Users, Utensils, Waves, X } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import { formatCLP } from '../../lib/format'
import { formatDateTime } from '../../lib/dates'
import { getPaymentSummary, isConfirmedWithoutDeposit, isDepositOverdue } from '../../services/payments'
import { describeRequest, isStalePending } from '../../services/requests'
import type { ReservationRequest } from '../../types/domain'

const props = defineProps<{
  request: ReservationRequest
  /** Cantidad de solicitudes con las que se topa (SCRUM-60). */
  conflictCount?: number
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

const paidPercent = computed(() =>
  payment.value.total > 0 ? Math.min(100, Math.round((payment.value.totalPaid / payment.value.total) * 100)) : 0
)

const serviceIcon = computed(() => {
  if (props.request.type === 'cabana') return Building2
  if (props.request.type === 'camping') return Tent
  if (props.request.type === 'piscina') return Waves
  return Utensils
})

// Franja de color a la izquierda según el estado, para recorrer la lista de un vistazo.
const accentClass = computed(() => {
  switch (props.request.status) {
    case 'confirmed': return 'border-l-status-success'
    case 'rejected': return 'border-l-status-danger'
    case 'cancelled': return 'border-l-gray-500'
    default: return 'border-l-amber-500'
  }
})

const statusClass = computed(() => {
  switch (props.request.status) {
    case 'confirmed': return 'bg-status-success text-white'
    case 'rejected': return 'bg-status-danger text-white'
    case 'cancelled': return 'bg-gray-600 text-white'
    default: return 'bg-amber-200 text-amber-950 border border-amber-500'
  }
})

const missingClass = computed(() => {
  if (payment.value.balance === 0) return 'text-status-success'
  return payment.value.state === 'sin_abono' ? 'text-status-danger' : 'text-amber-900'
})

const overdue = computed(() => isDepositOverdue(props.request))

// Plazo vigente para abonar, mientras la solicitud esté pendiente y falte abono
const dueText = computed(() => {
  const r = props.request
  if (r.status !== 'pending' || !r.depositDueAt || overdue.value || payment.value.depositPending <= 0) return ''
  return `Abono hasta el ${formatDateTime(r.depositDueAt)}`
})

const confirmedWithoutDeposit = computed(() => isConfirmedWithoutDeposit(props.request))

const paymentHint = computed(() => {
  const p = payment.value
  if (props.request.status === 'pending' && p.depositRequired > 0 && p.depositPending === 0 && p.state !== 'pagado_total') {
    return 'Abono recibido: falta aprobar'
  }
  if (p.state === 'sin_abono_exigido') return 'Sin abono exigido'
  if (p.state === 'pagado_total') return 'Pagado completo'
  if (p.state === 'abono_completo') return 'Abono recibido'
  if (p.state === 'abono_parcial') return `Faltan ${formatCLP(p.depositPending)} para completar el abono`
  return `Falta el abono de ${formatCLP(p.depositRequired)}`
})
</script>

<template>
  <article
    :class="[
      'bg-white p-4 rounded-2xl border border-gray-500 border-l-8 shadow-md space-y-3',
      accentClass,
      isStale ? 'ring-2 ring-amber-500' : '',
      conflictCount || overdue ? 'ring-2 ring-status-danger' : ''
    ]"
  >
    <p v-if="overdue" class="bg-rose-100 border border-status-danger text-rose-950 px-3 py-1.5 rounded-lg text-sm font-black flex items-center gap-1.5">
      <AlertTriangle class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
      Abono vencido. Abre el detalle para contactar al cliente, esperar o cancelar.
    </p>
    <p v-if="isStale" class="bg-amber-100 border border-amber-500 text-amber-950 px-3 py-1.5 rounded-lg text-sm font-black flex items-center gap-1.5">
      <AlertTriangle class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
      Pendiente hace más de 24 horas sin gestionar
    </p>

    <p v-if="conflictCount" class="bg-rose-100 border border-status-danger text-rose-950 px-3 py-1.5 rounded-lg text-sm font-black flex items-center gap-1.5">
      <AlertTriangle class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
      Se cruza con {{ conflictCount }} {{ conflictCount === 1 ? 'solicitud' : 'solicitudes' }}. Revisa el detalle antes de aprobar.
    </p>

    <!-- Quién y qué -->
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="text-sm font-black text-gray-700 flex items-center gap-1.5">
          <component :is="serviceIcon" class="w-4 h-4 text-brand-accent stroke-[2.5]" aria-hidden="true" />
          {{ view.serviceLabel }} · {{ request.requestCode }}
        </p>
        <h2 class="text-xl font-black text-brand-dark leading-tight truncate">{{ request.clientName }}</h2>
      </div>
      <span :class="['px-3 py-1 rounded-full text-sm font-black shrink-0', statusClass]">{{ view.statusLabel }}</span>
    </div>

    <!-- Cuándo -->
    <div class="space-y-2">
      <p class="flex items-center gap-2 text-sm font-black text-gray-700 uppercase tracking-wide">
        <Calendar class="w-5 h-5 text-brand-accent stroke-[2.5] shrink-0" aria-hidden="true" />
        {{ view.stayTitle }}
      </p>
      <dl class="grid grid-cols-[5.5rem_1fr] gap-x-3 gap-y-1">
        <template v-for="row in [...view.stayDates, ...(view.staySummary ? [view.staySummary] : [])]" :key="row.label">
          <dt class="text-base font-bold text-gray-700">{{ row.label }}</dt>
          <dd class="text-base font-black text-brand-dark">{{ row.value }}</dd>
        </template>
      </dl>
      <p class="flex items-center gap-2 text-sm font-bold text-gray-800 border-t border-gray-200 pt-2">
        <Users class="w-5 h-5 text-brand-accent stroke-[2.5] shrink-0" aria-hidden="true" />
        <span>{{ view.guestsLabel }} · {{ request.resourceName }}</span>
      </p>
    </div>

    <!-- Dinero -->
    <div class="border-t-2 border-gray-200 pt-3 space-y-2">
      <div class="flex items-end justify-between gap-3">
        <div>
          <span class="text-sm font-bold text-gray-700 block">Total</span>
          <span class="text-lg font-black text-brand-dark">{{ formatCLP(payment.total) }}</span>
        </div>
        <div class="text-right">
          <span class="text-sm font-bold text-gray-700 block">{{ payment.balance === 0 ? 'Pagado' : 'Falta pagar' }}</span>
          <span :class="['text-2xl font-black leading-none', missingClass]">{{ formatCLP(payment.balance === 0 ? payment.totalPaid : payment.balance) }}</span>
        </div>
      </div>

      <div
        class="h-3 rounded-full bg-gray-200 overflow-hidden"
        role="progressbar"
        :aria-valuenow="paidPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Pagado ${paidPercent}% del total`"
      >
        <div class="h-full bg-status-success" :style="{ width: paidPercent + '%' }"></div>
      </div>
      <p class="text-sm font-bold text-gray-800">
        Pagado {{ formatCLP(payment.totalPaid) }} · {{ paymentHint }}
      </p>
      <p v-if="dueText" class="text-sm font-black text-amber-900">{{ dueText }}</p>
      <p v-if="confirmedWithoutDeposit" class="text-sm font-black text-amber-900">Confirmada sin abono completo</p>
    </div>

    <!-- Acciones -->
    <div class="space-y-2 pt-1">
      <BaseButton variant="outline" size="md" fullWidth @click="emit('open', request.id)">
        Ver detalle completo
      </BaseButton>
      <div v-if="isPending" class="grid grid-cols-2 gap-2">
        <BaseButton variant="success" size="md" @click="emit('approve', request.id)">
          <Check class="w-4 h-4 mr-1 stroke-[3]" aria-hidden="true" /> Aprobar
        </BaseButton>
        <BaseButton variant="outline" size="md" class="!border-status-danger !text-status-danger" @click="emit('reject', request.id)">
          <X class="w-4 h-4 mr-1 stroke-[3]" aria-hidden="true" /> Rechazar
        </BaseButton>
      </div>
    </div>
  </article>
</template>
