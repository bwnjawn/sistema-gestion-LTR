<template>
  <ProgresoRuta />
  <AvisoErrores />
  <router-view />
</template>

<script setup lang="ts">
// Punto de montaje global para Vue Router
import ProgresoRuta from './components/ui/ProgresoRuta.vue'
import AvisoErrores from './components/ui/AvisoErrores.vue'
</script>
