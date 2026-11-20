<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CloudOff, RotateCw, Phone, Trash2 } from 'lucide-vue-next'
import ClientHeader from '../../components/ui/ClientHeader.vue'
import ClientBottomNav from '../../components/ui/ClientBottomNav.vue'
import ClientBarraSuperior from '../../components/ui/ClientBarraSuperior.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseAlert from '../../components/ui/BaseAlert.vue'
import HojaModal from '../../components/ui/HojaModal.vue'
import { useColaEnvioStore } from '../../stores/colaEnvioStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatDateShort, formatDateTime } from '../../lib/dates'
import type { SolicitudEnCola } from '../../services/colaEnvio'

// Solicitudes guardadas en el teléfono que todavía no llegaron al restaurante (SCRUM-250).
const router = useRouter()
const cola = useColaEnvioStore()
const settingsStore = useSettingsStore()

const porDescartar = ref<SolicitudEnCola | null>(null)

function resumen(e: SolicitudEnCola): string {
  const s = e.solicitud
  const fecha = s.date ? formatDateShort(s.date) : ''
  const personas = s.guestsCount === 1 ? '1 persona' : `${s.guestsCount} personas`
  return [fecha, personas].filter(Boolean).join(' · ')
}

async function descartar() {
  const e = porDescartar.value
  porDescartar.value = null
  if (e) await cola.descartar(e.id)
}
</script>

<template>
  <div class="min-h-screen bg-brand-light">
    <ClientBarraSuperior />
    <ClientHeader class="lg:hidden" titulo="Por enviar" subtitulo="Solicitudes guardadas en este teléfono" con-volver @volver="router.push('/')" />

    <main class="space-y-4 max-w-md lg:max-w-3xl mx-auto w-full px-4 lg:px-10 pt-4 lg:pt-8 pb-contenido-nav lg:pb-12">
      <div v-if="cola.entradas.length === 0" class="bg-white p-5 rounded-3xl border-2 border-brand-border text-center space-y-2">
        <p class="text-base font-bold text-brand-dark">No tienes solicitudes por enviar</p>
        <p class="text-base text-gray-700">Las que hagas sin señal aparecerán aquí hasta que lleguen.</p>
      </div>

      <template v-else>
        <BaseAlert v-if="cola.pendientes.length > 0" variant="info" title="Esperando señal">
          Se enviarán solas cuando vuelva la conexión. Puedes intentarlo ahora si crees que ya tienes señal.
        </BaseAlert>

        <BaseButton
          v-if="cola.pendientes.length > 0"
          variant="primary"
          size="lg"
          full-width
          :loading="cola.sincronizando"
          @click="cola.reintentar()"
        >
          <RotateCw class="w-5 h-5 mr-1.5 stroke-[2.5]" aria-hidden="true" />
          Enviar ahora
        </BaseButton>

        <article
          v-for="e in cola.entradas"
          :key="e.id"
          class="bg-white p-4 rounded-3xl border-2 border-brand-border space-y-2"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <h2 class="text-lg font-bold text-brand-dark leading-tight truncate">{{ e.solicitud.resourceName }}</h2>
              <p class="text-base text-gray-700">{{ resumen(e) }}</p>
              <p class="text-base text-gray-600">Guardada el {{ formatDateTime(e.encoladaEn) }}</p>
            </div>
            <button
              type="button"
              class="touch-target shrink-0 inline-flex items-center justify-center rounded-full text-gray-600 active:scale-95"
              aria-label="Descartar esta solicitud"
              @click="porDescartar = e"
            >
              <Trash2 class="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
            </button>
          </div>

          <p v-if="e.estado === 'pendiente'" class="flex items-center gap-2 text-sm font-bold text-amber-900">
            <CloudOff class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
            Esperando señal
          </p>

          <template v-else>
            <BaseAlert variant="danger" title="No se pudo enviar">
              <p>{{ e.motivo }}</p>
              <p class="mt-1">Puedes llamarnos o escribirnos para resolverlo, o descartar esta solicitud y hacer otra.</p>
            </BaseAlert>
            <a
              :href="'tel:' + settingsStore.phone1Clean"
              class="flex items-center justify-center gap-2 min-h-12 rounded-2xl border-2 border-brand-border text-sm font-bold text-brand-dark active:scale-95"
            >
              <Phone class="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              Llamar al {{ settingsStore.contactInfo.phone1 }}
            </a>
          </template>
        </article>
      </template>
    </main>

    <HojaModal
      :abierto="!!porDescartar"
      titulo="¿Descartar esta solicitud?"
      texto-guardar="Descartar"
      @cerrar="porDescartar = null"
      @guardar="descartar"
    >
      <p class="text-base text-gray-700">
        Si la descartas no se enviará y tendrás que hacerla de nuevo. Esta acción no se puede deshacer.
      </p>
    </HojaModal>

    <ClientBottomNav />
  </div>
</template>
