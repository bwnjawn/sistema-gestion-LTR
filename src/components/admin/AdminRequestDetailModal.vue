<script setup lang="ts">
import { useBloqueoScroll } from '../../composables/useBloqueoScroll'
import { computed, ref, watch } from 'vue'
import {
  AlertTriangle, Calendar, Check, CreditCard, FileText, Mail, MessageCircle, Pencil, Phone, Receipt, User, Utensils, X
} from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import AdminRequestEditForm from './AdminRequestEditForm.vue'
import AdminConfirmarCruceDialog from './AdminConfirmarCruceDialog.vue'
import AdminConfirmarSinAbonoDialog from './AdminConfirmarSinAbonoDialog.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { buildMailtoUrl, buildTelUrl, buildWhatsappUrl, hasUsablePhone } from '../../lib/contactLinks'
import { formatDateShort, formatDateTime, todayISO } from '../../lib/dates'
import { formatCLP } from '../../lib/format'
import { PAYMENT_METHOD_LABELS, getPaymentSummary, isConfirmedWithoutDeposit, isDepositOverdue } from '../../services/payments'
import { canEditRequest, describeRequest } from '../../services/requests'
import type { PaymentMethod } from '../../types/domain'

const props = defineProps<{
  requestId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  /** Pide abrir el detalle de otra solicitud (la que se cruza con esta). */
  (e: 'open-request', id: string): void
}>()

const requestsStore = useRequestsStore()
const settingsStore = useSettingsStore()

// La solicitud se lee siempre del store, así el detalle se actualiza solo al aprobar o registrar pagos.
const request = computed(() => requestsStore.requests.find(r => r.id === props.requestId) ?? null)
const view = computed(() => (request.value ? describeRequest(request.value) : null))
const payment = computed(() => (request.value ? getPaymentSummary(request.value) : null))
const isPending = computed(() => request.value?.status === 'pending')

// Solicitudes con las que se topa esta (SCRUM-60); la resolución es manual
const conflicts = computed(() => {
  if (!request.value) return []
  const own = request.value.id
  return (requestsStore.conflictsByRequestId[own] ?? []).map(c => ({
    motivo: c.motivo,
    dias: c.dias.map(d => formatDateShort(d)).join(', '),
    others: c.solicitudIds
      .filter(id => id !== own)
      .map(id => requestsStore.requests.find(r => r.id === id))
      .filter((r): r is NonNullable<typeof r> => !!r)
  }))
})

const paidPercent = computed(() => {
  if (!payment.value || payment.value.total <= 0) return 0
  return Math.min(100, Math.round((payment.value.totalPaid / payment.value.total) * 100))
})

const phoneIsUsable = computed(() => !!request.value && hasUsablePhone(request.value.clientPhone))
const whatsappMessage = computed(() => {
  if (!request.value) return ''
  return `Hola ${request.value.clientName}, te escribimos de Los Troncos de Repil por tu solicitud ${request.value.requestCode}.`
})

// Estado de los formularios internos
const confirmingReject = ref(false)
const isEditing = ref(false)
const canEdit = computed(() => !!request.value && canEditRequest(request.value))
const paymentAmount = ref<number | null>(null)
const paymentMethod = ref<PaymentMethod>('transferencia')
const paymentDate = ref(todayISO())
const paymentNotes = ref('')
const paymentError = ref('')

watch(() => props.requestId, () => {
  cruceId.value = null
  confirmingReject.value = false
  confirmingCancel.value = false
  sinAbonoId.value = null
  isEditing.value = false
  paymentAmount.value = null
  paymentMethod.value = 'transferencia'
  paymentDate.value = todayISO()
  paymentNotes.value = ''
  paymentError.value = ''
})

// Si la solicitud se cruza con otras, se abre el diálogo para elegir cuál confirmar (SCRUM-262)
const cruceId = ref<string | null>(null)

// Si falta abono, primero se avisa (SCRUM-264); el admin decide si confirma igual
const sinAbonoId = ref<string | null>(null)

function approve() {
  if (!request.value) return
  if (payment.value && payment.value.depositPending > 0) {
    sinAbonoId.value = request.value.id
    return
  }
  continueApproval()
}

async function continueApproval() {
  sinAbonoId.value = null
  if (!request.value) return
  if (requestsStore.crossedRequestsFor(request.value.id).length > 0) {
    cruceId.value = request.value.id
    return
  }
  await requestsStore.confirmRequest(request.value.id)
  emit('close')
}

