<script setup lang="ts">
// Enlace al reglamento del camping en PDF (SCRUM-51). Solo aparece si el administrador subió uno.
import { FileText, ExternalLink } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import { abrirDocumento, esEnlaceData } from '../../lib/abrirDocumento'

const settingsStore = useSettingsStore()

// Con Supabase es un enlace normal (se abre en una pestaña nueva, sin sacar al cliente de la app).
// Sin Supabase el archivo es un `data:`, que hay que convertir antes de abrirlo.
function alTocar(evento: Event) {
  if (!esEnlaceData(settingsStore.campingRules.url)) return
  evento.preventDefault()
  abrirDocumento(settingsStore.campingRules.url)
}
</script>

<template>
  <a
    v-if="settingsStore.tieneReglamentoCamping"
    :href="settingsStore.campingRules.url"
    target="_blank"
    rel="noopener"
    class="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-300 text-left active:bg-gray-50"
    @click="alTocar"
  >
    <span class="w-11 h-11 shrink-0 rounded-xl bg-brand-light border border-brand-border flex items-center justify-center text-brand-dark">
      <FileText class="w-6 h-6 stroke-2" aria-hidden="true" />
    </span>
    <span class="min-w-0 grow">
      <span class="block font-bold text-brand-dark">Reglamento del camping</span>
      <span class="block text-sm text-gray-600">Léelo antes de venir. Se abre en PDF.</span>
    </span>
    <ExternalLink class="w-5 h-5 shrink-0 text-gray-600" aria-hidden="true" />
  </a>
</template>
