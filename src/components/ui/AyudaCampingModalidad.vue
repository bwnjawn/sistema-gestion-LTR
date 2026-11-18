<script setup lang="ts">
import { useSettingsStore } from '../../stores/settingsStore'

// Ayuda del paso 1 de camping; el marco (modal) lo pone ModalAyuda. Los horarios salen de Ajustes.
const settingsStore = useSettingsStore()
</script>

<template>
  <ul class="space-y-3 text-sm text-gray-700">
    <li>
      <b class="font-bold text-brand-dark">Paseo por el día.</b>
      Entras a las {{ settingsStore.campingSchedules.diario.checkIn }} y te vas ese mismo día a las {{ settingsStore.campingSchedules.diario.checkOut }} hrs.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Pernoctar.</b>
      Armas tu carpa: entras a las {{ settingsStore.campingSchedules.pernoctar.checkIn }} y sales a las {{ settingsStore.campingSchedules.pernoctar.checkOut }} hrs del día siguiente.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Tu espacio.</b>
      No lo eliges: se asigna solo según el tamaño de tu grupo y la modalidad.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Cupo.</b>
      El paseo por el día y el pernoctar tienen cupos separados. Si tu fecha está llena, te avisamos y puedes elegir otra.
    </li>
  </ul>
</template>
