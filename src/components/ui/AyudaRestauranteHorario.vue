<script setup lang="ts">
import { useSettingsStore } from '../../stores/settingsStore'

// Ayuda del paso 1 de restaurante; el marco (modal) lo pone ModalAyuda.
const settingsStore = useSettingsStore()
</script>

<template>
  <ul class="space-y-3 text-sm text-gray-700">
    <li>
      <b class="font-bold text-brand-dark">Comidas.</b>
      Toca Desayuno, Almuerzo o Once. Puedes reservar una o varias el mismo día.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Hora.</b>
      Cada comida tiene su propio horario. Elige la hora de llegada de la lista de esa comida.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Cupo.</b>
      El cupo se cuenta por comida. Si una está llena ese día, te avisamos para que cambies la fecha o la comida.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Comensales.</b>
      Pueden ser hasta {{ settingsStore.restaurantCapacity }} personas por comida.
    </li>
  </ul>
</template>
