<script setup lang="ts">
// Reglamento del camping en PDF (SCRUM-51): el administrador lo sube, lo reemplaza o lo quita. El cliente de
// camping lo ve al revisar y al enviar su solicitud.
import { ref } from 'vue'
import { FileText } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatDateShort } from '../../lib/dates'
import { abrirDocumento, esEnlaceData } from '../../lib/abrirDocumento'
import { TAMANO_MAXIMO_PDF, formatearTamano } from '../../services/documentos'

const settingsStore = useSettingsStore()

const entradaArchivo = ref<HTMLInputElement | null>(null)
const subiendo = ref(false)
const confirmandoQuitar = ref(false)
const mensaje = ref<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

function elegirArchivo() {
  mensaje.value = null
  entradaArchivo.value?.click()
}

async function alElegirArchivo(evento: Event) {
  const entrada = evento.target as HTMLInputElement
  const archivo = entrada.files?.[0]
  entrada.value = ''
  if (!archivo) return
  subiendo.value = true
  const error = await settingsStore.subirReglamentoCamping(archivo)
  subiendo.value = false
  mensaje.value = error ? { tipo: 'error', texto: error } : { tipo: 'ok', texto: 'Reglamento guardado. Ya lo ven los clientes de camping.' }
}

async function quitar() {
  confirmandoQuitar.value = false
  const error = await settingsStore.quitarReglamentoCamping()
  mensaje.value = error ? { tipo: 'error', texto: error } : { tipo: 'ok', texto: 'Reglamento quitado.' }
}

function ver(evento: Event) {
  if (!esEnlaceData(settingsStore.campingRules.url)) return
  evento.preventDefault()
  abrirDocumento(settingsStore.campingRules.url)
}
</script>

<template>
  <section class="bg-white p-4 sm:p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-4" aria-labelledby="titulo-reglamento">
    <div class="flex items-center gap-2">
      <FileText class="w-4 h-4 text-brand-accent stroke-[2.5]" aria-hidden="true" />
      <h3 id="titulo-reglamento" class="text-base font-bold text-brand-dark">Reglamento del camping</h3>
    </div>

    <template v-if="settingsStore.tieneReglamentoCamping">
      <div class="bg-brand-light p-3 rounded-2xl border border-brand-border">
        <p class="font-bold text-brand-dark break-words">{{ settingsStore.campingRules.nombre || 'Reglamento.pdf' }}</p>
        <p class="text-sm text-gray-600">Subido el {{ formatDateShort(settingsStore.campingRules.actualizadoEn.slice(0, 10)) }}</p>
      </div>

      <div v-if="!confirmandoQuitar" class="grid grid-cols-3 gap-2">
        <a
          :href="settingsStore.campingRules.url"
          target="_blank"
          rel="noopener"
          class="py-3 rounded-xl border border-brand-dark text-brand-dark font-bold text-center"
          @click="ver"
        >Ver</a>
        <button type="button" :disabled="subiendo" class="py-3 rounded-xl border border-brand-dark text-brand-dark font-bold disabled:opacity-50" @click="elegirArchivo">
          {{ subiendo ? 'Subiendo…' : 'Reemplazar' }}
        </button>
        <button type="button" :disabled="subiendo" class="py-3 rounded-xl border border-rose-300 text-rose-700 font-bold disabled:opacity-50" @click="confirmandoQuitar = true">Quitar</button>
      </div>

      <div v-else class="space-y-3" role="alert">
        <p class="text-base text-gray-700">¿Quitar el reglamento? Los clientes dejarán de verlo hasta que subas otro.</p>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" class="py-3 rounded-xl border border-brand-dark text-brand-dark font-bold" @click="confirmandoQuitar = false">Cancelar</button>
          <button type="button" class="py-3 rounded-xl bg-rose-600 text-white font-bold" @click="quitar">Quitar</button>
        </div>
      </div>
    </template>

    <template v-else>
      <p class="text-base text-gray-700">Aún no hay reglamento. Cuando subas el PDF, los clientes de camping lo verán al revisar y al enviar su solicitud.</p>
      <button type="button" :disabled="subiendo" class="w-full py-3 rounded-xl bg-brand-dark text-white font-bold disabled:opacity-50" @click="elegirArchivo">
        {{ subiendo ? 'Subiendo…' : 'Subir PDF' }}
      </button>
    </template>

    <p class="text-sm text-gray-600">Solo PDF, hasta {{ formatearTamano(TAMANO_MAXIMO_PDF) }}. Al reemplazarlo, el cliente ve el nuevo desde ese momento.</p>

    <p
      v-if="mensaje"
      role="status"
      :class="['p-3 rounded-xl text-sm border', mensaje.tipo === 'ok' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800']"
    >{{ mensaje.texto }}</p>

    <input ref="entradaArchivo" type="file" accept="application/pdf,.pdf" class="hidden" @change="alElegirArchivo" />
  </section>
</template>
