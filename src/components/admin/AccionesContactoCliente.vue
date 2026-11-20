<script setup lang="ts">
// Llamar, WhatsApp y correo al cliente con el mensaje ya escrito. La app nunca envía nada sola: abre la aplicación
// del teléfono y el administrador manda el mensaje.
import { computed } from 'vue'
import { Mail, MessageCircle, Phone } from 'lucide-vue-next'
import { buildMailtoUrl, buildTelUrl, buildWhatsappUrl, hasUsablePhone } from '../../lib/contactLinks'

const props = defineProps<{
  telefono: string
  correo?: string
  mensaje: string
  asunto: string
}>()

const telefonoUtil = computed(() => hasUsablePhone(props.telefono))
const clase = 'py-3 px-1 rounded-xl text-base font-bold flex items-center justify-center gap-1.5 border-2 touch-target'
const claseInactivo = 'bg-gray-100 border-gray-300 text-gray-600 pointer-events-none'
</script>

<template>
  <div class="space-y-2">
    <p v-if="!telefonoUtil" class="text-base font-bold text-amber-950 bg-amber-50 border border-amber-500 rounded-xl p-2">
      El teléfono parece incompleto. Revísalo antes de llamar.
    </p>
    <div class="grid grid-cols-3 gap-2">
      <a :href="telefonoUtil ? buildTelUrl(telefono) : undefined" :class="[clase, telefonoUtil ? 'bg-white border-brand-border text-brand-dark' : claseInactivo]">
        <Phone class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" /> Llamar
      </a>
      <a
        :href="telefonoUtil ? buildWhatsappUrl(telefono, mensaje) : undefined"
        target="_blank"
        rel="noopener"
        :class="[clase, telefonoUtil ? 'bg-brand-dark border-brand-dark text-white' : claseInactivo]"
      >
        <MessageCircle class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" /> WhatsApp
      </a>
      <a :href="correo ? buildMailtoUrl(correo, asunto, mensaje) : undefined" :class="[clase, correo ? 'bg-white border-brand-border text-brand-dark' : claseInactivo]">
        <Mail class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" /> Correo
      </a>
    </div>
  </div>
</template>
