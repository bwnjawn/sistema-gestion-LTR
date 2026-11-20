<script setup lang="ts">
// Ajustes → Contenido para el cliente: el reglamento del camping (PDF) y las fotos de las tarjetas del inicio.
import AdminReglamentoCard from '../../../components/admin/AdminReglamentoCard.vue'
import AdminFotosInicioCard from '../../../components/admin/AdminFotosInicioCard.vue'
import AjustesVolver from '../../../components/admin/AjustesVolver.vue'
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-20">
    <AjustesVolver />
    <AdminReglamentoCard />
    <AdminFotosInicioCard />
  </div>
</template>
