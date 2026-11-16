<script setup lang="ts">
// Contenido de la ayuda de Solicitudes; el marco (modal) lo pone ModalAyuda.
import EstadoSolicitud from './EstadoSolicitud.vue'
</script>

<template>
  <ul class="space-y-3.5 text-sm text-gray-700">
    <li class="flex items-start gap-3">
      <span class="shrink-0 w-28"><EstadoSolicitud status="pending" /></span>
      <p>Espera tu decisión. No bloquea fechas: si otra solicitud pide el mismo día, conviven hasta que confirmes una.</p>
    </li>
    <li class="flex items-start gap-3">
      <span class="shrink-0 w-28"><EstadoSolicitud status="pending" por-mover /></span>
      <p>Su fecha ya la ocupa una reserva confirmada, así que no se puede aprobar. Mueve la fecha (puedes avisar antes al cliente) o recházala.</p>
    </li>
    <li class="flex items-start gap-3">
      <span class="shrink-0 w-28"><EstadoSolicitud status="confirmed" /></span>
      <p>Reserva lista: bloquea fechas y cupos. Si le falta abono, se avisa en la tarjeta.</p>
    </li>
    <li class="flex items-start gap-3">
      <span class="shrink-0 w-28"><EstadoSolicitud status="rejected" /></span>
      <p>Rechazada por ti o cancelada por abono vencido. Ya no hay nada que hacer y el cliente debe volver a solicitar.</p>
    </li>
    <li class="border-t-2 border-brand-border/40 pt-3.5">
      <p><b class="font-bold text-brand-dark">Franja de color.</b> El borde izquierdo de cada tarjeta repite el estado: ámbar pendiente, rojo por mover, verde confirmada, gris descartada.</p>
    </li>
    <li>
      <p><b class="font-bold text-brand-dark">Aviso bajo la tarjeta.</b> Muestra solo lo más importante: fecha ocupada, cruce con otras solicitudes, abono vencido, más de 24 horas sin gestionar o plazo para abonar.</p>
    </li>
    <li>
      <p><b class="font-bold text-brand-dark">Filtros.</b> Estado, servicio y búsqueda. "Por mover" aparece solo si hay alguna y no se combina con el filtro de estado.</p>
    </li>
  </ul>
</template>
