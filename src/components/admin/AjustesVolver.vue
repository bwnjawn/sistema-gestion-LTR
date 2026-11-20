<script setup lang="ts">
// Vínculo para volver a la lista de Ajustes desde una de sus secciones.
import { ChevronLeft } from 'lucide-vue-next'
</script>

<template>
  <router-link
    :to="{ name: 'admin-settings' }"
    class="inline-flex items-center gap-1 -ml-1 pr-3 min-h-12 text-lg font-bold text-brand-dark"
  >
    <ChevronLeft class="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
    Ajustes
  </router-link>
</template>
