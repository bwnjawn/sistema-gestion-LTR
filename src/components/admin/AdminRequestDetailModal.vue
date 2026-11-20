<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  AlertTriangle, ArrowRight, CalendarClock, Check, ChevronDown, CreditCard, Mail, MessageCircle, Pencil, Phone, X
} from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import HojaModal from '../ui/HojaModal.vue'
import PanelDetalle from '../ui/PanelDetalle.vue'
import AdminRequestEditForm from './AdminRequestEditForm.vue'
import AdminConfirmarCruceDialog from './AdminConfirmarCruceDialog.vue'
import AdminConfirmarSinAbonoDialog from './AdminConfirmarSinAbonoDialog.vue'
import AdminMoverFechaDialog from './AdminMoverFechaDialog.vue'
import AdminCancelarReservaDialog from './AdminCancelarReservaDialog.vue'
import EstadoSolicitud from './EstadoSolicitud.vue'
import AvisoCruceSolicitud from './AvisoCruceSolicitud.vue'
import EtiquetaSinSincronizar from './EtiquetaSinSincronizar.vue'
import CotizacionAcciones from './CotizacionAcciones.vue'
import { puedeCotizarse } from '../../services/cotizacion'
import { useRequestsStore } from '../../stores/requestsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { buildMailtoUrl, buildTelUrl, buildWhatsappUrl, hasUsablePhone } from '../../lib/contactLinks'
import { formatDateShort, formatDateTime, todayISO } from '../../lib/dates'
import { formatCLP } from '../../lib/format'
import { PAYMENT_METHOD_LABELS, getPaymentSummary, isConfirmedWithoutDeposit, isDepositOverdue } from '../../services/payments'
import { canEditRequest, describeRequest, puedeCancelarse } from '../../services/requests'
import { describirBloqueo } from '../../services/cruces'
import { partesDeFecha, resumirSolicitud } from '../../services/resumenSolicitud'
import { resumirCruce } from '../../services/resumenCruce'
import type { PaymentMethod } from '../../types/domain'

