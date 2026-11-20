<script setup lang="ts">
// Esqueleto del Calendario del administrador: imita los filtros y la grilla del mes (SCRUM-258).
import EsqueletoBloque from '../ui/EsqueletoBloque.vue'
</script>

<template>
  <div class="space-y-4">
    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs">
      <div class="flex justify-center gap-2">
        <EsqueletoBloque v-for="n in 4" :key="n" class="h-10 w-16 !rounded-2xl" />
      </div>
    </div>
    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <EsqueletoBloque class="h-10 w-10" />
        <EsqueletoBloque class="h-6 w-1/3" />
        <EsqueletoBloque class="h-10 w-10" />
      </div>
      <div class="grid grid-cols-7 gap-1.5">
        <EsqueletoBloque v-for="n in 35" :key="n" class="h-11 !rounded-xl" />
      </div>
    </div>
  </div>
</template>
