<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  Calendar, Check, CreditCard, FileText, Mail, MessageCircle, Phone, User, Utensils, X, AlertTriangle
} from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { buildMailtoUrl, buildTelUrl, buildWhatsappUrl, hasUsablePhone } from '../../lib/contactLinks'
import { formatDateShort, formatDateTime, todayISO } from '../../lib/dates'
import { formatCLP } from '../../lib/format'
import { PAYMENT_METHOD_LABELS, getPaymentSummary } from '../../services/payments'
import { describeRequest } from '../../services/requests'
import type { PaymentMethod } from '../../types/domain'

const props = defineProps<{
  requestId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const requestsStore = useRequestsStore()

// La solicitud se lee siempre del store, así el detalle se actualiza solo al aprobar o registrar pagos.
const request = computed(() => requestsStore.requests.find(r => r.id === props.requestId) ?? null)
const view = computed(() => (request.value ? describeRequest(request.value) : null))
const payment = computed(() => (request.value ? getPaymentSummary(request.value) : null))
const isPending = computed(() => request.value?.status === 'pending')

const phoneIsUsable = computed(() => !!request.value && hasUsablePhone(request.value.clientPhone))
const whatsappMessage = computed(() => {
  if (!request.value) return ''
  return `Hola ${request.value.clientName}, te escribimos de Los Troncos de Repil por tu solicitud ${request.value.requestCode}.`
})

// Estado de los formularios internos
const confirmingReject = ref(false)
const paymentAmount = ref<number | null>(null)
const paymentMethod = ref<PaymentMethod>('transferencia')
const paymentDate = ref(todayISO())
const paymentNotes = ref('')
const paymentError = ref('')

watch(() => props.requestId, () => {
  confirmingReject.value = false
  paymentAmount.value = null
  paymentMethod.value = 'transferencia'
  paymentDate.value = todayISO()
  paymentNotes.value = ''
  paymentError.value = ''
})

function approve() {
  if (request.value) requestsStore.confirmRequest(request.value.id)
}

function reject() {
  if (!request.value) return
  requestsStore.rejectRequest(request.value.id)
  confirmingReject.value = false
}

function fillPendingDeposit() {
  if (payment.value && payment.value.depositPending > 0) {
    paymentAmount.value = payment.value.depositPending
  } else if (payment.value) {
    paymentAmount.value = payment.value.balance
  }
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

const paymentToneClass = computed(() => {
  if (payment.value?.tone === 'emerald') return 'bg-emerald-100 text-emerald-900 border-emerald-300'
  if (payment.value?.tone === 'amber') return 'bg-amber-100 text-amber-900 border-amber-300'
  return 'bg-rose-100 text-rose-900 border-rose-300'
})

const statusClass = computed(() => {
  switch (request.value?.status) {
    case 'confirmed': return 'bg-emerald-600 text-white'
    case 'rejected': return 'bg-rose-600 text-white'
    case 'cancelled': return 'bg-gray-500 text-white'
    default: return 'bg-amber-400 text-amber-950'
  }
})
</script>

<template>
  <div
    v-if="request && view && payment"
    class="fixed inset-0 z-50 bg-brand-dark/60 flex items-end sm:items-center justify-center sm:p-4"
    role="dialog"
    aria-modal="true"
    :aria-label="`Detalle de la solicitud ${request.requestCode}`"
  >
    <div class="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full border-2 border-brand-border shadow-2xl max-h-[92vh] flex flex-col">
      <!-- Encabezado -->
      <div class="flex items-start justify-between gap-3 p-4 border-b border-gray-200">
        <div class="min-w-0">
          <span class="text-xs font-black text-brand-accent uppercase block">{{ view.serviceLabel }} · Solicitud {{ request.requestCode }}</span>
          <h2 class="text-xl font-black text-brand-dark leading-tight truncate">{{ request.clientName }}</h2>
          <span class="text-xs font-bold text-gray-600">Recibida el {{ formatDateTime(request.createdAt) }}</span>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span :class="['px-3 py-1 rounded-full text-xs uppercase font-black', statusClass]">{{ view.statusLabel }}</span>
          <button type="button" @click="emit('close')" aria-label="Cerrar detalle" class="p-2 rounded-full hover:bg-gray-100 text-gray-600 touch-target">
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <div class="overflow-y-auto p-4 space-y-4">
        <!-- Cuándo -->
        <section class="bg-brand-dark text-white rounded-2xl p-4 space-y-3">
          <div class="flex items-start gap-2">
            <Calendar class="w-5 h-5 text-emerald-300 stroke-[2.5] shrink-0 mt-0.5" />
            <p class="text-base font-black leading-snug">{{ view.stayHeadline }}</p>
          </div>
          <dl class="grid grid-cols-2 gap-2">
            <div v-for="row in view.stayRows" :key="row.label" class="bg-white/10 rounded-xl p-2.5">
              <dt class="text-xs font-bold text-emerald-200">{{ row.label }}</dt>
              <dd class="text-sm font-black">{{ row.value }}</dd>
              <dd v-if="row.hint" class="text-xs font-bold text-emerald-100">{{ row.hint }}</dd>
            </div>
          </dl>
        </section>

        <!-- Qué reservó -->
        <section class="space-y-2">
          <h3 class="text-sm font-black text-brand-dark uppercase tracking-wide">Qué reservó</h3>
          <dl class="bg-brand-light border border-brand-border rounded-2xl divide-y divide-brand-border">
            <div v-for="row in view.serviceRows" :key="row.label" class="flex justify-between gap-3 px-3 py-2.5 text-sm">
              <dt class="font-bold text-gray-600">{{ row.label }}</dt>
              <dd class="font-black text-brand-dark text-right">{{ row.value }}</dd>
            </div>
          </dl>
        </section>

        <!-- Pedido del restaurante -->
        <section v-if="view.meals.length > 0" class="space-y-2">
          <h3 class="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
            <Utensils class="w-4 h-4 text-brand-accent stroke-[2.5]" /> Pedido
          </h3>
          <div v-for="group in view.meals" :key="group.key" class="border-2 border-brand-border rounded-2xl overflow-hidden">
            <div class="bg-brand-light px-3 py-2 flex justify-between items-center border-b border-brand-border">
              <span class="text-sm font-black text-brand-dark">{{ group.label }}</span>
              <span v-if="group.time" class="text-xs font-black text-brand-accent">{{ group.time }}</span>
            </div>
            <ul class="divide-y divide-gray-100">
              <li v-for="item in group.items" :key="item.name" class="px-3 py-2.5 flex justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-black text-brand-dark">{{ item.quantity }} × {{ item.name }}</p>
                  <p v-if="item.sidesText" class="text-xs font-bold text-gray-600">{{ item.sidesText }}</p>
                </div>
                <span class="text-sm font-black text-gray-700 shrink-0">{{ item.subtotal }}</span>
              </li>
            </ul>
          </div>
        </section>

        <!-- Contacto -->
        <section class="space-y-2">
          <h3 class="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
            <User class="w-4 h-4 text-brand-accent stroke-[2.5]" /> Contacto
          </h3>
          <div class="bg-brand-light border border-brand-border rounded-2xl p-3 space-y-3">
            <div class="text-sm font-bold text-gray-700 space-y-1">
              <p class="flex items-center gap-2"><Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" /> <span class="font-black text-brand-dark">{{ request.clientPhone }}</span></p>
              <p v-if="request.clientEmail" class="flex items-center gap-2"><Mail class="w-4 h-4 text-brand-accent stroke-[2.5]" /> <span class="font-black text-brand-dark break-all">{{ request.clientEmail }}</span></p>
              <p v-else class="text-gray-600">El cliente no dejó correo.</p>
            </div>

            <p v-if="!phoneIsUsable" class="flex items-start gap-1.5 text-xs font-black text-amber-900 bg-amber-100 border border-amber-300 rounded-xl p-2">
              <AlertTriangle class="w-4 h-4 shrink-0 stroke-[2.5]" />
              El teléfono parece incompleto. Revisa el número antes de llamar.
            </p>

            <div class="grid grid-cols-3 gap-2">
              <a
                :href="phoneIsUsable ? buildTelUrl(request.clientPhone) : undefined"
                :class="['py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1 border-2 touch-target', phoneIsUsable ? 'bg-white border-brand-dark text-brand-dark' : 'bg-gray-100 border-gray-200 text-gray-400 pointer-events-none']"
              >
                <Phone class="w-4 h-4 stroke-[2.5]" /> Llamar
              </a>
              <a
                :href="phoneIsUsable ? buildWhatsappUrl(request.clientPhone, whatsappMessage) : undefined"
                target="_blank"
                rel="noopener"
                :class="['py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1 border-2 touch-target', phoneIsUsable ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-400 pointer-events-none']"
              >
                <MessageCircle class="w-4 h-4 stroke-[2.5]" /> WhatsApp
              </a>
              <a
                :href="request.clientEmail ? buildMailtoUrl(request.clientEmail, `Tu solicitud ${request.requestCode} - Los Troncos de Repil`) : undefined"
                :class="['py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1 border-2 touch-target', request.clientEmail ? 'bg-white border-brand-dark text-brand-dark' : 'bg-gray-100 border-gray-200 text-gray-400 pointer-events-none']"
              >
                <Mail class="w-4 h-4 stroke-[2.5]" /> Correo
              </a>
            </div>
          </div>
        </section>

        <!-- Comentarios -->
        <section v-if="request.details?.comments" class="space-y-2">
          <h3 class="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
            <FileText class="w-4 h-4 text-brand-accent stroke-[2.5]" /> Comentarios del cliente
          </h3>
          <p class="text-sm font-bold bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950 whitespace-pre-line">{{ request.details.comments }}</p>
        </section>

        <!-- Dinero -->
        <section class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-black text-brand-dark uppercase tracking-wide flex items-center gap-1.5">
              <CreditCard class="w-4 h-4 text-brand-accent stroke-[2.5]" /> Pagos
            </h3>
            <span :class="['px-3 py-1 rounded-full text-xs font-black border', paymentToneClass]">{{ payment.label }}</span>
          </div>

          <dl class="bg-brand-light border border-brand-border rounded-2xl divide-y divide-brand-border text-sm">
            <div v-for="row in view.priceRows" :key="row.label" class="flex justify-between px-3 py-2">
              <dt class="font-bold text-gray-600">{{ row.label }}</dt>
              <dd class="font-black text-brand-dark">{{ row.value }}</dd>
            </div>
            <div class="flex justify-between px-3 py-2">
              <dt class="font-bold text-gray-600">Abono exigido</dt>
              <dd class="font-black text-brand-dark">{{ formatCLP(payment.depositRequired) }}</dd>
            </div>
            <div class="flex justify-between px-3 py-2">
              <dt class="font-bold text-gray-600">Pagado hasta ahora</dt>
              <dd class="font-black text-emerald-800">{{ formatCLP(payment.totalPaid) }}</dd>
            </div>
            <div class="flex justify-between px-3 py-2">
              <dt class="font-black text-brand-dark">Saldo pendiente</dt>
              <dd :class="['font-black', payment.balance > 0 ? 'text-amber-800' : 'text-emerald-800']">{{ formatCLP(payment.balance) }}</dd>
            </div>
          </dl>

          <ul v-if="request.payments.length > 0" class="border-2 border-brand-border rounded-2xl divide-y divide-gray-100">
            <li v-for="p in request.payments" :key="p.id" class="px-3 py-2.5 flex justify-between gap-3 text-sm">
              <div>
                <p class="font-black text-brand-dark">{{ PAYMENT_METHOD_LABELS[p.method] }} · {{ formatDateShort(p.paidOn) }}</p>
                <p v-if="p.notes" class="text-xs font-bold text-gray-600">{{ p.notes }}</p>
              </div>
              <span class="font-black text-emerald-800 shrink-0">{{ formatCLP(p.amount) }}</span>
            </li>
          </ul>
          <p v-else class="text-sm font-bold text-gray-600">Todavía no se registra ningún pago.</p>

          <!-- Registrar pago -->
          <form v-if="payment.balance > 0" @submit.prevent="submitPayment" class="border-2 border-brand-border rounded-2xl p-3 space-y-2.5">
            <h4 class="text-sm font-black text-brand-dark">Registrar un pago recibido</h4>
            <div class="grid grid-cols-2 gap-2">
              <label class="space-y-1 text-xs font-black text-gray-700">
                Monto (CLP)
                <input v-model.number="paymentAmount" type="number" inputmode="numeric" min="1" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-base" />
              </label>
              <label class="space-y-1 text-xs font-black text-gray-700">
                Medio de pago
                <select v-model="paymentMethod" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-base">
                  <option v-for="(label, key) in PAYMENT_METHOD_LABELS" :key="key" :value="key">{{ label }}</option>
                </select>
              </label>
            </div>
            <label class="space-y-1 text-xs font-black text-gray-700 block">
              Fecha en que se recibió
              <input v-model="paymentDate" type="date" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-base" />
            </label>
            <label class="space-y-1 text-xs font-black text-gray-700 block">
              Nota (opcional)
              <input v-model="paymentNotes" type="text" maxlength="120" placeholder="Ej.: comprobante enviado por WhatsApp" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-base" />
            </label>
            <button type="button" @click="fillPendingDeposit" class="text-xs font-black text-brand-accent underline">
              Completar con {{ payment.depositPending > 0 ? 'el abono pendiente' : 'el saldo pendiente' }}
              ({{ formatCLP(payment.depositPending > 0 ? payment.depositPending : payment.balance) }})
            </button>
            <p v-if="paymentError" class="text-xs font-black text-rose-800 bg-rose-50 border border-rose-200 rounded-xl p-2">{{ paymentError }}</p>
            <BaseButton type="submit" variant="secondary" fullWidth :disabled="!paymentAmount || paymentAmount <= 0">
              <CreditCard class="w-4 h-4 mr-1.5 stroke-[2.5]" /> Guardar pago
            </BaseButton>
          </form>
        </section>
      </div>

      <!-- Acciones -->
      <div class="p-4 border-t border-gray-200 space-y-2 bg-white rounded-b-3xl">
        <template v-if="isPending">
          <p v-if="payment.state === 'sin_abono'" class="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-2">
            Aún no se registra el abono de {{ formatCLP(payment.depositRequired) }}. Puedes aprobar igual, o esperar la transferencia.
          </p>

          <div v-if="!confirmingReject" class="flex gap-2">
            <BaseButton variant="success" class="flex-1" @click="approve">
              <Check class="w-4 h-4 mr-1 stroke-[3]" /> Aprobar
            </BaseButton>
            <BaseButton variant="outline" class="flex-1" @click="confirmingReject = true">
              <X class="w-4 h-4 mr-1 stroke-[3]" /> Rechazar
            </BaseButton>
          </div>
          <div v-else class="border-2 border-rose-300 bg-rose-50 rounded-2xl p-3 space-y-2">
            <p class="text-sm font-black text-rose-900">¿Rechazar la solicitud de {{ request.clientName }}? El cliente tendrá que volver a solicitarla.</p>
            <div class="flex gap-2">
              <BaseButton variant="danger" class="flex-1" @click="reject">Sí, rechazar</BaseButton>
              <BaseButton variant="outline" class="flex-1" @click="confirmingReject = false">No, volver</BaseButton>
            </div>
          </div>
        </template>
        <BaseButton variant="outline" fullWidth @click="emit('close')">Cerrar</BaseButton>
      </div>
    </div>
  </div>
</template>
