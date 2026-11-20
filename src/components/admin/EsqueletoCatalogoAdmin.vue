<script setup lang="ts">
// Esqueleto del Catálogo del administrador: imita las pestañas y una lista de elementos (SCRUM-258).
import EsqueletoBloque from '../ui/EsqueletoBloque.vue'
</script>

<template>
  <div class="space-y-4">
    <div class="bg-white p-2 rounded-3xl border-2 border-brand-border shadow-2xs">
      <div class="grid grid-cols-3 gap-1.5 p-1">
        <EsqueletoBloque v-for="n in 3" :key="n" class="h-12 !rounded-2xl" />
      </div>
    </div>
    <div v-for="n in 4" :key="n" class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs flex items-center gap-3">
      <EsqueletoBloque class="h-16 w-16 shrink-0 !rounded-2xl" />
      <div class="flex-1 space-y-2">
        <EsqueletoBloque class="h-5 w-3/5" />
        <EsqueletoBloque class="h-4 w-4/5" />
      </div>
      <EsqueletoBloque class="h-10 w-10 shrink-0" />
    </div>
  </div>
</template>
