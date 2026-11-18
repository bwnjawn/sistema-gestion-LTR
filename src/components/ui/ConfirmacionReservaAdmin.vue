<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, FileCheck, Plus, ListChecks } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'
import CotizacionAcciones from '../admin/CotizacionAcciones.vue'
import { useReservationStore } from '../../stores/reservationStore'
import { useRequestsStore } from '../../stores/requestsStore'
import { useSalidaReserva } from '../../composables/useSalidaReserva'
import { puedeCotizarse } from '../../services/cotizacion'
import { formatCLP } from '../../lib/format'

// Pantalla final del administrador (SCRUM-56): confirma que la reserva quedó cargada.
// No habla con el cliente por sí sola: solo ofrece la cotización (SCRUM-71) para que el admin la mande.
const props = defineProps<{
  codigo: string
  servicio: string
  fechas: string
  total: number
}>()

const router = useRouter()
const store = useReservationStore()
const requestsStore = useRequestsStore()

// La solicitud recién creada, para cotizarla desde aquí
const solicitudCreada = computed(() => requestsStore.requests.find(r => r.requestCode === props.codigo) ?? null)
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
      <div class="inline-flex items-center gap-1.5 bg-brand-light border border-brand-border px-3.5 py-1 rounded-full text-sm font-bold text-brand-dark">
        <FileCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" aria-hidden="true" />
        <span>Código: {{ codigo }}</span>
      </div>
      <h2 class="text-2xl font-bold text-brand-dark tracking-tight">Reserva registrada</h2>
      <p class="text-base text-gray-700">
        <template v-if="store.estadoUltimaReservaAdmin === 'pending'">
          Quedó <strong class="font-bold text-brand-dark">pendiente de abono</strong> en la lista de solicitudes. No retiene fechas hasta que la confirmes.
        </template>
        <template v-else>
          Quedó <strong class="font-bold text-brand-dark">confirmada</strong> en la lista de solicitudes.
        </template>
        <template v-if="store.isSpecialEvent"> Marcada como evento especial.</template>
      </p>
    </div>

    <div class="bg-brand-light p-4 rounded-2xl border border-brand-border text-left space-y-2 text-sm text-gray-700">
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Cliente:</span>
        <span class="text-brand-dark font-bold text-right">{{ store.clientName || 'Sin nombre' }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Teléfono:</span>
        <span class="text-brand-dark font-bold text-right">{{ store.clientPhone }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Servicio:</span>
        <span class="text-brand-dark font-bold text-right">{{ servicio }}</span>
      </div>
      <div class="flex justify-between gap-2">
        <span class="text-gray-500">Fechas:</span>
        <span class="text-brand-dark font-bold text-right">{{ fechas }}</span>
      </div>
      <div class="flex justify-between border-t border-gray-200/60 pt-2 mt-1">
        <span class="text-gray-500">Total:</span>
        <span class="text-brand-dark font-bold">{{ formatCLP(total) }}</span>
      </div>
      <p class="text-sm text-gray-700 pt-1">
        {{ store.adminAbonoMonto ? 'El abono recibido quedó registrado. Puedes anotar más pagos desde el detalle.' : 'Aún no tiene pagos registrados. Anota el abono desde el detalle de la reserva.' }}
      </p>
    </div>

    <div v-if="solicitudCreada && puedeCotizarse(solicitudCreada)" class="text-left">
      <CotizacionAcciones :request="solicitudCreada" />
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
