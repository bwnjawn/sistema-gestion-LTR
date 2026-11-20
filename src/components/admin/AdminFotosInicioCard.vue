<script setup lang="ts">
// Fotos del inicio (SCRUM-271): resumen con miniaturas de las cinco tarjetas del inicio. "Editar" abre un modal
// con la vista previa de cada tarjeta y su texto, donde se cambia la foto o se vuelve a la provisoria.
import { computed, ref } from 'vue'
import { Image as IconoFoto, X } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import { useBloqueoScroll } from '../../composables/useBloqueoScroll'
import { compressAndReadFile } from '../../lib/images'
import { TARJETAS_INICIO } from '../../services/fotosInicio'
import type { ClaveFotoInicio } from '../../types/settings'
import FondoFotoTarjeta from '../ui/FondoFotoTarjeta.vue'

const settingsStore = useSettingsStore()

const abierto = ref(false)
const procesando = ref<ClaveFotoInicio | null>(null)
const mensaje = ref<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

useBloqueoScroll(computed(() => abierto.value))

function abrir() {
  mensaje.value = null
  abierto.value = true
}

async function alElegirFoto(clave: ClaveFotoInicio, evento: Event) {
  const entrada = evento.target as HTMLInputElement
  const archivo = entrada.files?.[0]
  entrada.value = ''
  if (!archivo) return
  mensaje.value = null
  procesando.value = clave
  try {
    const foto = await compressAndReadFile(archivo)
    const error = await settingsStore.cambiarFotoInicio(clave, foto)
    mensaje.value = error ? { tipo: 'error', texto: error } : { tipo: 'ok', texto: 'Foto guardada. Ya se ve en el inicio.' }
  } catch {
    mensaje.value = { tipo: 'error', texto: 'No se pudo leer la foto. Prueba con otra.' }
  } finally {
    procesando.value = null
  }
}

async function volverALaOriginal(clave: ClaveFotoInicio) {
  mensaje.value = null
  procesando.value = clave
  const error = await settingsStore.cambiarFotoInicio(clave, '')
  procesando.value = null
  mensaje.value = error ? { tipo: 'error', texto: error } : { tipo: 'ok', texto: 'Se restauró la foto original.' }
}
</script>

<template>
  <section class="bg-white p-4 sm:p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3" aria-labelledby="titulo-fotos-inicio">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <IconoFoto class="w-4 h-4 text-brand-accent stroke-[2.5]" aria-hidden="true" />
        <h3 id="titulo-fotos-inicio" class="text-sm font-black text-brand-dark">Fotos del inicio</h3>
      </div>
      <button type="button" class="py-1.5 px-3 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-100" @click="abrir">
        Editar
      </button>
    </div>

    <!-- Resumen: una miniatura por tarjeta del inicio -->
    <ul class="grid grid-cols-5 gap-1.5">
      <li v-for="tarjeta in TARJETAS_INICIO" :key="tarjeta.clave" class="text-center">
        <div class="relative aspect-square rounded-xl overflow-hidden border border-brand-border bg-gradient-to-br from-brand-dark to-brand-accent">
          <img :src="settingsStore.fotoInicio(tarjeta.clave)" alt="" class="absolute inset-0 w-full h-full object-cover" @error="($event.target as HTMLImageElement).style.display = 'none'" />
        </div>
        <span class="block mt-1 text-xs font-bold text-gray-700 leading-tight truncate">{{ tarjeta.titulo }}</span>
      </li>
    </ul>

    <!-- Modal con la vista previa de cada tarjeta -->
    <div v-if="abierto" class="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="titulo-modal-fotos">
      <div class="bg-white rounded-3xl p-5 max-w-sm w-full border-2 border-brand-border shadow-2xl space-y-4 max-h-[90dvh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 id="titulo-modal-fotos" class="text-base font-black text-brand-dark">Fotos del inicio</h3>
          <button type="button" aria-label="Cerrar" class="p-1 text-gray-500 hover:bg-gray-100 rounded-full" @click="abierto = false">
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <p class="text-sm text-gray-600">Prefiere fotos con zonas oscuras abajo: ahí va el texto blanco de la tarjeta.</p>

        <div class="space-y-4">
          <div v-for="tarjeta in TARJETAS_INICIO" :key="tarjeta.clave" class="space-y-2">
            <!-- Vista previa de la tarjeta, con su texto -->
            <div class="relative h-28 rounded-2xl overflow-hidden border border-brand-border bg-gradient-to-br from-brand-dark to-brand-accent">
              <FondoFotoTarjeta :imagen="settingsStore.fotoInicio(tarjeta.clave)" />
              <div class="absolute bottom-3 left-3 right-3 text-white">
                <p class="text-xl font-black leading-tight drop-shadow-sm">{{ tarjeta.titulo }}</p>
                <p class="text-sm font-bold text-gray-200 leading-tight">{{ tarjeta.subtitulo }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <label
                :class="['py-3 rounded-xl border border-brand-dark text-brand-dark font-bold text-center cursor-pointer', procesando ? 'opacity-50 pointer-events-none' : '']"
              >
                {{ procesando === tarjeta.clave ? 'Guardando…' : 'Cambiar foto' }}
                <input type="file" accept="image/*" class="hidden" :disabled="!!procesando" @change="alElegirFoto(tarjeta.clave, $event)" />
              </label>
              <button
                type="button"
                :disabled="!!procesando || !settingsStore.fotosInicio[tarjeta.clave]"
                class="py-3 rounded-xl border border-brand-dark text-brand-dark font-bold disabled:opacity-50"
                @click="volverALaOriginal(tarjeta.clave)"
              >Volver a la original</button>
            </div>
          </div>
        </div>

        <p
          v-if="mensaje"
          role="status"
          :class="['p-3 rounded-xl text-sm border', mensaje.tipo === 'ok' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800']"
        >{{ mensaje.texto }}</p>

        <button type="button" class="w-full py-3 rounded-xl bg-brand-dark text-white font-bold" @click="abierto = false">Listo</button>
      </div>
    </div>
  </section>
</template>
