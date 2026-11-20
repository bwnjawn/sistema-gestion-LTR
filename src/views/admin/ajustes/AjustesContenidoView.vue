<script setup lang="ts">
// Ajustes → Contenido para el cliente: el reglamento del camping (PDF) y las fotos de las tarjetas del inicio.
import AdminReglamentoCard from '../../../components/admin/AdminReglamentoCard.vue'
import AdminFotosInicioCard from '../../../components/admin/AdminFotosInicioCard.vue'
import AjustesVolver from '../../../components/admin/AjustesVolver.vue'
</script>

<template>
  <div class="space-y-4 max-w-md lg:max-w-none mx-auto w-full pb-20 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">
    <AjustesVolver class="lg:col-span-full" />
    <AdminReglamentoCard />
    <AdminFotosInicioCard />
  </div>
</template>
