<script setup lang="ts">
// Evento especial (SCRUM-45, decisión D6): no abre un asistente de reserva.
// Tarjeta desplegable que deriva al cliente a los dueños por llamada o WhatsApp,
// con una fila por cada número de contacto.
import { computed, ref } from 'vue'
import { PartyPopper, Phone, MessageCircle, ChevronDown } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import { buildTelUrl, buildWhatsappUrl, hasUsablePhone } from '../../lib/contactLinks'

const settingsStore = useSettingsStore()

const MENSAJE_WHATSAPP =
  'Hola, quiero consultar por un evento especial en Los Troncos de Repil (cumpleaños, cena, coffee break o fiesta).'

const abierta = ref(false)

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
  <section class="rounded-3xl border-2 border-brand-border bg-white shadow-sm overflow-hidden">
    <button
      type="button"
      class="touch-target w-full flex items-center gap-3 p-4 text-left active:bg-brand-light transition-colors"
      :aria-expanded="abierta"
      aria-controls="contactos-evento-especial"
      @click="abierta = !abierta"
    >
      <div class="w-11 h-11 rounded-2xl bg-brand-light border border-brand-border text-brand-accent flex items-center justify-center shrink-0">
        <PartyPopper class="w-6 h-6 stroke-[2.5]" />
      </div>
      <div class="grow space-y-0.5">
        <h3 class="text-xl font-black text-brand-dark leading-tight">Evento especial</h3>
        <p class="text-sm font-bold text-gray-600">
          Cumpleaños, cena, coffee break o fiesta
        </p>
      </div>
      <ChevronDown
        class="w-6 h-6 stroke-[2.5] text-brand-dark shrink-0 transition-transform"
        :class="{ 'rotate-180': abierta }"
      />
    </button>

    <div
      v-if="abierta"
      id="contactos-evento-especial"
      class="px-4 pb-4 space-y-3 border-t border-brand-border pt-3"
    >
      <p class="text-sm font-bold text-gray-600">
        Lo coordinas directo con los dueños. Elige un número:
      </p>

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
    </div>
  </section>
</template>
