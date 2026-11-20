<script setup lang="ts">
// Diálogo para resolver cruces al aprobar una solicitud (SCRUM-262).
// Muestra el grupo completo de solicitudes que compiten y deja elegir cuál confirmar. Nada se rechaza solo:
// para las que no quedan confirmadas, el administrador contacta al cliente, mueve la fecha o rechaza.
import { computed, ref, watch } from 'vue'
import { Calendar, Check, Mail, MessageCircle, Phone, X } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import HojaModal from '../ui/HojaModal.vue'
import AdminRequestEditForm from './AdminRequestEditForm.vue'
import AdminConfirmarSinAbonoDialog from './AdminConfirmarSinAbonoDialog.vue'
import EstadoSolicitud from './EstadoSolicitud.vue'
import { getPaymentSummary } from '../../services/payments'
import { useRequestsStore } from '../../stores/requestsStore'
import { buildMailtoUrl, buildTelUrl, buildWhatsappUrl, hasUsablePhone } from '../../lib/contactLinks'
import { formatDateShort } from '../../lib/dates'
import { formatCLP } from '../../lib/format'
import { describirCercania, type SolicitudEnCruce } from '../../services/cruces'
import { buildAsuntoFechaNoDisponible, buildMensajeFechaNoDisponible, describirFechasSolicitud } from '../../services/mensajesCliente'
import { describeRequest } from '../../services/requests'

