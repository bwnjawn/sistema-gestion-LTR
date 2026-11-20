<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Download, FileText, Mail, MessageCircle, Send } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { buildMailtoUrl, buildWhatsappUrl, hasUsablePhone } from '../../lib/contactLinks'
import { compartirArchivo, descargarArchivo } from '../../lib/compartirArchivo'
import { generarPdfCotizacion } from '../../lib/pdfCotizacion'
import {
  buildAsuntoCotizacion,
  buildCotizacion,
  buildMensajeCotizacion,
  nombreArchivoCotizacion
} from '../../services/cotizacion'
import type { ReservationRequest } from '../../types/domain'

const props = defineProps<{ request: ReservationRequest }>()

const settingsStore = useSettingsStore()

const trabajando = ref(false)
const error = ref('')
// Cuando el celular no ofrece el menú de compartir, el PDF se descarga y se ofrecen los canales a mano
const descargado = ref(false)

watch(() => props.request.id, () => {
  error.value = ''
  descargado.value = false
})

const mensaje = computed(() => buildMensajeCotizacion(props.request))
const telefonoUtil = computed(() => hasUsablePhone(props.request.clientPhone))

async function crearArchivo(): Promise<File | null> {
  error.value = ''
  try {
    const cotizacion = buildCotizacion(props.request, {
      negocio: { ...settingsStore.contactInfo, address: settingsStore.direccionDelLocal },
      transferencia: settingsStore.transferInfo,
      ivaVigente: settingsStore.ivaPercentage
    })
    const pdf = await generarPdfCotizacion(cotizacion)
    return new File([pdf], nombreArchivoCotizacion(props.request.requestCode), { type: 'application/pdf' })
  } catch {
    error.value = 'No se pudo generar la cotización. Intenta de nuevo.'
    return null
  }
}

async function descargar() {
  if (trabajando.value) return
  trabajando.value = true
  const archivo = await crearArchivo()
  if (archivo) descargarArchivo(archivo)
  trabajando.value = false
}

async function enviar() {
  if (trabajando.value) return
  trabajando.value = true
  descargado.value = false
  const archivo = await crearArchivo()
  if (archivo) {
    const resultado = await compartirArchivo(archivo, buildAsuntoCotizacion(props.request), mensaje.value)
    if (resultado === 'no-disponible') {
      descargarArchivo(archivo)
      descargado.value = true
    }
  }
  trabajando.value = false
}

const claseCanal = 'py-3 rounded-xl text-base font-bold flex items-center justify-center gap-1.5 border-2 touch-target'
const claseInactivo = 'bg-gray-100 border-gray-300 text-gray-600 pointer-events-none'
</script>

<template>
  <section class="space-y-2">
    <h3 class="text-base font-bold text-brand-dark">Cotización</h3>
    <div class="bg-brand-light border border-brand-border rounded-2xl p-3 space-y-3">
      <p class="text-base text-gray-800 flex items-start gap-2">
        <FileText class="w-4 h-4 text-brand-accent stroke-[2.5] shrink-0 mt-0.5" aria-hidden="true" />
        PDF con el detalle de precios, el IVA y el abono de {{ request.requestCode }}.
      </p>

      <div class="grid grid-cols-2 gap-2">
        <BaseButton variant="outline" size="md" class="!text-base" :disabled="trabajando" @click="descargar">
          <Download class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" /> Descargar
        </BaseButton>
        <BaseButton variant="primary" size="md" class="!text-base" :disabled="trabajando" @click="enviar">
          <Send class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" /> {{ trabajando ? 'Preparando…' : 'Enviar al cliente' }}
        </BaseButton>
      </div>

      <p v-if="error" class="text-sm font-bold text-rose-950 bg-rose-50 border border-status-danger rounded-xl p-2">{{ error }}</p>

      <!-- Respaldo: sin menú de compartir, el administrador adjunta el PDF descargado -->
      <div v-if="descargado" class="space-y-2 bg-amber-50 border border-amber-500 rounded-xl p-3">
        <p class="text-base text-amber-950">
          Se descargó el PDF. Abre uno de estos canales con el mensaje ya escrito y <span class="font-bold">adjunta el archivo</span>.
        </p>
        <div class="grid grid-cols-2 gap-2">
          <a
            :href="telefonoUtil ? buildWhatsappUrl(request.clientPhone, mensaje) : undefined"
            target="_blank"
            rel="noopener"
            :class="[claseCanal, telefonoUtil ? 'bg-brand-dark border-brand-dark text-white' : claseInactivo]"
          >
            <MessageCircle class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> WhatsApp
          </a>
          <a
            :href="request.clientEmail ? buildMailtoUrl(request.clientEmail, buildAsuntoCotizacion(request), mensaje) : undefined"
            :class="[claseCanal, request.clientEmail ? 'bg-white border-brand-border text-brand-dark' : claseInactivo]"
          >
            <Mail class="w-4 h-4 stroke-[2.5]" aria-hidden="true" /> Correo
          </a>
        </div>
        <p v-if="!request.clientEmail" class="text-sm text-amber-950">El cliente no dejó correo.</p>
      </div>
    </div>
  </section>
</template>