const props = defineProps<{
  requestId: string | null
  /** En PC se muestra dentro de la página, al lado de la lista, en vez de en una hoja (SCRUM-278). */
  enPanel?: boolean
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
// Lo que se le pasa a la hoja; el panel no recibe nada
const propsHoja = computed(() =>
  props.enPanel || !request.value
    ? {}
    : { abierto: true, ancho: 'amplio', titulo: `Detalle de la solicitud ${request.value.requestCode}`, sinRelleno: true, cerrarAlTocarFuera: !isEditing.value }
)
const payment = computed(() => (request.value ? getPaymentSummary(request.value) : null))
const isPending = computed(() => request.value?.status === 'pending')
// Una confirmada no se rechaza: se cancela, y eso libera sus fechas (SCRUM-284)
const puedeCancelar = computed(() => !!request.value && puedeCancelarse(request.value))
const cancelandoReserva = ref(false)

/** Al cerrar la hoja de cancelación: si ya quedó cancelada, el detalle también se cierra. */
function cerrarCancelacion() {
  cancelandoReserva.value = false
  if (request.value?.status === 'cancelled') emit('close')
}

// Pendiente cuya fecha ya ocupa una confirmada: no se aprueba, solo se mueve de fecha o se rechaza
const bloqueo = computed(() => (request.value ? describirBloqueo(requestsStore.porMoverPorId[request.value.id] ?? []) : ''))

// Solicitudes con las que se topa esta (SCRUM-60, SCRUM-287); la resolución es manual
const resumenCruce = computed(() => {
  if (!request.value) return null
  return resumirCruce({
    solicitud: request.value,
    solicitudes: requestsStore.requests,
    conflictos: requestsStore.conflictsByRequestId[request.value.id] ?? [],
    bloqueantes: requestsStore.porMoverPorId[request.value.id] ?? []
  })
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
// Hoja aparte para mover solo la fecha (el lápiz de arriba edita todo)
const moviendo = ref(false)
const canEdit = computed(() => !!request.value && canEditRequest(request.value))
const paymentAmount = ref<number | null>(null)
const paymentMethod = ref<PaymentMethod>('transferencia')
const paymentDate = ref(todayISO())
const paymentNotes = ref('')
const paymentError = ref('')
const guardandoPago = ref(false)

watch(() => props.requestId, () => {
  cruceId.value = null
  confirmingReject.value = false
  confirmingCancel.value = false
  cancelandoReserva.value = false
  sinAbonoId.value = null
  isEditing.value = false
  moviendo.value = false
  paymentAmount.value = null
  paymentMethod.value = 'transferencia'
  paymentDate.value = todayISO()
  paymentNotes.value = ''
  paymentError.value = ''
})

// Después de confirmar una solicitud que tenía otras encima, diálogo para avisarles (SCRUM-262, SCRUM-287)
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
  if (!request.value || bloqueo.value) return
  // El bloque de cruces de arriba ya mostró con qué se topa: se confirma directo (SCRUM-287).
  // Si había otras solicitudes encima, se abre el diálogo solo para avisarles o cambiarles la fecha.
  const id = request.value.id
  const habiaCruces = requestsStore.crossedRequestsFor(id).length > 0
  if (!(await requestsStore.confirmRequest(id))) return
  if (habiaCruces && requestsStore.crossedRequestsFor(id).length > 0) {
    cruceId.value = id
    return
  }
  emit('close')
}

/** Al cerrar el diálogo de avisos: si la reserva ya quedó confirmada, el detalle también se cierra. */
function cerrarCruce() {
  cruceId.value = null
  if (request.value?.status === 'confirmed') emit('close')
}

async function reject() {
  if (!request.value) return
  await requestsStore.rejectRequest(request.value.id)
  confirmingReject.value = false
  emit('close')
}

function fillPendingDeposit() {
  if (!payment.value) return
  paymentAmount.value = payment.value.depositPending > 0 ? payment.value.depositPending : payment.value.balance
}

async function submitPayment() {
  if (!request.value || guardandoPago.value) return
  guardandoPago.value = true
  const result = await requestsStore.registerPayment(request.value.id, {
    amount: Number(paymentAmount.value),
    method: paymentMethod.value,
    paidOn: paymentDate.value,
    notes: paymentNotes.value
  }).finally(() => { guardandoPago.value = false })
  if (!result.ok) {
    paymentError.value = result.message || 'No se pudo registrar el pago.'
    return
  }
  paymentError.value = ''
  paymentAmount.value = null
  paymentNotes.value = ''
}

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
  return `El cliente tiene plazo para abonar hasta el ${formatDateTime(r.depositDueAt)}`
})

