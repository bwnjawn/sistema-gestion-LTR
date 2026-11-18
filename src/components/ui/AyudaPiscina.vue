<script setup lang="ts">
import { formatCLP } from '../../lib/format'
import { useSettingsStore } from '../../stores/settingsStore'

// Ayuda del paso 1 de piscina; el marco (modal) lo pone ModalAyuda. El precio sale de Ajustes.
const settingsStore = useSettingsStore()
</script>

<template>
  <ul class="space-y-3 text-sm text-gray-700">
    <li>
      <b class="font-bold text-brand-dark">Solo para la piscina.</b>
      Si reservas una cabaña, camping o restaurante, la piscina es gratis y no necesitas esta opción.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Precio.</b>
      La entrada cuesta {{ formatCLP(settingsStore.poolEntryPrice) }} por persona. Se paga al llegar, sin abono.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Aviso, no reserva.</b>
      Tu solicitud solo nos avisa que vienes: queda registrada y no hace falta que la confirmemos.
    </li>
  </ul>
</template>
