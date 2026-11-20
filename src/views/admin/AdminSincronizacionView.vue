<script setup lang="ts">
import { ref } from 'vue'
import { CloudOff, RotateCw, Trash2 } from 'lucide-vue-next'
import BaseAlert from '../../components/ui/BaseAlert.vue'
import BaseButton from '../../components/ui/BaseButton.vue'
import HojaModal from '../../components/ui/HojaModal.vue'
import { useCambiosAdminStore } from '../../stores/cambiosAdminStore'
import { formatDateTime } from '../../lib/dates'
import type { CambioEnCola } from '../../services/cambiosAdmin'

// Cambios hechos sin conexión que aún no llegaron al servidor (SCRUM-250). Se envían solos al volver la señal;
// uno que el servidor rechaza queda aquí con el motivo hasta que el administrador lo descarte.
const cambios = useCambiosAdminStore()
const porDescartar = ref<CambioEnCola | null>(null)

async function descartar() {
  const c = porDescartar.value
  porDescartar.value = null
  if (c) await cambios.descartar(c.id)
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    <div v-if="cambios.entradas.length === 0" class="bg-white p-5 rounded-3xl border-2 border-brand-border text-center space-y-2">
      <p class="text-base font-black text-brand-dark">Todo está sincronizado</p>
      <p class="text-sm font-bold text-gray-700">Lo que hagas sin conexión aparecerá aquí hasta que llegue al servidor.</p>
    </div>

    <template v-else>
      <BaseAlert v-if="cambios.pendientes.length > 0" variant="info" title="Esperando conexión">
        Se envían solos, en el orden en que los hiciste, cuando vuelva la señal. Si una confirmación choca con otra reserva, no se pierde: queda pendiente y marcada "En conflicto".
      </BaseAlert>

      <BaseButton
        v-if="cambios.pendientes.length > 0"
        variant="primary"
        size="lg"
        full-width
        :loading="cambios.sincronizando"
        @click="cambios.reintentar()"
      >
        <RotateCw class="w-5 h-5 mr-1.5 stroke-[2.5]" aria-hidden="true" />
        Sincronizar ahora
      </BaseButton>

      <article v-for="c in cambios.entradas" :key="c.id" class="bg-white p-4 rounded-3xl border-2 border-brand-border space-y-2">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-base font-black text-brand-dark leading-tight">{{ c.resumen }}</h2>
            <p class="text-sm text-gray-600">Hecho el {{ formatDateTime(c.creadoEn) }}</p>
          </div>
          <button
            v-if="c.estado === 'rechazado'"
            type="button"
            class="touch-target shrink-0 inline-flex items-center justify-center rounded-full text-gray-600 active:scale-95"
            aria-label="Descartar este cambio"
            @click="porDescartar = c"
          >
            <Trash2 class="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>

        <p v-if="c.estado === 'pendiente'" class="flex items-center gap-2 text-sm font-black text-sky-900">
          <CloudOff class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
          Sin sincronizar
        </p>
        <BaseAlert v-else variant="danger" title="No se pudo enviar">
          <p>{{ c.motivo }}</p>
          <p class="mt-1">El cambio no se aplicó en el servidor. Descártalo para ver la reserva como está allá y vuelve a hacerlo si hace falta.</p>
        </BaseAlert>
      </article>
    </template>

    <HojaModal
      :abierto="!!porDescartar"
      titulo="¿Descartar este cambio?"
      texto-guardar="Descartar"
      @cerrar="porDescartar = null"
      @guardar="descartar"
    >
      <p class="text-base text-gray-700">
        El cambio no se aplicará y la reserva volverá a verse como está en el servidor. Esta acción no se puede deshacer.
      </p>
    </HojaModal>
  </div>
</template>
