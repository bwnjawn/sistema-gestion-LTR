<script setup lang="ts">
// Ajustes → Avisos: activar o desactivar las notificaciones de solicitudes nuevas en este dispositivo (SCRUM-68).
import { onMounted, onUnmounted } from 'vue'
import { Bell, BellOff, BellRing } from 'lucide-vue-next'
import { useAvisosPushStore } from '../../../stores/avisosPushStore'
import AjustesVolver from '../../../components/admin/AjustesVolver.vue'

const avisos = useAvisosPushStore()

// El permiso se cambia fuera de la app (ajustes del teléfono): al volver a esta pantalla se vuelve a mirar
function alVolver() {
  if (document.visibilityState === 'visible') void avisos.actualizar()
}

onMounted(() => {
  void avisos.actualizar()
  document.addEventListener('visibilitychange', alVolver)
})
onUnmounted(() => document.removeEventListener('visibilitychange', alVolver))
</script>

<template>
  <div class="space-y-4 max-w-md lg:max-w-none mx-auto w-full pb-20 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">
    <AjustesVolver class="lg:col-span-full" />

    <section class="bg-white p-4 sm:p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-4" aria-labelledby="titulo-avisos">
      <div class="flex items-center gap-2">
        <Bell class="w-4 h-4 text-brand-accent stroke-[2.5]" aria-hidden="true" />
        <h3 id="titulo-avisos" class="text-base font-bold text-brand-dark">Avisos de solicitudes nuevas</h3>
      </div>

      <p v-if="avisos.cargando" class="text-base text-gray-700" role="status">Revisando este dispositivo…</p>

      <template v-else>
        <div class="bg-brand-light p-3 rounded-2xl border border-brand-border space-y-1" role="status">
          <p class="flex items-center gap-2 font-bold text-brand-dark">
            <BellRing v-if="avisos.estado === 'activado'" class="w-5 h-5 text-brand-accent stroke-[2.5] shrink-0" aria-hidden="true" />
            <BellOff v-else class="w-5 h-5 text-gray-600 stroke-[2.5] shrink-0" aria-hidden="true" />
            {{ avisos.texto.titulo }}
          </p>
          <p class="text-base text-gray-700">{{ avisos.texto.detalle }}</p>
        </div>

        <button
          v-if="avisos.estado === 'desactivado'"
          type="button"
          :disabled="avisos.trabajando"
          class="w-full py-3 rounded-xl bg-brand-dark text-white font-bold disabled:opacity-50"
          @click="avisos.activar()"
        >
          {{ avisos.trabajando ? 'Activando…' : 'Activar avisos en este dispositivo' }}
        </button>
        <button
          v-else-if="avisos.estado === 'activado'"
          type="button"
          :disabled="avisos.trabajando"
          class="w-full py-3 rounded-xl border border-brand-dark text-brand-dark font-bold disabled:opacity-50"
          @click="avisos.desactivar()"
        >
          {{ avisos.trabajando ? 'Desactivando…' : 'Desactivar avisos en este dispositivo' }}
        </button>

        <p class="text-sm text-gray-600">
          Cada administrador activa los avisos en sus propios dispositivos. Los avisos no llevan teléfono, correo ni precios: esos datos se ven al abrir la solicitud.
        </p>
      </template>
    </section>
  </div>
</template>
