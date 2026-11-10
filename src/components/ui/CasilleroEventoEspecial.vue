<script setup lang="ts">
import { useReservationStore } from '../../stores/reservationStore'

// Solo se muestra en el modo administrador (SCRUM-56). La marca queda en el borrador.
const store = useReservationStore()
</script>

<template>
  <label
    class="flex items-start gap-3 bg-white p-4 rounded-2xl border-2 border-brand-border shadow-xs cursor-pointer touch-target"
  >
    <input
      type="checkbox"
      v-model="store.isSpecialEvent"
      class="mt-0.5 w-6 h-6 shrink-0 accent-brand-dark"
    />
    <span class="space-y-0.5">
      <span class="block text-base font-black text-brand-dark">Evento especial</span>
      <span class="block text-sm font-bold text-gray-600">
        Marca la reserva como evento especial. Por ahora solo queda registrada en la lista.
      </span>
    </span>
  </label>
</template>
