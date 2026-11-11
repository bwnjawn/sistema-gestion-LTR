<script setup lang="ts">
// Diálogo para resolver cruces al aprobar una solicitud (SCRUM-262).
// Muestra el grupo completo de solicitudes que compiten y deja elegir cuál confirmar. Nada se rechaza solo:
// para las que no quedan confirmadas, el administrador contacta al cliente, mueve la fecha o rechaza.
import { computed, ref, watch } from 'vue'
import { AlertTriangle, Calendar, Check, Mail, MessageCircle, Phone, X } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import AdminRequestEditForm from './AdminRequestEditForm.vue'
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

async function confirmar(id: string) {
  await requestsStore.confirmRequest(id)
}

async function rechazar(id: string) {
  await requestsStore.rejectRequest(id)
  rechazandoId.value = null
}

const claseSalida = 'py-3 rounded-xl text-sm font-black flex items-center justify-center gap-1 border-2 touch-target'
const claseSalidaInactiva = 'bg-gray-100 border-gray-300 text-gray-600 pointer-events-none'
</script>

<template>
  <div
    v-if="requestId"
    class="fixed inset-0 z-[60] bg-black/60 flex items-end sm:items-center justify-center sm:p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Solicitudes que se cruzan"
  >
    <div class="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full border-2 border-gray-500 shadow-2xl max-h-[92dvh] flex flex-col">
      <!-- Mover la fecha: es un paso aparte, con su propio botón de guardar -->
      <template v-if="filaEnEdicion">
        <div class="p-4 border-b-2 border-gray-300">
          <h2 class="text-xl font-black text-brand-dark leading-tight">Mover la fecha de {{ filaEnEdicion.solicitud.clientName }}</h2>
          <p class="text-sm font-bold text-gray-700">Los días ocupados por reservas confirmadas no se pueden elegir.</p>
        </div>
        <div class="overflow-y-auto p-4">
          <AdminRequestEditForm
            :request="filaEnEdicion.solicitud"
            @saved="editandoId = null"
            @cancel="editandoId = null"
          />
        </div>
      </template>

      <template v-else>
        <div class="flex items-start justify-between gap-3 p-4 border-b-2 border-gray-300">
          <div class="min-w-0">
            <h2 class="text-xl font-black text-brand-dark leading-tight flex items-center gap-1.5">
              <AlertTriangle class="w-5 h-5 text-status-danger stroke-[2.5] shrink-0" aria-hidden="true" /> Solicitudes que se cruzan
            </h2>
            <p class="text-sm font-bold text-gray-700">Elige cuál confirmar. Nada se rechaza solo.</p>
          </div>
          <button type="button" @click="emit('close')" aria-label="Cerrar" class="p-2 rounded-full hover:bg-gray-100 text-gray-800 touch-target shrink-0">
            <X class="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <div class="overflow-y-auto p-4 space-y-4">
          <p v-if="filas.length === 0" class="text-base font-black text-emerald-950 bg-emerald-50 border-2 border-status-success rounded-2xl p-3">
            Ya no hay cruces. Cierra este aviso y aprueba la solicitud con normalidad.
          </p>

          <article
            v-for="fila in filas"
            :key="fila.solicitud.id"
            :class="['border-2 rounded-2xl p-3 space-y-3', fila.confirmada ? 'border-status-success bg-emerald-50' : 'border-gray-400 bg-white']"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-black text-gray-700">
                  {{ fila.datos.servicio }} · {{ fila.solicitud.requestCode }}
                  <span v-if="fila.esLaPropia" class="ml-1 px-2 py-0.5 rounded-full bg-brand-dark text-white text-xs uppercase">La que apruebas</span>
                </p>
                <p class="text-lg font-black text-brand-dark leading-tight">{{ fila.solicitud.clientName }}</p>
              </div>
              <span
                :class="['shrink-0 px-3 py-1 rounded-full text-sm font-black', fila.confirmada ? 'bg-status-success text-white' : 'bg-amber-200 text-amber-950 border border-amber-500']"
              >
                {{ fila.confirmada ? 'Confirmada' : 'Pendiente' }}
              </span>
            </div>

            <dl class="grid grid-cols-2 gap-2 text-sm">
              <div class="bg-gray-100 rounded-xl p-2">
                <dt class="font-bold text-gray-700">Fechas</dt>
                <dd class="font-black text-brand-dark">{{ fila.datos.fechas }}</dd>
              </div>
              <div class="bg-gray-100 rounded-xl p-2">
                <dt class="font-bold text-gray-700">Precio</dt>
                <dd class="font-black text-brand-dark">{{ formatCLP(fila.solicitud.totalAmount) }}</dd>
              </div>
              <div class="bg-gray-100 rounded-xl p-2">
                <dt class="font-bold text-gray-700">Cercanía</dt>
                <dd class="font-black text-brand-dark">{{ fila.datos.cercania }}</dd>
              </div>
              <div class="bg-gray-100 rounded-xl p-2">
                <dt class="font-bold text-gray-700">Días que se topan</dt>
                <dd class="font-black text-brand-dark">{{ fila.datos.dias }}</dd>
              </div>
            </dl>

            <p class="text-sm font-bold text-gray-700">{{ fila.solicitud.resourceName }} · {{ fila.solicitud.guestsCount }} personas</p>
            <p v-if="fila.seCruzaCon" class="text-sm font-black text-rose-950">Se cruza con: {{ fila.seCruzaCon }}</p>

            <template v-if="!fila.confirmada">
              <BaseButton variant="success" fullWidth :disabled="!fila.puedeConfirmarse" @click="confirmar(fila.solicitud.id)">
                <Check class="w-5 h-5 mr-1 stroke-[3]" aria-hidden="true" /> Confirmar esta
              </BaseButton>
              <p v-if="!fila.puedeConfirmarse" class="text-sm font-black text-rose-950 bg-rose-50 border-2 border-status-danger rounded-xl p-2">
                Ya hay una reserva confirmada en esas fechas. Avisa al cliente, mueve la fecha o rechaza.
              </p>
            </template>

            <!-- Salidas para quien no queda confirmada -->
            <section v-if="mostrarSalidas(fila)" class="space-y-2 border-t-2 border-gray-300 pt-3">
              <h3 class="text-sm font-black text-brand-dark">Avisar al cliente (la app no envía nada sola)</h3>
              <p v-if="!fila.datos.telefonoUtil" class="text-sm font-black text-amber-950 bg-amber-100 border border-amber-500 rounded-xl p-2">
                El teléfono parece incompleto. Revísalo antes de llamar.
              </p>
              <div class="grid grid-cols-3 gap-2">
                <a :href="fila.datos.tel" :class="[claseSalida, fila.datos.telefonoUtil ? 'bg-white border-brand-dark text-brand-dark' : claseSalidaInactiva]">
                  <Phone class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> Llamar
                </a>
                <a
                  :href="fila.datos.whatsapp"
                  target="_blank"
                  rel="noopener"
                  :class="[claseSalida, fila.datos.telefonoUtil ? 'bg-status-success border-status-success text-white' : claseSalidaInactiva]"
                >
                  <MessageCircle class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> WhatsApp
                </a>
                <a :href="fila.datos.correo" :class="[claseSalida, fila.solicitud.clientEmail ? 'bg-white border-brand-dark text-brand-dark' : claseSalidaInactiva]">
                  <Mail class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> Correo
                </a>
              </div>

              <div v-if="rechazandoId === fila.solicitud.id" class="border-2 border-status-danger bg-rose-50 rounded-2xl p-3 space-y-2">
                <p class="text-base font-black text-rose-950">¿Rechazar la solicitud de {{ fila.solicitud.clientName }}? El cliente tendrá que volver a solicitarla.</p>
                <div class="grid grid-cols-2 gap-2">
                  <BaseButton variant="danger" @click="rechazar(fila.solicitud.id)">Sí, rechazar</BaseButton>
                  <BaseButton variant="outline" @click="rechazandoId = null">No, volver</BaseButton>
                </div>
              </div>
              <div v-else class="grid grid-cols-2 gap-2">
                <BaseButton variant="outline" @click="editandoId = fila.solicitud.id">
                  <Calendar class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" /> Modificar fecha
                </BaseButton>
                <BaseButton variant="outline" class="!border-status-danger !text-status-danger" @click="rechazandoId = fila.solicitud.id">
                  <X class="w-4 h-4 mr-1.5 stroke-[3]" aria-hidden="true" /> Rechazar
                </BaseButton>
              </div>
            </section>
          </article>
        </div>

        <div class="p-4 border-t-2 border-gray-300 bg-white rounded-b-3xl">
          <BaseButton variant="outline" fullWidth @click="emit('close')">
            {{ hayConfirmada ? 'Cerrar' : 'Cerrar sin confirmar' }}
          </BaseButton>
        </div>
      </template>
    </div>
  </div>
</template>