function reject() {
  if (!request.value) return
  requestsStore.rejectRequest(request.value.id)
  confirmingReject.value = false
  emit('close')
}

function fillPendingDeposit() {
  if (!payment.value) return
  paymentAmount.value = payment.value.depositPending > 0 ? payment.value.depositPending : payment.value.balance
}

function submitPayment() {
  if (!request.value) return
  const result = requestsStore.registerPayment(request.value.id, {
    amount: Number(paymentAmount.value),
    method: paymentMethod.value,
    paidOn: paymentDate.value,
    notes: paymentNotes.value
  })
  if (!result.ok) {
    paymentError.value = result.message || 'No se pudo registrar el pago.'
    return
  }
  paymentError.value = ''
  paymentAmount.value = null
  paymentNotes.value = ''
}

const statusClass = computed(() => {
  switch (request.value?.status) {
    case 'confirmed': return 'bg-status-success text-white'
    case 'rejected': return 'bg-status-danger text-white'
    case 'cancelled': return 'bg-gray-600 text-white'
    default: return 'bg-amber-200 text-amber-950 border border-amber-500'
  }
})

// "Falta" cambia de color según qué tan avanzado está el pago.
const missingClass = computed(() => {
  if (!payment.value || payment.value.balance === 0) return 'text-status-success'
  return payment.value.state === 'sin_abono' ? 'text-status-danger' : 'text-amber-900'
})

const overdue = computed(() => !!request.value && isDepositOverdue(request.value))
const confirmingCancel = ref(false)

// Plazo vigente para abonar (pendiente, con abono pendiente y sin vencer)
const dueText = computed(() => {
  const r = request.value
  if (!r || r.status !== 'pending' || !r.depositDueAt || overdue.value || !payment.value || payment.value.depositPending <= 0) return ''
  return `El cliente tiene plazo para abonar hasta el ${formatDateTime(r.depositDueAt)}.`
})

function waitForDeposit() {
  if (!request.value) return
  requestsStore.extendDepositDeadline(request.value.id)
}

async function cancelOverdue() {
  if (!request.value) return
  await requestsStore.cancelOverdueRequest(request.value.id)
  confirmingCancel.value = false
  emit('close')
}

const depositMessage = computed(() => {
  const p = payment.value
  if (!p) return ''
  if (p.state === 'sin_abono_exigido') {
    return request.value?.type === 'piscina'
      ? 'La piscina no exige abono: queda confirmada al enviarse.'
      : 'Esta reserva no exige abono (cliente Institución). Se cobra el total después.'
  }
  if (p.state === 'pagado_total') return 'La reserva está pagada por completo.'
  if (request.value && isConfirmedWithoutDeposit(request.value)) {
    return `Confirmada sin el abono completo: faltan ${formatCLP(p.depositPending)} del abono exigido de ${formatCLP(p.depositRequired)}.`
  }
  if (request.value?.status === 'pending' && p.depositRequired > 0 && p.depositPending === 0) {
    return `Abono recibido (${formatCLP(p.totalPaid)}). Falta que apruebes la solicitud.`
  }
  if (p.depositPending > 0) return `Faltan ${formatCLP(p.depositPending)} para completar el abono exigido de ${formatCLP(p.depositRequired)}.`
  return `El abono exigido de ${formatCLP(p.depositRequired)} ya está cubierto. Queda un saldo de ${formatCLP(p.balance)}.`
})

const depositMessageClass = computed(() => {
  const p = payment.value
  if (!p) return ''
  if (p.state === 'sin_abono_exigido' || p.state === 'pagado_total' || p.depositPending === 0) return 'bg-emerald-50 border-status-success text-emerald-950'
  return p.state === 'sin_abono' ? 'bg-rose-50 border-status-danger text-rose-950' : 'bg-amber-50 border-amber-500 text-amber-950'
})
useBloqueoScroll(computed(() => !!request.value))
</script>

