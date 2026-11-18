<script setup lang="ts">
import { useSettingsStore } from '../../stores/settingsStore'

// Ayuda de Ajustes; el marco (modal) lo pone ModalAyuda. Los valores salen de la configuración.
const settingsStore = useSettingsStore()
</script>

<template>
  <ul class="space-y-3 text-sm text-gray-700">
    <li>
      <b class="font-bold text-brand-dark">Lo que ve el cliente.</b>
      Los datos de contacto, los horarios y los datos de transferencia se muestran en la app. El cliente ve la transferencia en el último paso de su solicitud.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Abono y plazo.</b>
      Hoy se pide el {{ settingsStore.defaultDepositPercentage }}% del total y el cliente tiene {{ settingsStore.depositDeadlineHours }} horas para transferir. Pasado el plazo, la solicitud se marca "Abono vencido" y tú decides: contactar, esperar o cancelar. Nunca se cancela sola.
    </li>
    <li>
      <b class="font-bold text-brand-dark">IVA y piscina.</b>
      El IVA ({{ settingsStore.ivaPercentage }}%) se suma al subtotal. La entrada a la piscina es un valor final por persona, sin abono.
    </li>
    <li>
      <b class="font-bold text-brand-dark">Cupos y menús.</b>
      Los cupos de camping y restaurante bloquean las fechas llenas en el calendario del cliente. En grupos grandes se limita la cantidad de menús distintos por comida.
    </li>
    <li class="border-t-2 border-brand-border/40 pt-3.5">
      <b class="font-bold text-brand-dark">Administradores.</b>
      Es la lista de quienes tienen acceso a este panel.
    </li>
  </ul>
</template>
