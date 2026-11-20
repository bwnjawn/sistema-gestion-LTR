<template>
  <ProgresoRuta />
  <AvisoAccion />
  <router-view />
</template>

<script setup lang="ts">
// Punto de montaje global para Vue Router
import ProgresoRuta from './components/ui/ProgresoRuta.vue'
import AvisoAccion from './components/ui/AvisoAccion.vue'
</script>
