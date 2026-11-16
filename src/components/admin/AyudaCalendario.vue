<script setup lang="ts">
import { Layers, CalendarDays } from 'lucide-vue-next'
</script>

<template>
  <!-- Contenido de la ayuda del calendario; el marco (modal) lo pone ModalAyuda -->
  <ul class="space-y-3.5 text-sm text-gray-700">
    <li class="flex items-start gap-3">
      <span class="w-5 h-5 rounded-full bg-brand-dark shrink-0 mt-0.5" aria-hidden="true"></span>
      <p><b class="font-bold text-brand-dark">Reservas confirmadas.</b> Es el número de cada día. No suma las pendientes ni la piscina (la piscina solo cuenta con su propio filtro).</p>
    </li>
    <li class="flex items-start gap-3">
      <span class="w-5 h-5 rounded-md bg-rose-100 border-2 border-rose-300 shrink-0 mt-0.5" aria-hidden="true"></span>
      <p><b class="font-bold text-brand-dark">Lleno.</b> Fondo rojo: el servicio ya no admite más reservas. En "Todo", solo cuando todos los servicios con tope están llenos; la piscina no tiene tope.</p>
    </li>
    <li class="flex items-start gap-3">
      <span class="w-5 h-5 shrink-0 mt-0.5 flex items-center justify-center" aria-hidden="true">
        <span class="w-3 h-3 rounded-full bg-white border-2 border-amber-600"></span>
      </span>
      <p><b class="font-bold text-brand-dark">Por resolver.</b> Hay pendientes o reservas que se topan. Las pendientes no bloquean el día.</p>
    </li>
    <li class="flex items-start gap-3">
      <Layers class="w-5 h-5 text-brand-dark shrink-0 mt-0.5" aria-hidden="true" />
      <p><b class="font-bold text-brand-dark">Filtro.</b> Se ve un servicio a la vez. "Todo" es el panorama general.</p>
    </li>
    <li class="flex items-start gap-3">
      <CalendarDays class="w-5 h-5 text-brand-dark shrink-0 mt-0.5" aria-hidden="true" />
      <p><b class="font-bold text-brand-dark">Detalle.</b> Toca un día para ver el cupo de cada servicio y, al tocar uno, sus reservas.</p>
    </li>
  </ul>
</template>
