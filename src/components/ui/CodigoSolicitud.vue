<script setup lang="ts">
import { CloudOff, FileCheck } from 'lucide-vue-next'

// Código de la solicitud en la pantalla de confirmación. Sin código (cadena vacía) la solicitud quedó guardada en
// el teléfono por falta de señal (SCRUM-250): el código lo asigna el servidor cuando se envía.
defineProps<{ codigo: string }>()
</script>

<template>
  <div
    v-if="codigo"
    class="inline-flex items-center gap-1.5 bg-brand-light border border-brand-border px-3.5 py-1 rounded-full text-sm font-bold text-brand-dark shadow-2xs"
  >
    <FileCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" aria-hidden="true" />
    <span>Código: {{ codigo }}</span>
  </div>

  <div v-else role="status" class="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 text-left space-y-1.5 text-amber-950">
    <p class="flex items-center gap-2 text-sm font-bold">
      <CloudOff class="w-5 h-5 stroke-[2.5] shrink-0" aria-hidden="true" />
      Guardada en este teléfono
    </p>
    <p class="text-sm font-bold leading-relaxed">
      No hay señal, así que tu solicitud todavía no llegó. Se enviará sola cuando vuelva la conexión y ahí recibirás su código.
      Mantén la aplicación abierta o vuelve a abrirla con señal.
    </p>
    <RouterLink to="/pendientes" class="inline-block text-sm font-bold underline py-1">Ver solicitudes por enviar</RouterLink>
  </div>
</template>
