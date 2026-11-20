<script setup lang="ts">
// Evento especial (SCRUM-45, decisión D6): no abre un asistente de reserva. Un panel que sube desde
// abajo deriva al cliente a los dueños por llamada o WhatsApp, con una fila por cada número.
import { computed } from 'vue'
import { Phone, MessageCircle } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import HojaModal from './HojaModal.vue'
import { buildTelUrl, buildWhatsappUrl, hasUsablePhone } from '../../lib/contactLinks'

const props = defineProps<{ abierto: boolean }>()
const emit = defineEmits<{ (e: 'cerrar'): void }>()

const settingsStore = useSettingsStore()

const MENSAJE_WHATSAPP =
  'Hola, quiero consultar por un evento especial en Los Troncos de Repil (cumpleaños, cena, coffee break o fiesta).'

// Teléfonos utilizables, en el orden de Ajustes (principal y secundario).
const contactos = computed(() =>
  [
    { id: 'principal', etiqueta: 'Principal', numero: settingsStore.contactInfo.phone1 },
    { id: 'secundario', etiqueta: 'Secundario', numero: settingsStore.contactInfo.phone2 }
  ]
    .filter((t) => hasUsablePhone(t.numero))
    .map((t) => ({
      ...t,
      urlLlamar: buildTelUrl(t.numero),
      urlWhatsapp: buildWhatsappUrl(t.numero, MENSAJE_WHATSAPP)
    }))
)
</script>

<template>
  <HojaModal
    :abierto="abierto"
    titulo="Evento especial"
    subtitulo="Cumpleaños, cena, coffee break o fiesta. Lo coordinas directo con los dueños."
    @cerrar="emit('cerrar')"
  >
    <div
      v-for="c in contactos"
      :key="c.id"
      class="flex items-center gap-3 rounded-2xl border border-brand-border bg-brand-light p-3"
    >
      <div class="grow min-w-0">
        <span class="text-sm font-bold text-gray-500 block leading-none">{{ c.etiqueta }}</span>
        <span class="text-base font-black text-brand-dark whitespace-nowrap">{{ c.numero }}</span>
      </div>
      <a
        :href="c.urlLlamar"
        :aria-label="`Llamar al ${c.numero}`"
        class="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl bg-brand-dark text-white active:scale-95 transition-all"
      >
        <Phone class="w-5 h-5 stroke-[2.5]" />
      </a>
      <a
        :href="c.urlWhatsapp"
        target="_blank"
        rel="noopener noreferrer"
        :aria-label="`Escribir por WhatsApp al ${c.numero}`"
        class="w-12 h-12 shrink-0 flex items-center justify-center rounded-2xl border-2 border-brand-dark bg-white text-brand-dark active:scale-95 transition-all"
      >
        <MessageCircle class="w-5 h-5 stroke-[2.5]" />
      </a>
    </div>

    <p v-if="contactos.length === 0" class="text-sm font-bold text-gray-600">
      Escríbenos desde la pestaña Contacto.
    </p>
  </HojaModal>
</template>
