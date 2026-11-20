<script setup lang="ts">
// Panel "Tu reserva" al lado de los pasos, solo en PC (desde 1024 px, SCRUM-278). En el teléfono no hay espacio
// y cada paso ya muestra lo suyo. Lee el borrador del store; no guarda nada.
import { computed } from 'vue'
import { useReservationStore } from '../../stores/reservationStore'
import { useCatalogStore } from '../../stores/catalogStore'
import { formatCLP } from '../../lib/format'
import { filasResumenBorrador } from '../../services/resumenBorrador'
import type { ServiceType } from '../../types/domain'

const store = useReservationStore()
const catalog = useCatalogStore()

const NOMBRE_SERVICIO: Record<ServiceType, string> = {
  cabana: 'Cabaña',
  camping: 'Camping',
  restaurante: 'Restaurante',
  piscina: 'Piscina'
}

const filas = computed(() => {
  const recurso = store.selectedService === 'cabana'
    ? catalog.cabins.find(c => c.id === store.selectedCabinId)?.name ?? ''
    : store.selectedService === 'camping'
      ? catalog.campingSites.find(s => s.id === store.selectedCampingId)?.name ?? ''
      : ''
  return filasResumenBorrador({
    servicio: store.selectedService,
    fechaInicio: store.checkInDate,
    fechaFin: store.checkOutDate,
    personas: store.guestsCount,
    recurso,
    modalidadCamping: store.campingType,
    comidas: store.selectedMealTypes
  })
})

const total = computed(() => store.priceBreakdown?.totalWithIva ?? 0)
const abono = computed(() => store.priceBreakdown?.depositAmount ?? 0)
</script>

<template>
  <aside class="hidden lg:block sticky top-24" aria-label="Resumen de tu reserva">
    <div class="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
      <div>
        <p class="text-sm text-gray-600">Tu reserva</p>
        <h2 class="text-2xl font-bold text-brand-dark leading-tight">{{ NOMBRE_SERVICIO[store.selectedService] }}</h2>
      </div>

      <dl v-if="filas.length > 0" class="divide-y divide-gray-100">
        <div v-for="fila in filas" :key="fila.etiqueta" class="flex justify-between gap-4 py-2.5">
          <dt class="text-base text-gray-600">{{ fila.etiqueta }}</dt>
          <dd class="text-base font-bold text-brand-dark text-right">{{ fila.valor }}</dd>
        </div>
      </dl>
      <p v-else class="text-base text-gray-600">Aquí irá el resumen de lo que elijas.</p>

      <div v-if="total > 0" class="border-t border-gray-200 pt-4 space-y-1.5">
        <div class="flex justify-between items-baseline gap-4">
          <span class="text-base text-gray-600">Total</span>
          <span class="text-2xl font-bold text-brand-dark">{{ formatCLP(total) }}</span>
        </div>
        <div v-if="abono > 0" class="flex justify-between items-baseline gap-4">
          <span class="text-sm text-gray-600">Abono para confirmar</span>
          <span class="text-base font-bold text-brand-accent">{{ formatCLP(abono) }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>