async function waitForDeposit() {
  if (!request.value) return
  await requestsStore.extendDepositDeadline(request.value.id)
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
// Fechas en grande y resumen corto
const resumen = computed(() => resumirSolicitud(request.value as NonNullable<typeof request.value>))
const inicio = computed(() => partesDeFecha(resumen.value.inicio))
const fin = computed(() => (resumen.value.fin ? partesDeFecha(resumen.value.fin) : null))

// Clases compartidas de los botones de contacto, los campos y los resúmenes plegables
const claseContacto = 'py-3 px-1 rounded-xl text-base font-bold flex items-center justify-center gap-1.5 border-2 touch-target'
const claseContactoInactivo = 'bg-gray-100 border-gray-300 text-gray-600 pointer-events-none'
const claseCampo = 'w-full p-3 rounded-xl border-2 border-brand-border bg-white text-base font-normal'
const claseResumen = 'cursor-pointer list-none flex items-center justify-between gap-2 px-3 py-3 text-base font-bold text-brand-dark touch-target'

</script>

<template>
  <template v-if="request && view && payment">
    <component :is="enPanel ? PanelDetalle : HojaModal" v-bind="propsHoja" @cerrar="emit('close')">
      <!-- Encabezado: quién es, en qué estado está, y modificar / cerrar -->
      <template #cabecera>
      <div class="flex items-start gap-3 p-4 border-b-2 border-brand-border/60">
        <div class="min-w-0 flex-1">
          <span class="text-sm text-gray-600 block">{{ view.serviceLabel }} · {{ request.requestCode }}</span>
          <h2 class="text-xl font-bold text-gray-900 leading-tight break-words">{{ request.clientName }}</h2>
          <p class="flex items-center gap-2 mt-1 flex-wrap">
            <EstadoSolicitud :status="request.status" :por-mover="!!bloqueo" :en-conflicto="request.enConflicto" />
            <EtiquetaSinSincronizar :solicitud-id="request.id" />
            <span class="text-sm text-gray-600">Recibida el {{ formatDateTime(request.createdAt) }}</span>
          </p>
        </div>
        <button
          v-if="canEdit && !isEditing"
          type="button"
          @click="isEditing = true"
          aria-label="Modificar solicitud"
          title="Modificar solicitud"
          class="w-10 h-10 rounded-full bg-brand-light border-2 border-brand-border text-brand-dark active:scale-95 transition-transform flex items-center justify-center shrink-0"
        >
          <Pencil class="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
        </button>
        <button
          v-if="!enPanel"
          type="button"
          @click="emit('close')"
          aria-label="Cerrar detalle"
          class="w-10 h-10 rounded-full bg-brand-light border-2 border-brand-border text-brand-dark active:scale-95 transition-transform flex items-center justify-center shrink-0"
        >
          <X class="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>

      </template>

      <div class="p-4 space-y-4">
        <AdminRequestEditForm
          v-if="isEditing"
          :request="request"
          @saved="isEditing = false"
          @cancel="isEditing = false"
        />

        <div v-else :class="['space-y-4', enPanel ? '2xl:grid 2xl:grid-cols-2 2xl:gap-x-6 2xl:gap-y-4 2xl:space-y-0 2xl:items-start' : 'lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-4 lg:space-y-0 lg:items-start']">
          <!-- Se cruza con otras solicitudes: el aviso más importante va primero -->
          <AvisoCruceSolicitud
            v-if="resumenCruce"
            class="lg:col-span-2"
            :key="request.id"
            :resumen="resumenCruce"
            @open-request="id => emit('open-request', id)"
          />

          <!-- En PC, a la izquierda lo que reservó y quién es; a la derecha lo del dinero -->
          <div class="space-y-4">
          <!-- Fechas: llegada y salida en grande, como en un calendario -->
          <section class="space-y-2">
            <h3 class="text-base font-bold text-brand-dark">{{ view.stayTitle }}</h3>
            <div class="bg-brand-light border border-brand-border rounded-2xl p-3 space-y-2">
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-white border border-brand-border rounded-xl py-2 text-center">
                  <span class="text-sm text-gray-600 block">{{ resumen.esVisitaDeUnDia ? 'Día' : 'Llegada' }}</span>
                  <span class="text-3xl font-bold text-brand-dark leading-none block my-1">{{ inicio.dia }}</span>
                  <span class="text-sm font-bold text-gray-800 block">{{ inicio.semana }} · {{ inicio.mes }}</span>
                </div>
                <template v-if="!resumen.esVisitaDeUnDia && fin">
                  <ArrowRight class="w-5 h-5 text-gray-500 shrink-0" aria-hidden="true" />
                  <div class="flex-1 bg-white border border-brand-border rounded-xl py-2 text-center">
                    <span class="text-sm text-gray-600 block">Salida</span>
                    <span class="text-3xl font-bold text-brand-dark leading-none block my-1">{{ fin.dia }}</span>
                    <span class="text-sm font-bold text-gray-800 block">{{ fin.semana }} · {{ fin.mes }}</span>
                  </div>
                </template>
              </div>
              <p v-if="resumen.noches > 0" class="text-base text-gray-800 text-center">
                <span class="font-bold">{{ resumen.noches }} {{ resumen.noches === 1 ? 'noche' : 'noches' }}</span> · {{ resumen.personas }}
              </p>
              <p v-if="view.staySummary && resumen.noches === 0" class="text-base text-gray-800 text-center">
                {{ view.staySummary.label }}: <span class="font-bold">{{ view.staySummary.value }}</span>
              </p>
              <p v-for="row in view.stayDates.filter(r => r.hint)" :key="row.label" class="text-sm text-gray-600 text-center">
                {{ row.label }}: {{ row.hint }}
              </p>
            </div>
          </section>

          <!-- Qué reservó -->
          <section class="space-y-2">
            <h3 class="text-base font-bold text-brand-dark">Qué reservó</h3>
            <dl class="bg-brand-light border border-brand-border rounded-2xl divide-y divide-brand-border/50">
              <div v-for="row in view.serviceRows" :key="row.label" class="flex justify-between gap-3 px-3 py-2.5">
                <dt class="text-sm text-gray-600">{{ row.label }}</dt>
                <dd class="text-base font-bold text-brand-dark text-right">{{ row.value }}</dd>
              </div>
            </dl>
          </section>

          <!-- Pedido del restaurante -->
          <section v-if="view.meals.length > 0" class="space-y-2">
            <h3 class="text-base font-bold text-brand-dark">Pedido</h3>
            <div v-for="group in view.meals" :key="group.key" class="bg-brand-light border border-brand-border rounded-2xl overflow-hidden">
              <div class="px-3 py-2 flex justify-between items-center bg-[#c5d7be]/60 border-b border-brand-border">
                <span class="text-base font-bold text-brand-dark">{{ group.label }}</span>
                <span v-if="group.time" class="text-sm font-bold text-brand-dark">{{ group.time }}</span>
              </div>
              <ul class="divide-y divide-brand-border/50">
                <li v-for="item in group.items" :key="item.name" class="px-3 py-2 flex justify-between gap-3">
                  <div class="min-w-0">
                    <p class="text-base text-brand-dark">{{ item.quantity }} × {{ item.name }}</p>
                    <p v-if="item.sidesText" class="text-sm text-gray-600">{{ item.sidesText }}</p>
                  </div>
                  <span class="text-base text-gray-800 shrink-0">{{ item.subtotal }}</span>
                </li>
              </ul>
            </div>
          </section>

          <!-- Contacto -->
          <section class="space-y-2">
            <h3 class="text-base font-bold text-brand-dark">Contacto</h3>
            <div class="bg-brand-light border border-brand-border rounded-2xl p-3 space-y-3">
              <div class="space-y-1">
                <p class="flex items-center gap-2 text-base font-bold text-brand-dark">
                  <Phone class="w-5 h-5 text-brand-accent stroke-[2.5]" aria-hidden="true" /> {{ request.clientPhone }}
                </p>
                <p v-if="request.clientEmail" class="flex items-center gap-2 text-base text-brand-dark break-all">
                  <Mail class="w-5 h-5 text-brand-accent stroke-[2.5] shrink-0" aria-hidden="true" /> {{ request.clientEmail }}
                </p>
                <p v-else class="text-sm text-gray-600">El cliente no dejó correo.</p>
              </div>

              <p v-if="!phoneIsUsable" class="flex items-start gap-1.5 text-sm font-bold text-amber-950 bg-amber-50 border border-amber-500 rounded-xl p-2">
                <AlertTriangle class="w-4 h-4 shrink-0 stroke-[2.5]" aria-hidden="true" />
                El teléfono parece incompleto. Revísalo antes de llamar.
              </p>

              <div class="grid grid-cols-3 gap-2">
                <a
                  :href="phoneIsUsable ? buildTelUrl(request.clientPhone) : undefined"
                  :class="[claseContacto, phoneIsUsable ? 'bg-white border-brand-border text-brand-dark' : claseContactoInactivo]"
                >
                  <Phone class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" /> Llamar
                </a>
                <a
                  :href="phoneIsUsable ? buildWhatsappUrl(request.clientPhone, whatsappMessage) : undefined"
                  target="_blank"
                  rel="noopener"
                  :class="[claseContacto, phoneIsUsable ? 'bg-brand-dark border-brand-dark text-white' : claseContactoInactivo]"
                >
                  <MessageCircle class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" /> WhatsApp
                </a>
                <a
                  :href="request.clientEmail ? buildMailtoUrl(request.clientEmail, `Tu solicitud ${request.requestCode} - Los Troncos de Repil`) : undefined"
                  :class="[claseContacto, request.clientEmail ? 'bg-white border-brand-border text-brand-dark' : claseContactoInactivo]"
                >
                  <Mail class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" /> Correo
                </a>
              </div>
            </div>
          </section>

          </div>

          <div class="space-y-4">
          <!-- Cotización en PDF (SCRUM-71): solo de solicitudes vivas -->
          <CotizacionAcciones v-if="puedeCotizarse(request)" :request="request" />

          <!-- Comentarios -->
          <section v-if="request.details?.comments" class="space-y-2">
            <h3 class="text-base font-bold text-brand-dark">Comentarios del cliente</h3>
            <p class="text-base bg-amber-50 p-3 rounded-2xl border border-amber-500 text-amber-950 whitespace-pre-line">{{ request.details.comments }}</p>
          </section>

          <!-- Pagos: lo esencial a la vista; el desglose y el formulario, plegados -->
          <section class="space-y-2">
            <h3 class="text-base font-bold text-brand-dark">Pagos</h3>
            <div class="bg-brand-light border border-brand-border rounded-2xl p-3 space-y-3">
              <div class="flex items-end justify-between gap-3">
                <div>
                  <span class="text-sm text-gray-600 block">Total</span>
                  <span class="text-lg font-bold text-brand-dark">{{ formatCLP(payment.total) }}</span>
                </div>
                <div class="text-right">
                  <span class="text-sm text-gray-600 block">{{ payment.balance === 0 ? 'Pagado' : 'Falta pagar' }}</span>
                  <span :class="['text-lg font-bold', missingClass]">{{ formatCLP(payment.balance === 0 ? payment.totalPaid : payment.balance) }}</span>
                </div>
              </div>

              <div
                class="h-2 rounded-full bg-gray-200 overflow-hidden"
                role="progressbar"
                :aria-valuenow="paidPercent"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="`Pagado ${paidPercent}% del total`"
              >
                <div class="h-full bg-brand-dark" :style="{ width: paidPercent + '%' }"></div>
              </div>

              <p :class="['text-base border rounded-xl px-3 py-2', depositMessageClass]">{{ depositMessage }}</p>
              <p v-if="dueText" class="text-base bg-amber-50 border border-amber-500 text-amber-950 rounded-xl px-3 py-2">{{ dueText }}</p>

              <!-- Abono vencido: el admin decide; la reserva nunca se libera sola -->
              <div v-if="overdue" class="border border-status-danger bg-rose-50 rounded-2xl p-3 space-y-2">
                <p class="text-base text-rose-950 flex items-start gap-1.5">
                  <AlertTriangle class="w-5 h-5 stroke-[2.5] shrink-0 mt-1" aria-hidden="true" />
                  <span><span class="font-bold">Abono vencido</span> ({{ formatDateTime(request.depositDueAt!) }}). Puedes contactar al cliente, darle más plazo o cancelar la solicitud.</span>
                </p>
                <div v-if="!confirmingCancel" class="grid grid-cols-2 gap-2">
                  <BaseButton variant="outline" size="md" class="!text-base" @click="waitForDeposit">Esperar {{ settingsStore.depositDeadlineHours }} h más</BaseButton>
                  <BaseButton variant="outline" size="md" class="!text-base !border-status-danger !text-status-danger" @click="confirmingCancel = true">Cancelar solicitud</BaseButton>
                </div>
                <div v-else class="space-y-2">
                  <p class="text-base font-bold text-rose-950">¿Cancelar la solicitud de {{ request.clientName }}? Queda en "Descartada" y el cliente tendrá que volver a solicitarla.</p>
                  <div class="grid grid-cols-2 gap-2">
                    <BaseButton variant="danger" size="md" class="!text-base" @click="cancelOverdue">Sí, cancelar</BaseButton>
                    <BaseButton variant="outline" size="md" class="!text-base" @click="confirmingCancel = false">No, volver</BaseButton>
                  </div>
                </div>
              </div>

              <!-- Pagos recibidos -->
              <div class="space-y-1.5">
                <h4 class="text-base font-bold text-brand-dark">Pagos recibidos ({{ request.payments.length }})</h4>
                <ul v-if="request.payments.length > 0" class="bg-white border border-brand-border rounded-xl divide-y divide-brand-border/50">
                  <li v-for="p in request.payments" :key="p.id" class="px-3 py-2 flex justify-between gap-3">
                    <div>
                      <p class="text-base text-brand-dark">{{ PAYMENT_METHOD_LABELS[p.method] }} · {{ formatDateShort(p.paidOn) }}</p>
                      <p v-if="p.notes" class="text-sm text-gray-600">{{ p.notes }}</p>
                    </div>
                    <span class="text-base font-bold text-status-success shrink-0">{{ formatCLP(p.amount) }}</span>
                  </li>
                </ul>
                <p v-else class="text-base text-gray-600 border border-dashed border-gray-400 rounded-xl p-3 text-center">Todavía no se registra ningún pago.</p>
              </div>

              <!-- Desglose del costo -->
              <details class="group bg-white border border-brand-border rounded-xl">
                <summary :class="claseResumen">
                  Cómo se calcula el costo
                  <ChevronDown class="w-5 h-5 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <dl class="border-t border-brand-border/50 divide-y divide-brand-border/50">
                  <div v-for="(row, index) in view.priceRows" :key="row.label" :class="['flex justify-between gap-3 px-3 py-2.5', index === view.priceRows.length - 1 ? 'bg-brand-light' : '']">
                    <dt :class="['text-base', index === view.priceRows.length - 1 ? 'font-bold text-brand-dark' : 'text-gray-700']">{{ row.label }}</dt>
                    <dd :class="['text-base', index === view.priceRows.length - 1 ? 'font-bold text-brand-dark' : 'text-gray-800']">{{ row.value }}</dd>
                  </div>
                </dl>
              </details>

              <!-- Registrar pago -->
              <details v-if="payment.balance > 0" class="group bg-white border border-brand-border rounded-xl">
                <summary :class="claseResumen">
                  Registrar un pago recibido
                  <ChevronDown class="w-5 h-5 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <form @submit.prevent="submitPayment" class="border-t border-brand-border/50 p-3 space-y-3">
                  <div class="grid grid-cols-2 gap-2">
                    <label class="space-y-1 text-sm text-gray-700">
                      Monto (CLP)
                      <input v-model.number="paymentAmount" type="number" inputmode="numeric" min="1" :class="claseCampo" />
                    </label>
                    <label class="space-y-1 text-sm text-gray-700">
                      Medio de pago
                      <select v-model="paymentMethod" :class="claseCampo">
                        <option v-for="(label, key) in PAYMENT_METHOD_LABELS" :key="key" :value="key">{{ label }}</option>
                      </select>
                    </label>
                  </div>
                  <label class="space-y-1 text-sm text-gray-700 block">
                    Fecha en que se recibió
                    <input v-model="paymentDate" type="date" :class="claseCampo" />
                  </label>
                  <label class="space-y-1 text-sm text-gray-700 block">
                    Nota (opcional)
                    <input v-model="paymentNotes" type="text" maxlength="120" placeholder="Ej.: comprobante enviado por WhatsApp" :class="claseCampo" />
                  </label>
                  <button type="button" @click="fillPendingDeposit" class="text-sm font-bold text-brand-accent underline py-1">
                    Completar con {{ payment.depositPending > 0 ? 'el abono pendiente' : 'el saldo pendiente' }}
                    ({{ formatCLP(payment.depositPending > 0 ? payment.depositPending : payment.balance) }})
                  </button>
                  <p v-if="paymentError" class="text-sm font-bold text-rose-950 bg-rose-50 border border-status-danger rounded-xl p-2">{{ paymentError }}</p>
                  <BaseButton type="submit" variant="primary" size="md" fullWidth class="!text-base" :loading="guardandoPago" :disabled="!paymentAmount || paymentAmount <= 0">
                    <CreditCard class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" /> Guardar pago
                  </BaseButton>
                </form>
              </details>
            </div>
          </section>
          </div>
        </div>
      </div>

      <!-- Acciones: solo las pendientes tienen decisión que tomar; para el resto basta la X de arriba -->
      <template v-if="!isEditing && (isPending || puedeCancelar)" #pie>
      <div v-if="puedeCancelar">
        <BaseButton variant="outline" size="md" full-width class="!text-base !border-status-danger !text-status-danger" @click="cancelandoReserva = true">
          <X class="w-4 h-4 mr-1 stroke-[3]" aria-hidden="true" /> Cancelar reserva
        </BaseButton>
      </div>
      <div v-else>
        <div v-if="!confirmingReject" class="grid grid-cols-2 gap-2">
          <BaseButton variant="outline" size="md" class="!text-base !border-status-danger !text-status-danger" @click="confirmingReject = true">
            <X class="w-4 h-4 mr-1 stroke-[3]" aria-hidden="true" /> Rechazar
          </BaseButton>
          <BaseButton v-if="bloqueo && canEdit" variant="primary" size="md" class="!text-base" @click="moviendo = true">
            <CalendarClock class="w-4 h-4 mr-1 stroke-[3]" aria-hidden="true" /> Mover fecha
          </BaseButton>
          <BaseButton v-else-if="!bloqueo" variant="success" size="md" class="!text-base" @click="approve">
            <Check class="w-4 h-4 mr-1 stroke-[3]" aria-hidden="true" /> Aprobar
          </BaseButton>
        </div>
        <div v-else class="border border-status-danger bg-rose-50 rounded-2xl p-3 space-y-2">
          <p class="text-base font-bold text-rose-950">¿Rechazar la solicitud de {{ request.clientName }}? El cliente tendrá que volver a solicitarla.</p>
          <div class="grid grid-cols-2 gap-2">
            <BaseButton variant="danger" size="md" class="!text-base" @click="reject">Sí, rechazar</BaseButton>
            <BaseButton variant="outline" size="md" class="!text-base" @click="confirmingReject = false">No, volver</BaseButton>
          </div>
        </div>
      </div>
      </template>
    </component>

    <AdminConfirmarSinAbonoDialog :request-id="sinAbonoId" @confirm="continueApproval" @close="sinAbonoId = null" />
    <AdminConfirmarCruceDialog :request-id="cruceId" @close="cerrarCruce" />
    <AdminMoverFechaDialog :request-id="moviendo ? request.id : null" @close="moviendo = false" />
    <AdminCancelarReservaDialog :request-id="cancelandoReserva ? request.id : null" @close="cerrarCancelacion" />
  </template>
</template>
