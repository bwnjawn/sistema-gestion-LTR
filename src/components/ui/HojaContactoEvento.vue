<script setup lang="ts">
// Evento especial (SCRUM-45, decisión D6): no abre un asistente de reserva. Un panel que sube desde
// abajo deriva al cliente a los dueños por llamada o WhatsApp, con una fila por cada número.
import { computed, toRef } from 'vue'
import { PartyPopper, Phone, MessageCircle, X } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import { useBloqueoScroll } from '../../composables/useBloqueoScroll'
import { buildTelUrl, buildWhatsappUrl, hasUsablePhone } from '../../lib/contactLinks'

const props = defineProps<{ abierto: boolean }>()
const emit = defineEmits<{ (e: 'cerrar'): void }>()

const settingsStore = useSettingsStore()
useBloqueoScroll(toRef(props, 'abierto'))

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
  <Teleport to="body">
    <div
      v-if="abierto"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center"
      @click.self="emit('cerrar')"
      @keydown.esc="emit('cerrar')"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-evento-especial"
        class="bg-white w-full max-w-md rounded-t-3xl border-2 border-b-0 border-brand-border shadow-2xl p-5 pb-seguro-nav space-y-4 max-h-[90dvh] overflow-y-auto"
      >
        <div class="flex items-start gap-3">
          <div class="w-11 h-11 rounded-2xl bg-brand-light border border-brand-border text-brand-accent flex items-center justify-center shrink-0">
            <PartyPopper class="w-6 h-6 stroke-[2.5]" />
          </div>
          <div class="grow space-y-0.5">
            <h2 id="titulo-evento-especial" class="text-xl font-black text-brand-dark leading-tight">Evento especial</h2>
            <p class="text-sm font-bold text-gray-600">
              Cumpleaños, cena, coffee break o fiesta. Lo coordinas directo con los dueños.
            </p>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            class="w-11 h-11 -mt-1 -mr-1 rounded-full flex items-center justify-center text-gray-700 active:bg-brand-light shrink-0"
            @click="emit('cerrar')"
          >
            <X class="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

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
    </div>
  </Teleport>
</template>