const props = defineProps<{
  /** Solicitud que se quiere aprobar; null mantiene el diálogo cerrado. */
  requestId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const requestsStore = useRequestsStore()

// Solicitud con el formulario de fecha abierto y solicitud que espera la confirmación de rechazo
const editandoId = ref<string | null>(null)
const rechazandoId = ref<string | null>(null)

watch(() => props.requestId, () => {
  editandoId.value = null
  rechazandoId.value = null
})

function datosDeLaFila(fila: SolicitudEnCruce) {
  const s = fila.solicitud
  const telefonoUtil = hasUsablePhone(s.clientPhone)
  const mensaje = buildMensajeFechaNoDisponible(s)
  return {
    servicio: describeRequest(s).serviceLabel,
    fechas: describirFechasSolicitud(s),
    dias: fila.dias.map(d => formatDateShort(d)).join(', '),
    cercania: describirCercania(fila.diasParaLaFecha),
    telefonoUtil,
    tel: telefonoUtil ? buildTelUrl(s.clientPhone) : undefined,
    whatsapp: telefonoUtil ? buildWhatsappUrl(s.clientPhone, mensaje) : undefined,
    correo: s.clientEmail ? buildMailtoUrl(s.clientEmail, buildAsuntoFechaNoDisponible(s), mensaje) : undefined
  }
}

// Los datos de cada fila se calculan una sola vez por cambio, no en cada lectura de la plantilla
const filas = computed(() => {
  const grupo = props.requestId ? requestsStore.crossedRequestsFor(props.requestId) : []
  const nombres = new Map(grupo.map(f => [f.solicitud.id, f.solicitud.clientName]))
  return grupo.map(fila => ({
    ...fila,
    datos: datosDeLaFila(fila),
    seCruzaCon: fila.seCruzaConIds.map(id => nombres.get(id)).filter(Boolean).join(', ')
  }))
})
const hayConfirmada = computed(() => filas.value.some(f => f.confirmada))
const filaEnEdicion = computed(() => filas.value.find(f => f.solicitud.id === editandoId.value) ?? null)

/** Las salidas de contacto aparecen para quien ya no puede quedar confirmada (hay una confirmada en su lugar). */
function mostrarSalidas(fila: { confirmada: boolean; puedeConfirmarse: boolean }): boolean {
  return !fila.confirmada && !fila.puedeConfirmarse
}

// Si a la elegida le falta abono, primero se avisa (SCRUM-264)
const sinAbonoId = ref<string | null>(null)

async function confirmar(id: string) {
  const req = requestsStore.requests.find(r => r.id === id)
  if (req && getPaymentSummary(req).depositPending > 0) {
    sinAbonoId.value = id
    return
  }
  await confirmarIgual(id)
}

async function confirmarIgual(id: string) {
  sinAbonoId.value = null
  await requestsStore.confirmRequest(id)
}

async function rechazar(id: string) {
  await requestsStore.rejectRequest(id)
  rechazandoId.value = null
}


const claseSalida = 'py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1 border-2 touch-target'
const claseSalidaInactiva = 'bg-gray-100 border-gray-300 text-gray-600 pointer-events-none'
</script>

<template>
  <template v-if="requestId">
    <HojaModal
      :abierto="true"
      :titulo="filaEnEdicion ? `Mover la fecha de ${filaEnEdicion.solicitud.clientName}` : 'Solicitudes que se cruzan'"
      :subtitulo="filaEnEdicion ? 'Los días ocupados por reservas confirmadas no se pueden elegir.' : 'Elige cuál se queda con la fecha. Nada se rechaza solo.'"
      :nivel="60"
      :cerrar-al-tocar-fuera="false"
      @cerrar="emit('close')"
    >
      <!-- Mover la fecha: es un paso aparte, con su propio botón de guardar -->
      <AdminRequestEditForm
        v-if="filaEnEdicion"
        :request="filaEnEdicion.solicitud"
        solo-fecha
        @saved="editandoId = null"
        @cancel="editandoId = null"
      />

      <div v-else class="space-y-3">
          <p v-if="filas.length === 0" class="text-sm font-bold text-emerald-950 bg-emerald-50 border border-status-success rounded-2xl p-3">
            Ya no hay cruces. Cierra este aviso y aprueba la solicitud con normalidad.
          </p>

          <article
            v-for="fila in filas"
            :key="fila.solicitud.id"
            :class="['border rounded-2xl p-3 space-y-2.5', fila.confirmada ? 'border-brand-dark bg-emerald-50' : 'border-brand-border bg-brand-light']"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p v-if="fila.esLaPropia" class="text-sm font-bold text-brand-accent">La que apruebas</p>
                <h3 class="text-base font-bold text-brand-dark leading-tight break-words">{{ fila.solicitud.clientName }}</h3>
              </div>
              <EstadoSolicitud :status="fila.solicitud.status" class="mt-0.5" />
            </div>

            <div class="bg-white border border-brand-border rounded-xl px-3 py-2 space-y-0.5">
              <p class="text-sm text-gray-800">
                {{ fila.datos.servicio }} · {{ fila.solicitud.resourceName }} · <span class="font-bold">{{ fila.datos.fechas }}</span>
              </p>
              <p class="text-sm text-gray-700">
                {{ fila.solicitud.guestsCount }} personas · {{ formatCLP(fila.solicitud.totalAmount) }} · {{ fila.datos.cercania }}
              </p>
              <p class="text-sm font-bold text-rose-950">Se topan: {{ fila.datos.dias }}</p>
              <p v-if="fila.seCruzaCon" class="text-sm text-rose-950">Se cruza con {{ fila.seCruzaCon }}</p>
            </div>

            <template v-if="!fila.confirmada">
              <!-- Si la fecha ya la ocupa una confirmada, no se ofrece confirmar: solo mover la fecha o rechazar -->
              <BaseButton v-if="fila.puedeConfirmarse" variant="success" size="md" fullWidth class="!text-base" @click="confirmar(fila.solicitud.id)">
                <Check class="w-4 h-4 mr-1 stroke-[3]" aria-hidden="true" /> Confirmar esta
              </BaseButton>
              <p v-else class="text-sm text-rose-950 bg-rose-50 border border-status-danger rounded-xl px-3 py-2">
                <span class="font-bold">La fecha ya la ocupa una reserva confirmada.</span> No se puede aprobar: mueve la fecha o rechaza.
              </p>
            </template>

            <!-- Salidas para quien no queda confirmada -->
            <section v-if="mostrarSalidas(fila)" class="space-y-2 border-t border-brand-border/60 pt-2.5">
              <h4 class="text-sm font-bold text-gray-800">Avisar al cliente (la app no envía nada sola)</h4>
              <p v-if="!fila.datos.telefonoUtil" class="text-sm font-bold text-amber-950 bg-amber-50 border border-amber-500 rounded-xl p-2">
                El teléfono parece incompleto. Revísalo antes de llamar.
              </p>
              <div class="grid grid-cols-3 gap-2">
                <a :href="fila.datos.tel" :class="[claseSalida, fila.datos.telefonoUtil ? 'bg-white border-brand-border text-brand-dark' : claseSalidaInactiva]">
                  <Phone class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> Llamar
                </a>
                <a
                  :href="fila.datos.whatsapp"
                  target="_blank"
                  rel="noopener"
                  :class="[claseSalida, fila.datos.telefonoUtil ? 'bg-brand-dark border-brand-dark text-white' : claseSalidaInactiva]"
                >
                  <MessageCircle class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> WhatsApp
                </a>
                <a :href="fila.datos.correo" :class="[claseSalida, fila.solicitud.clientEmail ? 'bg-white border-brand-border text-brand-dark' : claseSalidaInactiva]">
                  <Mail class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> Correo
                </a>
              </div>

              <div v-if="rechazandoId === fila.solicitud.id" class="border border-status-danger bg-rose-50 rounded-2xl p-3 space-y-2">
                <p class="text-sm font-bold text-rose-950">¿Rechazar la solicitud de {{ fila.solicitud.clientName }}? El cliente tendrá que volver a solicitarla.</p>
                <div class="grid grid-cols-2 gap-2">
                  <BaseButton variant="danger" size="md" class="!text-base" @click="rechazar(fila.solicitud.id)">Sí, rechazar</BaseButton>
                  <BaseButton variant="outline" size="md" class="!text-base" @click="rechazandoId = null">No, volver</BaseButton>
                </div>
              </div>
              <div v-else class="grid grid-cols-2 gap-2">
                <BaseButton variant="primary" size="md" class="!text-base" @click="editandoId = fila.solicitud.id">
                  <Calendar class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" /> Mover fecha
                </BaseButton>
                <BaseButton variant="outline" size="md" class="!text-base !border-status-danger !text-status-danger" @click="rechazandoId = fila.solicitud.id">
                  <X class="w-4 h-4 mr-1.5 stroke-[3]" aria-hidden="true" /> Rechazar
                </BaseButton>
              </div>
            </section>
          </article>
      </div>

      <template v-if="!filaEnEdicion" #pie>
        <BaseButton variant="outline" size="md" fullWidth class="!text-base" @click="emit('close')">
          {{ hayConfirmada ? 'Cerrar' : 'Cerrar sin confirmar' }}
        </BaseButton>
      </template>
    </HojaModal>

    <AdminConfirmarSinAbonoDialog :request-id="sinAbonoId" @confirm="confirmarIgual" @close="sinAbonoId = null" />
  </template>
</template>
