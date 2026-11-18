<script setup lang="ts">
import { useSettingsStore } from '../../stores/settingsStore'

// Ayuda del paso 2 de restaurante; el marco (modal) lo pone ModalAyuda. Los límites salen de Ajustes.
const settingsStore = useSettingsStore()
</script>

<template>
  <ul class="space-y-3 text-sm text-gray-700">
    <li>
      <b class="font-bold text-brand-dark">Platos.</b>
      En cada comida, elige un plato por cada comensal. Puedes combinar platos distintos.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Acompañamientos.</b>
      Solo el almuerzo los lleva. Si un plato permite elegir, reparte los acompañamientos entre tus platos: la suma debe ser igual a la cantidad de ese plato.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Grupos grandes.</b>
      Con más de {{ settingsStore.limiteVariedades.umbralPersonas }} personas, se pueden elegir hasta {{ settingsStore.limiteVariedades.maxVariedades }} platos distintos por comida.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Varias comidas.</b>
      Si reservaste más de una, cambia entre ellas con las pestañas de arriba.
    </li>
  </ul>
</template>
