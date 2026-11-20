<script setup lang="ts">
// Aviso global que confirma lo que pasó con una acción (SCRUM-288): barra de ancho completo pegada bajo el
// encabezado, como la de "Sin conexión". Los colores copian los de las insignias de estado: verde = se guardó o se
// aprobó algo · gris = se rechazó, canceló o quitó algo ("Descartada") · ámbar = quedó bien pero pide revisar algo ·
// azul = guardado solo en este teléfono, se enviará al volver la señal · rojo = no se guardó. Lo llenan los stores
// con `lib/avisos.ts`.
// Va por encima de las hojas (z-60) para que se vea aunque haya una abierta.
import { computed, nextTick, ref, watch } from 'vue'
import { AlertTriangle, CheckCircle2, Clock, CloudOff, X, XCircle } from 'lucide-vue-next'
import { aviso, descartarAviso } from '../../lib/avisos'

const arriba = ref(0)

// Se pega justo debajo del encabezado de la pantalla (el del cliente o el del administrador); sin encabezado, arriba de todo
watch(() => aviso.value?.id, async () => {
  if (!aviso.value) return
  await nextTick()
  const encabezado = document.querySelector('header')
  arriba.value = encabezado ? Math.max(0, Math.round(encabezado.getBoundingClientRect().bottom)) : 0
}, { flush: 'post' })

const estilo = computed(() => {
  switch (aviso.value?.tipo) {
    case 'exito': return { clase: 'bg-emerald-50 border-status-success text-emerald-950', icono: CheckCircle2 }
    case 'descartado': return { clase: 'bg-gray-100 border-gray-500 text-gray-900', icono: XCircle }
    case 'atencion': return { clase: 'bg-amber-50 border-amber-600 text-amber-950', icono: Clock }
    case 'cola': return { clase: 'bg-sky-100 border-sky-700 text-sky-950', icono: CloudOff }
    default: return { clase: 'bg-rose-50 border-status-danger text-rose-950', icono: AlertTriangle }
  }
})
</script>

<template>
  <Transition name="aviso">
    <div
      v-if="aviso"
      :key="aviso.id"
      :role="aviso.tipo === 'error' ? 'alert' : 'status'"
      :aria-live="aviso.tipo === 'error' ? 'assertive' : 'polite'"
      :class="['fixed left-0 right-0 z-[60] border-y-2 shadow-lg', estilo.clase, arriba === 0 ? 'pt-[env(safe-area-inset-top)]' : '']"
      :style="{ top: arriba + 'px' }"
    >
      <div class="max-w-md mx-auto px-4 py-2.5 flex items-start gap-3">
        <component :is="estilo.icono" class="w-6 h-6 shrink-0 mt-0.5 stroke-[2.5]" aria-hidden="true" />
        <div class="grow min-w-0">
          <p class="text-base font-bold leading-snug">{{ aviso.titulo }}</p>
          <p v-if="aviso.detalle" class="text-base leading-snug">{{ aviso.detalle }}</p>
        </div>
        <button
          type="button"
          aria-label="Cerrar aviso"
          class="w-11 h-11 -my-1.5 -mr-2 rounded-full flex items-center justify-center shrink-0 active:bg-black/10"
          @click="descartarAviso"
        >
          <X class="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.aviso-enter-active,
.aviso-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.aviso-enter-from,
.aviso-leave-to {
  opacity: 0;
  transform: translateY(-0.5rem);
}
@media (prefers-reduced-motion: reduce) {
  .aviso-enter-active,
  .aviso-leave-active {
    transition: none;
  }
}
</style>
