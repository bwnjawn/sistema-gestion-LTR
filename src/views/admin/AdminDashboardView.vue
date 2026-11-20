<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Inbox, Calendar, Grid, ArrowRight, CheckCircle2, Clock
} from 'lucide-vue-next'
import { useRequestsStore } from '../../stores/requestsStore'
import { pendientesRecientes, proximasReservas } from '../../services/resumenInicio'
import { SERVICE_LABELS } from '../../services/requests'
import { formatDateShort, todayISO } from '../../lib/dates'
import { formatCLP } from '../../lib/format'
import AvisoConflictos from '../../components/admin/AvisoConflictos.vue'
import CargaDatosAdmin from '../../components/admin/CargaDatosAdmin.vue'
import EsqueletoInicioAdmin from '../../components/admin/EsqueletoInicioAdmin.vue'

const router = useRouter()
const requestsStore = useRequestsStore()

const pendingRequests = computed(() => requestsStore.requests.filter(r => r.status === 'pending'))
const confirmedRequests = computed(() => requestsStore.requests.filter(r => r.status === 'confirmed'))

const totalRevenue = computed(() => {
  return confirmedRequests.value.reduce((acc, r) => acc + (r.totalAmount || 0), 0)
})

// Listas del Inicio en PC (en teléfono no se muestran)
const porResolver = computed(() => pendientesRecientes(requestsStore.requests, 6))
const proximas = computed(() => proximasReservas(requestsStore.requests, todayISO(), 6))

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <CargaDatosAdmin>
    <template #esqueleto><EsqueletoInicioAdmin /></template>
  <div class="space-y-4 max-w-md lg:max-w-none mx-auto w-full pb-28">
    <!-- Confirmaciones hechas sin conexión que chocaron con otra reserva al sincronizar (SCRUM-250) -->
    <AvisoConflictos />

    <!-- Métricas Generales -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
      <div
        @click="navigateTo('/admin/solicitudes?estado=pending')"
        class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs cursor-pointer hover:border-brand-dark transition-all"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
            Pendientes
          </span>
          <Clock class="w-4 h-4 text-amber-600 stroke-[2.5]" />
        </div>
        <span class="text-3xl font-bold text-brand-dark block">{{ pendingRequests.length }}</span>
        <span class="text-base text-gray-700">Solicitudes por revisar</span>
      </div>

      <div
        @click="navigateTo('/admin/solicitudes?estado=confirmed')"
        class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs cursor-pointer hover:border-brand-dark transition-all"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
            Confirmadas
          </span>
          <CheckCircle2 class="w-4 h-4 text-emerald-600 stroke-[2.5]" />
        </div>
        <span class="text-3xl font-bold text-brand-dark block">{{ confirmedRequests.length }}</span>
        <span class="text-base text-gray-700">Reservas activas</span>
      </div>

    <!-- Tarjeta de Ingresos Estimados -->
    <div class="col-span-2 lg:col-span-1 bg-emerald-900 text-white p-4 rounded-3xl border-2 border-emerald-950 shadow-xs flex items-center justify-between">
      <div>
        <span class="text-sm font-bold text-emerald-300 block">Total Proyectado</span>
        <span class="text-xl font-bold text-white">{{ formatCLP(totalRevenue) }}</span>
      </div>
      <span class="text-sm font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">
        {{ confirmedRequests.length }} confirmadas
      </span>
    </div>
    </div>

    <!-- Solo en PC: lo que hay que resolver y lo que viene -->
    <div class="hidden lg:grid lg:grid-cols-5 lg:gap-4 lg:items-start">
      <section class="col-span-3 bg-white p-6 rounded-3xl border-2 border-brand-border shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-bold text-brand-dark">Por resolver</h2>
          <button type="button" class="text-base font-bold text-brand-accent underline" @click="navigateTo('/admin/solicitudes?estado=pending')">Ver todas</button>
        </div>
        <ul v-if="porResolver.length > 0" class="divide-y divide-brand-border/50">
          <li v-for="r in porResolver" :key="r.id">
            <button type="button" class="w-full flex items-center gap-4 py-3 px-2 text-left rounded-xl hover:bg-brand-light" @click="navigateTo('/admin/solicitudes?estado=pending')">
              <span class="min-w-0 grow">
                <span class="block text-base font-bold text-brand-dark truncate">{{ r.clientName }}</span>
                <span class="block text-sm text-gray-600 truncate">{{ SERVICE_LABELS[r.type] }} · {{ r.resourceName }} · {{ formatDateShort(r.date) }}</span>
              </span>
              <span class="text-base font-bold text-brand-dark shrink-0">{{ formatCLP(r.totalAmount) }}</span>
            </button>
          </li>
        </ul>
        <p v-else class="text-base text-gray-600">No hay solicitudes por revisar.</p>
      </section>

      <section class="col-span-2 bg-white p-6 rounded-3xl border-2 border-brand-border shadow-xs">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xl font-bold text-brand-dark">Próximas reservas</h2>
          <button type="button" class="text-base font-bold text-brand-accent underline" @click="navigateTo('/admin/calendario')">Ver calendario</button>
        </div>
        <ul v-if="proximas.length > 0" class="divide-y divide-brand-border/50">
          <li v-for="r in proximas" :key="r.id" class="flex items-center gap-4 py-3 px-2">
            <span class="shrink-0 w-20 text-base font-bold text-brand-dark">{{ formatDateShort(r.date) }}</span>
            <span class="min-w-0 grow">
              <span class="block text-base text-brand-dark truncate">{{ r.clientName }}</span>
              <span class="block text-sm text-gray-600 truncate">{{ SERVICE_LABELS[r.type] }} · {{ r.resourceName }}</span>
            </span>
          </li>
        </ul>
        <p v-else class="text-base text-gray-600">No hay reservas confirmadas por venir.</p>
      </section>
    </div>

    <!-- Accesos Rápidos Directos (en PC están en el menú lateral) -->
    <div class="lg:hidden bg-white p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <h2 class="text-lg font-bold text-brand-dark">Gestión rápida</h2>

      <div class="space-y-2">
        <button
          type="button"
          @click="navigateTo('/admin/solicitudes')"
          class="w-full p-3.5 bg-brand-light hover:bg-gray-200 border-2 border-brand-border rounded-2xl flex items-center justify-between text-base font-bold text-brand-dark transition-all touch-target"
        >
          <div class="flex items-center gap-2.5">
            <Inbox class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            <span>Ver Solicitudes de Clientes</span>
          </div>
          <ArrowRight class="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          @click="navigateTo('/admin/calendario')"
          class="w-full p-3.5 bg-brand-light hover:bg-gray-200 border-2 border-brand-border rounded-2xl flex items-center justify-between text-base font-bold text-brand-dark transition-all touch-target"
        >
          <div class="flex items-center gap-2.5">
            <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            <span>Calendario de Ocupación</span>
          </div>
          <ArrowRight class="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          @click="navigateTo('/admin/catalogo')"
          class="w-full p-3.5 bg-brand-light hover:bg-gray-200 border-2 border-brand-border rounded-2xl flex items-center justify-between text-base font-bold text-brand-dark transition-all touch-target"
        >
          <div class="flex items-center gap-2.5">
            <Grid class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            <span>Editar Precios y Cabañas</span>
          </div>
          <ArrowRight class="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>

  </div>
  </CargaDatosAdmin>
</template>