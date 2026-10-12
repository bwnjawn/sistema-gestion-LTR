<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Home, Inbox, Calendar, Grid, Settings, ArrowRight, 
  Users, CheckCircle2, Clock, AlertCircle 
} from 'lucide-vue-next'
import AdminBottomNav from '../../components/admin/AdminBottomNav.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { useCatalogStore } from '../../stores/catalogStore'
import { formatCLP } from '../../lib/format'

const router = useRouter()
const requestsStore = useRequestsStore()
const catalogStore = useCatalogStore()

const pendingRequests = computed(() => requestsStore.requests.filter(r => r.status === 'pending'))
const confirmedRequests = computed(() => requestsStore.requests.filter(r => r.status === 'confirmed'))

const totalRevenue = computed(() => {
  return confirmedRequests.value.reduce((acc, r) => acc + (r.totalAmount || 0), 0)
})

function navigateTo(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    <!-- Encabezado Inicio -->
    <div class="bg-brand-dark text-white p-5 rounded-3xl border-2 border-brand-border shadow-sm flex items-center justify-between">
      <div>
        <span class="text-[10px] font-black text-emerald-300 uppercase tracking-wider block">
          Panel Principal
        </span>
        <h1 class="text-xl font-black tracking-tight">Los Troncos de Repil</h1>
      </div>
      <div class="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
        <Home class="w-5 h-5 text-emerald-300 stroke-[2.5]" />
      </div>
    </div>

    <!-- Métricas Generales -->
    <div class="grid grid-cols-2 gap-3">
      <div 
        @click="navigateTo('/admin/solicitudes')"
        class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs cursor-pointer hover:border-brand-dark transition-all"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-black text-amber-800 uppercase bg-amber-100 px-2 py-0.5 rounded-full">
            Pendientes
          </span>
          <Clock class="w-4 h-4 text-amber-600 stroke-[2.5]" />
        </div>
        <span class="text-3xl font-black text-brand-dark block">{{ pendingRequests.length }}</span>
        <span class="text-[11px] font-bold text-gray-500">Solicitudes por revisar</span>
      </div>

      <div 
        @click="navigateTo('/admin/solicitudes')"
        class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs cursor-pointer hover:border-brand-dark transition-all"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="text-[10px] font-black text-emerald-800 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">
            Confirmadas
          </span>
          <CheckCircle2 class="w-4 h-4 text-emerald-600 stroke-[2.5]" />
        </div>
        <span class="text-3xl font-black text-brand-dark block">{{ confirmedRequests.length }}</span>
        <span class="text-[11px] font-bold text-gray-500">Reservas activas</span>
      </div>
    </div>

    <!-- Tarjeta de Ingresos Estimados -->
    <div class="bg-emerald-900 text-white p-4 rounded-3xl border-2 border-emerald-950 shadow-xs flex items-center justify-between">
      <div>
        <span class="text-[10px] font-black text-emerald-300 uppercase block">Total Proyectado</span>
        <span class="text-xl font-black text-white">{{ formatCLP(totalRevenue) }}</span>
      </div>
      <span class="text-xs font-bold bg-white/10 px-3 py-1 rounded-full border border-white/20">
        {{ confirmedRequests.length }} confirmadas
      </span>
    </div>

    <!-- Accesos Rápidos Directos -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <h2 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Gestión Rápida</h2>

      <div class="space-y-2">
        <button
          type="button"
          @click="navigateTo('/admin/solicitudes')"
          class="w-full p-3.5 bg-brand-light hover:bg-gray-200 border-2 border-brand-border rounded-2xl flex items-center justify-between text-xs font-black text-brand-dark transition-all touch-target"
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
          class="w-full p-3.5 bg-brand-light hover:bg-gray-200 border-2 border-brand-border rounded-2xl flex items-center justify-between text-xs font-black text-brand-dark transition-all touch-target"
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
          class="w-full p-3.5 bg-brand-light hover:bg-gray-200 border-2 border-brand-border rounded-2xl flex items-center justify-between text-xs font-black text-brand-dark transition-all touch-target"
        >
          <div class="flex items-center gap-2.5">
            <Grid class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            <span>Editar Precios y Cabañas</span>
          </div>
          <ArrowRight class="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>

    <!-- Navegación Inferior -->
    <AdminBottomNav />
  </div>
</template>