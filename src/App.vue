<template>
  <ProgresoRuta />
  <PanelDepuracion />
  <router-view />
</template>

<script setup lang="ts">
// Punto de montaje global para Vue Router
import ProgresoRuta from './components/ui/ProgresoRuta.vue'
import PanelDepuracion from './components/ui/PanelDepuracion.vue'
</script>
