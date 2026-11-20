<script setup lang="ts">
// Esqueleto del Inicio del administrador: imita los dos contadores, el total proyectado y los accesos (SCRUM-258).
import EsqueletoBloque from '../ui/EsqueletoBloque.vue'
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-3">
      <div v-for="n in 2" :key="n" class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-2.5">
        <EsqueletoBloque class="h-7 w-3/5 !rounded-full" />
        <EsqueletoBloque class="h-9 w-2/5" />
        <EsqueletoBloque class="h-4 w-11/12" />
      </div>
    </div>
    <EsqueletoBloque class="h-[72px] !rounded-3xl" />
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <EsqueletoBloque class="h-6 w-1/2" />
      <EsqueletoBloque v-for="n in 3" :key="n" class="h-14 !rounded-2xl" />
    </div>
  </div>
</template>
