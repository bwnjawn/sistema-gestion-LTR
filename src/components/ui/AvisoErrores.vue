<script setup lang="ts">
// Aviso global de error (SCRUM-246): aparece arriba cuando algo no se pudo guardar, en vez de un `alert()`.
// El texto viene de `lib/avisos.ts`, que llenan los stores cuando falla el repositorio.
import { X, AlertTriangle } from 'lucide-vue-next'
import { avisoDeError, descartarAviso } from '../../lib/avisos'
</script>

<template>
  <div
    v-if="avisoDeError"
    role="alert"
    class="fixed top-0 left-0 right-0 z-[60] px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
  >
    <div class="max-w-md mx-auto flex items-start gap-3 rounded-2xl border-2 border-status-danger bg-rose-50 p-3 shadow-2xl">
      <AlertTriangle class="w-6 h-6 text-rose-900 shrink-0 mt-0.5 stroke-[2.5]" aria-hidden="true" />
      <div class="grow space-y-0.5">
        <p class="text-base font-black text-rose-950">No se guardó el cambio</p>
        <p class="text-sm font-bold text-rose-950">{{ avisoDeError }}</p>
      </div>
      <button
        type="button"
        aria-label="Cerrar aviso"
        class="w-11 h-11 -mt-1 -mr-1 rounded-full flex items-center justify-center text-rose-950 active:bg-rose-100 shrink-0"
        @click="descartarAviso"
      >
        <X class="w-6 h-6 stroke-[2.5]" />
      </button>
    </div>
  </div>
</template>