<template>
  <div
    v-if="request && view && payment"
    class="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="`Detalle de la solicitud ${request.requestCode}`"
  >
    <div class="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full border-2 border-gray-500 shadow-2xl max-h-[92dvh] flex flex-col">
      <!-- Encabezado -->
      <div class="flex items-start justify-between gap-3 p-4 border-b-2 border-gray-300">
        <div class="min-w-0">
          <p class="text-sm font-black text-gray-700">{{ view.serviceLabel }} · Solicitud {{ request.requestCode }}</p>
          <h2 class="text-2xl font-black text-brand-dark leading-tight">{{ request.clientName }}</h2>
          <p class="text-sm font-bold text-gray-700">Recibida el {{ formatDateTime(request.createdAt) }}</p>
        </div>
        <button type="button" @click="emit('close')" aria-label="Cerrar detalle" class="p-2 rounded-full hover:bg-gray-100 text-gray-800 touch-target shrink-0">
          <X class="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      <div class="overflow-y-auto p-4 space-y-5">
        <AdminRequestEditForm
          v-if="isEditing"
          :request="request"
          @saved="isEditing = false"
          @cancel="isEditing = false"
        />

        <template v-else>
        <div>
          <span :class="['inline-block px-4 py-1.5 rounded-full text-base font-black', statusClass]">{{ view.statusLabel }}</span>
        </div>

        <!-- Se cruza con otras solicitudes -->
        <section v-if="conflicts.length > 0" class="space-y-2 bg-rose-50 border-2 border-status-danger rounded-2xl p-3">
          <h3 class="text-base font-black text-rose-950 flex items-center gap-1.5">
            <AlertTriangle class="w-5 h-5 stroke-[2.5]" aria-hidden="true" /> Se cruza con
          </h3>
          <div v-for="(conflict, index) in conflicts" :key="index" class="space-y-1.5">
            <p class="text-sm font-bold text-rose-950">{{ conflict.motivo }}. Días: {{ conflict.dias }}.</p>
            <button
              v-for="other in conflict.others"
              :key="other.id"
              type="button"
              @click="emit('open-request', other.id)"
              class="w-full text-left bg-white border-2 border-rose-300 rounded-xl px-3 py-2 touch-target"
            >
              <span class="block text-base font-black text-brand-dark">{{ other.clientName }}</span>
              <span class="block text-sm font-bold text-gray-700">{{ other.requestCode }} · {{ other.guestsCount }} personas · Toca para ver el detalle</span>
            </button>
          </div>
          <p class="text-sm font-bold text-rose-950">No se rechaza nada solo: decide tú cuál aprobar.</p>
        </section>

        <!-- Fechas -->
        <section class="bg-brand-dark text-white rounded-2xl p-4 space-y-3">
          <h3 class="flex items-center gap-2 text-lg font-black">
            <Calendar class="w-5 h-5 text-emerald-200 stroke-[2.5]" aria-hidden="true" /> {{ view.stayTitle }}
          </h3>
          <dl :class="['grid gap-2', view.stayDates.length > 1 ? 'grid-cols-2' : 'grid-cols-1']">
            <div v-for="row in view.stayDates" :key="row.label" class="bg-white/15 rounded-xl p-3">
              <dt class="text-sm font-bold text-emerald-100">{{ row.label }}</dt>
              <dd class="text-xl font-black leading-tight">{{ row.value }}</dd>
              <dd v-if="row.hint" class="text-sm font-bold text-emerald-100 mt-0.5">{{ row.hint }}</dd>
            </div>
          </dl>
          <p v-if="view.staySummary" class="border-t border-white/30 pt-3 flex items-baseline justify-between text-base">
            <span class="font-bold text-emerald-100">{{ view.staySummary.label }}</span>
            <span class="text-xl font-black">{{ view.staySummary.value }}</span>
          </p>
        </section>

        <!-- Qué reservó -->
        <section class="space-y-2">
          <h3 class="text-base font-black text-brand-dark">Qué reservó</h3>
          <dl class="border-2 border-gray-300 rounded-2xl divide-y divide-gray-300">
            <div v-for="row in view.serviceRows" :key="row.label" class="flex justify-between gap-3 px-3 py-2.5">
              <dt class="text-sm font-bold text-gray-700">{{ row.label }}</dt>
              <dd class="text-base font-black text-brand-dark text-right">{{ row.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- Pedido del restaurante -->
        <section v-if="view.meals.length > 0" class="space-y-2">
          <h3 class="text-base font-black text-brand-dark flex items-center gap-1.5">
            <Utensils class="w-5 h-5 text-brand-accent stroke-[2.5]" aria-hidden="true" /> Pedido
          </h3>
          <div v-for="group in view.meals" :key="group.key" class="border-2 border-gray-300 rounded-2xl overflow-hidden">
            <div class="bg-gray-100 px-3 py-2 flex justify-between items-center border-b-2 border-gray-300">
              <span class="text-base font-black text-brand-dark">{{ group.label }}</span>
              <span v-if="group.time" class="text-sm font-black text-brand-dark">{{ group.time }}</span>
            </div>
            <ul class="divide-y divide-gray-200">
              <li v-for="item in group.items" :key="item.name" class="px-3 py-2.5 flex justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-base font-black text-brand-dark">{{ item.quantity }} × {{ item.name }}</p>
                  <p v-if="item.sidesText" class="text-sm font-bold text-gray-700">{{ item.sidesText }}</p>
                </div>
                <span class="text-base font-black text-gray-800 shrink-0">{{ item.subtotal }}</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Contacto -->
        <section class="space-y-2">
          <h3 class="text-base font-black text-brand-dark flex items-center gap-1.5">
            <User class="w-5 h-5 text-brand-accent stroke-[2.5]" aria-hidden="true" /> Contacto
          </h3>
          <div class="border-2 border-gray-300 rounded-2xl p-3 space-y-3">
            <div class="space-y-1.5">
              <p class="flex items-center gap-2 text-base font-black text-brand-dark">
                <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" aria-hidden="true" /> {{ request.clientPhone }}
              </p>
              <p v-if="request.clientEmail" class="flex items-center gap-2 text-base font-black text-brand-dark break-all">
                <Mail class="w-4 h-4 text-brand-accent stroke-[2.5] shrink-0" aria-hidden="true" /> {{ request.clientEmail }}
              </p>
              <p v-else class="text-sm font-bold text-gray-700">El cliente no dejó correo.</p>
            </div>

            <p v-if="!phoneIsUsable" class="flex items-start gap-1.5 text-sm font-black text-amber-950 bg-amber-100 border border-amber-500 rounded-xl p-2">
              <AlertTriangle class="w-4 h-4 shrink-0 stroke-[2.5] mt-0.5" aria-hidden="true" />
              El teléfono parece incompleto. Revísalo antes de llamar.
            </p>

            <div class="grid grid-cols-3 gap-2">
              <a
                :href="phoneIsUsable ? buildTelUrl(request.clientPhone) : undefined"
                :class="['py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1 border-2 touch-target', phoneIsUsable ? 'bg-white border-brand-dark text-brand-dark' : 'bg-gray-100 border-gray-300 text-gray-600 pointer-events-none']"
              >
                <Phone class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> Llamar
              </a>
              <a
                :href="phoneIsUsable ? buildWhatsappUrl(request.clientPhone, whatsappMessage) : undefined"
                target="_blank"
                rel="noopener"
                :class="['py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1 border-2 touch-target', phoneIsUsable ? 'bg-status-success border-status-success text-white' : 'bg-gray-100 border-gray-300 text-gray-600 pointer-events-none']"
              >
                <MessageCircle class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> WhatsApp
              </a>
              <a
                :href="request.clientEmail ? buildMailtoUrl(request.clientEmail, `Tu solicitud ${request.requestCode} - Los Troncos de Repil`) : undefined"
                :class="['py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1 border-2 touch-target', request.clientEmail ? 'bg-white border-brand-dark text-brand-dark' : 'bg-gray-100 border-gray-300 text-gray-600 pointer-events-none']"
              >
                <Mail class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> Correo
              </a>
            </div>
          </div>
        </section>

        <!-- Comentarios -->
        <section v-if="request.details?.comments" class="space-y-2">
          <h3 class="text-base font-black text-brand-dark flex items-center gap-1.5">
            <FileText class="w-5 h-5 text-brand-accent stroke-[2.5]" aria-hidden="true" /> Comentarios del cliente
          </h3>
          <p class="text-base font-bold bg-amber-50 p-3 rounded-xl border-2 border-amber-500 text-amber-950 whitespace-pre-line">{{ request.details.comments }}</p>
        </section>

        <!-- Costo de la reserva -->
        <section class="space-y-2">
          <h3 class="text-base font-black text-brand-dark flex items-center gap-1.5">
            <Receipt class="w-5 h-5 text-brand-accent stroke-[2.5]" aria-hidden="true" /> Costo de la reserva
          </h3>
          <dl class="border-2 border-gray-300 rounded-2xl divide-y divide-gray-300">
            <div v-for="(row, index) in view.priceRows" :key="row.label" :class="['flex justify-between px-3 py-2.5', index === view.priceRows.length - 1 ? 'bg-gray-100' : '']">
              <dt :class="['text-base', index === view.priceRows.length - 1 ? 'font-black text-brand-dark' : 'font-bold text-gray-700']">{{ row.label }}</dt>
              <dd :class="['text-base font-black', index === view.priceRows.length - 1 ? 'text-brand-dark text-lg' : 'text-gray-800']">{{ row.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- Pagos -->
        <section class="space-y-3 border-t-4 border-brand-dark pt-4">
          <h3 class="text-lg font-black text-brand-dark flex items-center gap-1.5">
            <CreditCard class="w-5 h-5 text-brand-accent stroke-[2.5]" aria-hidden="true" /> Pagos
          </h3>

          <!-- Total, pagado y falta -->
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-gray-100 border-2 border-gray-300 rounded-xl p-2.5">
              <span class="text-sm font-bold text-gray-700 block">Total</span>
              <span class="text-lg font-black text-brand-dark">{{ formatCLP(payment.total) }}</span>
            </div>
            <div class="bg-emerald-50 border-2 border-status-success rounded-xl p-2.5">
              <span class="text-sm font-bold text-emerald-950 block">Pagado</span>
              <span class="text-lg font-black text-status-success">{{ formatCLP(payment.totalPaid) }}</span>
            </div>
            <div class="bg-white border-2 border-gray-500 rounded-xl p-2.5">
              <span class="text-sm font-bold text-gray-800 block">Falta</span>
              <span :class="['text-lg font-black', missingClass]">{{ formatCLP(payment.balance) }}</span>
            </div>
          </div>

          <div
            class="h-4 rounded-full bg-gray-200 overflow-hidden"
            role="progressbar"
            :aria-valuenow="paidPercent"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`Pagado ${paidPercent}% del total`"
          >
            <div class="h-full bg-status-success" :style="{ width: paidPercent + '%' }"></div>
          </div>

          <p :class="['text-base font-black border-2 rounded-xl p-3', depositMessageClass]">{{ depositMessage }}</p>
          <p v-if="dueText" class="text-base font-black bg-amber-50 border-2 border-amber-500 text-amber-950 rounded-xl p-3">{{ dueText }}</p>

          <!-- Abono vencido: el admin decide; la reserva nunca se libera sola -->
          <div v-if="overdue" class="border-2 border-status-danger bg-rose-50 rounded-2xl p-3 space-y-2">
            <p class="text-base font-black text-rose-950 flex items-start gap-1.5">
              <AlertTriangle class="w-5 h-5 stroke-[2.5] shrink-0 mt-0.5" aria-hidden="true" />
              Abono vencido: el plazo terminó el {{ formatDateTime(request.depositDueAt!) }} y falta el abono. Puedes contactar al cliente (en Contacto, más arriba), darle más plazo o cancelar la solicitud.
            </p>
            <div v-if="!confirmingCancel" class="grid grid-cols-2 gap-2">
              <BaseButton variant="outline" @click="waitForDeposit">Esperar {{ settingsStore.depositDeadlineHours }} h más</BaseButton>
              <BaseButton variant="outline" class="!border-status-danger !text-status-danger" @click="confirmingCancel = true">Cancelar solicitud</BaseButton>
            </div>
            <div v-else class="space-y-2">
              <p class="text-base font-black text-rose-950">¿Cancelar la solicitud de {{ request.clientName }}? Queda en "Cancelada" y el cliente tendrá que volver a solicitarla.</p>
              <div class="grid grid-cols-2 gap-2">
                <BaseButton variant="danger" @click="cancelOverdue">Sí, cancelar</BaseButton>
                <BaseButton variant="outline" @click="confirmingCancel = false">No, volver</BaseButton>
              </div>
            </div>
          </div>

          <!-- Pagos recibidos -->
          <div class="space-y-1.5">
            <h4 class="text-base font-black text-brand-dark">Pagos recibidos ({{ request.payments.length }})</h4>
            <ul v-if="request.payments.length > 0" class="border-2 border-gray-300 rounded-2xl divide-y divide-gray-200">
              <li v-for="p in request.payments" :key="p.id" class="px-3 py-2.5 flex justify-between gap-3">
                <div>
                  <p class="text-base font-black text-brand-dark">{{ PAYMENT_METHOD_LABELS[p.method] }} · {{ formatDateShort(p.paidOn) }}</p>
                  <p v-if="p.notes" class="text-sm font-bold text-gray-700">{{ p.notes }}</p>
                </div>
                <span class="text-base font-black text-status-success shrink-0">{{ formatCLP(p.amount) }}</span>
              </li>
            </ul>
            <p v-else class="text-base font-bold text-gray-700 border-2 border-dashed border-gray-400 rounded-2xl p-3">Todavía no se registra ningún pago.</p>
          </div>

          <!-- Registrar pago -->
          <form v-if="payment.balance > 0" @submit.prevent="submitPayment" class="border-2 border-brand-dark rounded-2xl p-3 space-y-3">
            <h4 class="text-base font-black text-brand-dark">Registrar un pago recibido</h4>
            <div class="grid grid-cols-2 gap-2">
              <label class="space-y-1 text-sm font-black text-gray-800">
                Monto (CLP)
                <input v-model.number="paymentAmount" type="number" inputmode="numeric" min="1" class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-black text-base" />
              </label>
              <label class="space-y-1 text-sm font-black text-gray-800">
                Medio de pago
                <select v-model="paymentMethod" class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-black text-base">
                  <option v-for="(label, key) in PAYMENT_METHOD_LABELS" :key="key" :value="key">{{ label }}</option>
                </select>
              </label>
            </div>
            <label class="space-y-1 text-sm font-black text-gray-800 block">
              Fecha en que se recibió
              <input v-model="paymentDate" type="date" class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-black text-base" />
            </label>
            <label class="space-y-1 text-sm font-black text-gray-800 block">
              Nota (opcional)
              <input v-model="paymentNotes" type="text" maxlength="120" placeholder="Ej.: comprobante enviado por WhatsApp" class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-bold text-base" />
            </label>
            <button type="button" @click="fillPendingDeposit" class="text-sm font-black text-brand-accent underline">
              Completar con {{ payment.depositPending > 0 ? 'el abono pendiente' : 'el saldo pendiente' }}
              ({{ formatCLP(payment.depositPending > 0 ? payment.depositPending : payment.balance) }})
            </button>
            <p v-if="paymentError" class="text-sm font-black text-rose-950 bg-rose-50 border-2 border-status-danger rounded-xl p-2">{{ paymentError }}</p>
            <BaseButton type="submit" variant="primary" fullWidth :disabled="!paymentAmount || paymentAmount <= 0">
              <CreditCard class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" /> Guardar pago
            </BaseButton>
          </form>
        </section>
        </template>
      </div>

      <!-- Acciones -->
      <div v-if="!isEditing" class="p-4 border-t-2 border-gray-300 space-y-2 bg-white rounded-b-3xl">
        <BaseButton v-if="canEdit && !confirmingReject" variant="outline" fullWidth @click="isEditing = true">
          <Pencil class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" /> Modificar solicitud
        </BaseButton>
        <template v-if="isPending">
          <div v-if="!confirmingReject" class="grid grid-cols-2 gap-2">
            <BaseButton variant="success" @click="approve">
              <Check class="w-5 h-5 mr-1 stroke-[3]" aria-hidden="true" /> Aprobar
            </BaseButton>
            <BaseButton variant="outline" class="!border-status-danger !text-status-danger" @click="confirmingReject = true">
              <X class="w-5 h-5 mr-1 stroke-[3]" aria-hidden="true" /> Rechazar
            </BaseButton>
          </div>
          <div v-else class="border-2 border-status-danger bg-rose-50 rounded-2xl p-3 space-y-2">
            <p class="text-base font-black text-rose-950">¿Rechazar la solicitud de {{ request.clientName }}? El cliente tendrá que volver a solicitarla.</p>
            <div class="grid grid-cols-2 gap-2">
              <BaseButton variant="danger" @click="reject">Sí, rechazar</BaseButton>
              <BaseButton variant="outline" @click="confirmingReject = false">No, volver</BaseButton>
            </div>
          </div>
        </template>
        <BaseButton variant="outline" fullWidth @click="emit('close')">Cerrar</BaseButton>
      </div>
    </div>

    <AdminConfirmarSinAbonoDialog :request-id="sinAbonoId" @confirm="continueApproval" @close="sinAbonoId = null" />
    <AdminConfirmarCruceDialog :request-id="cruceId" @close="cruceId = null" />
  </div>
</template>
