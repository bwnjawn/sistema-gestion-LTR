<script setup lang="ts">
import { useRouter } from 'vue-router'
import { CheckCircle2, FileCheck, Plus, ListChecks } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'
import { useReservationStore } from '../../stores/reservationStore'
import { useSalidaReserva } from '../../composables/useSalidaReserva'
import { formatCLP } from '../../lib/format'

// Pantalla final del administrador (SCRUM-56): confirma que la reserva quedó cargada.
// No habla con el cliente: eso es solo para el flujo público.
defineProps<{
  codigo: string
  servicio: string
  fechas: string
  total: number
}>()

const router = useRouter()
const store = useReservationStore()
const { terminar } = useSalidaReserva()

function cargarOtra() {
  store.startAdminDraft()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="bg-white p-6 rounded-3xl border-2 border-brand-border shadow-md space-y-5 text-center">
    <div class="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
      <CheckCircle2 class="w-10 h-10 stroke-[2.5]" aria-hidden="true" />
    </div>

    <div class="space-y-2.5">
      <div class="inline-flex items-center gap-1.5 bg-brand-light border border-brand-border px-3.5 py-1 rounded-full text-sm font-black text-brand-dark">
        <FileCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" aria-hidden="true" />
        <span>Código: {{ codigo }}</span>
      </div>
      <h2 class="text-2xl font-black text-brand-dark tracking-tight">Reserva registrada</h2>
      <p class="text-base font-bold text-gray-700">
        Quedó <strong class="font-black text-brand-dark">confirmada</strong> en la lista de solicitudes.
        <template v-if="store.isSpecialEvent"> Marcada como evento especial.</template>
      </p>
    </div>

    <div class="bg-brand-light p-4 rounded-2xl border border-brand-border text-left space-y-2 text-sm font-bold text-gray-700">
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Cliente:</span>
        <span class="text-brand-dark font-black text-right">{{ store.clientName || 'Sin nombre' }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Teléfono:</span>
        <span class="text-brand-dark font-black text-right">{{ store.clientPhone }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Servicio:</span>
        <span class="text-brand-dark font-black text-right">{{ servicio }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Fechas:</span>
        <span class="text-brand-dark font-black text-right">{{ fechas }}</span>
      </div>
      <div class="flex justify-between border-t border-gray-200/60 pt-2 mt-1">
        <span class="text-gray-500">Total:</span>
        <span class="text-brand-dark font-black">{{ formatCLP(total) }}</span>
      </div>
      <p class="text-sm font-bold text-gray-600 pt-1">
        Aún no tiene pagos registrados. Anota el abono desde el detalle de la reserva.
      </p>
    </div>

    <div class="space-y-2.5">
      <BaseButton variant="primary" size="lg" full-width @click="terminar">
        <ListChecks class="w-5 h-5 mr-1.5 stroke-[2.5]" aria-hidden="true" />
        Volver a solicitudes
      </BaseButton>
      <BaseButton variant="outline" size="lg" full-width @click="cargarOtra">
        <Plus class="w-5 h-5 mr-1.5 stroke-[2.5]" aria-hidden="true" />
        Cargar otra reserva
      </BaseButton>
    </div>
  </div>
</template>
