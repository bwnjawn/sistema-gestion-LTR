<script setup lang="ts">
// Mover la fecha de una solicitud: solo el calendario, más las vías para hablar con el cliente.
// El administrador puede mover la fecha directo o, antes, avisar al cliente por llamada, WhatsApp o correo.
// La app nunca envía mensajes sola.
import { computed } from 'vue'
import { Mail, MessageCircle, Phone } from 'lucide-vue-next'
import HojaModal from '../ui/HojaModal.vue'
import AdminRequestEditForm from './AdminRequestEditForm.vue'
import EstadoSolicitud from './EstadoSolicitud.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { buildMailtoUrl, buildTelUrl, buildWhatsappUrl, hasUsablePhone } from '../../lib/contactLinks'
import { describirBloqueo } from '../../services/cruces'
import { buildAsuntoFechaNoDisponible, buildMensajeFechaNoDisponible } from '../../services/mensajesCliente'

const props = defineProps<{
  /** Solicitud cuya fecha se mueve; null mantiene el diálogo cerrado. */
  requestId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const requestsStore = useRequestsStore()
const request = computed(() => requestsStore.requests.find(r => r.id === props.requestId) ?? null)
const bloqueo = computed(() => (request.value ? describirBloqueo(requestsStore.porMoverPorId[request.value.id] ?? []) : ''))

const contacto = computed(() => {
  const r = request.value
  if (!r) return null
  const telefonoUtil = hasUsablePhone(r.clientPhone)
  const mensaje = buildMensajeFechaNoDisponible(r)
  return {
    telefonoUtil,
    tel: telefonoUtil ? buildTelUrl(r.clientPhone) : undefined,
    whatsapp: telefonoUtil ? buildWhatsappUrl(r.clientPhone, mensaje) : undefined,
    correo: r.clientEmail ? buildMailtoUrl(r.clientEmail, buildAsuntoFechaNoDisponible(r), mensaje) : undefined
  }
})


const claseSalida = 'py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-1 border-2 touch-target'
const claseSalidaInactiva = 'bg-gray-100 border-gray-300 text-gray-600 pointer-events-none'
</script>

<template>
  <HojaModal
    v-if="request && contacto"
    :abierto="true"
    titulo="Mover la fecha"
    :subtitulo="`${request.clientName} · ${request.resourceName}`"
    :nivel="60"
    :cerrar-al-tocar-fuera="false"
    @cerrar="emit('close')"
  >
    <p><EstadoSolicitud :status="request.status" :por-mover="!!bloqueo" /></p>

    <p v-if="bloqueo" class="text-sm text-rose-950 bg-rose-50 border border-status-danger rounded-xl p-2.5">
      Su fecha ya la ocupa {{ bloqueo }}. Mueve la fecha o habla primero con el cliente.
    </p>

    <section class="space-y-2">
      <h3 class="text-xs font-bold text-brand-accent uppercase tracking-wider">Hablar con el cliente</h3>
      <div class="grid grid-cols-3 gap-2">
        <a :href="contacto.tel" :class="[claseSalida, contacto.telefonoUtil ? 'bg-white border-brand-border text-brand-dark' : claseSalidaInactiva]">
          <Phone class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> Llamar
        </a>
        <a
          :href="contacto.whatsapp"
          target="_blank"
          rel="noopener"
          :class="[claseSalida, contacto.telefonoUtil ? 'bg-brand-dark border-brand-dark text-white' : claseSalidaInactiva]"
        >
          <MessageCircle class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> WhatsApp
        </a>
        <a :href="contacto.correo" :class="[claseSalida, contacto.correo ? 'bg-white border-brand-border text-brand-dark' : claseSalidaInactiva]">
          <Mail class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> Correo
        </a>
      </div>
      <p class="text-xs text-gray-700">El mensaje va prearmado y no propone fechas. Lo envías tú.</p>
    </section>

    <AdminRequestEditForm :request="request" solo-fecha @saved="emit('close')" @cancel="emit('close')" />
  </HojaModal>
</template>
