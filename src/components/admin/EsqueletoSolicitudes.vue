<script setup lang="ts">
// Esqueleto de la lista de Solicitudes: imita los filtros y tres tarjetas (SCRUM-258).
import EsqueletoBloque from '../ui/EsqueletoBloque.vue'
</script>

<template>
  <div class="space-y-3">
    <div class="bg-white p-3 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="grid grid-cols-3 gap-1.5">
        <EsqueletoBloque v-for="n in 3" :key="n" class="h-14 !rounded-2xl" />
      </div>
      <div class="flex justify-center gap-2 pt-3 border-t-2 border-brand-border/40">
        <EsqueletoBloque v-for="n in 5" :key="n" class="h-10 w-10 !rounded-2xl" />
      </div>
    </div>
    <div v-for="n in 3" :key="n" class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-2.5">
      <div class="flex items-center justify-between gap-3">
        <EsqueletoBloque class="h-6 w-1/2" />
        <EsqueletoBloque class="h-7 w-24 !rounded-full" />
      </div>
      <EsqueletoBloque class="h-4 w-3/4" />
      <EsqueletoBloque class="h-4 w-3/5" />
      <div class="grid grid-cols-2 gap-2 pt-1">
        <EsqueletoBloque class="h-11" />
        <EsqueletoBloque class="h-11" />
      </div>
    </div>
  </div>
</template>
