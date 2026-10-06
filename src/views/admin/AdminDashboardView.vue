<script setup lang="ts">
import { useRouter } from 'vue-router'
import { 
  AlertTriangle, 
  ChevronRight, 
  Plus, 
  Home, 
  Tent, 
  UtensilsCrossed, 
  ClipboardList,
  Calendar as CalendarIcon
} from 'lucide-vue-next'
import { useAdminStore } from '../../stores/adminStore'
import BaseButton from '../../components/ui/BaseButton.vue'

const router = useRouter()
const adminStore = useAdminStore()

function handleNewReservation() {
  router.push({ name: 'client-reservation' })
}

function handleGoToRequests() {
  router.push({ name: 'admin-requests' })
}
</script>

<template>
  <div class="space-y-4">

    <!-- 1. Banner de Conflicto Offline (Dinámico) -->
    <div 
      v-if="adminStore.hasConflicts"
      class="bg-status-warning/15 border-2 border-status-warning rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 bg-status-warning text-white rounded-xl shrink-0">
          <AlertTriangle class="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h2 class="font-bold text-status-warning text-base">
            {{ adminStore.conflicts.length }} Conflicto por Resolver
          </h2>
          <p class="text-xs font-semibold text-brand-text">
            {{ adminStore.conflicts[0].resource }}: {{ adminStore.conflicts[0].details }}
          </p>
        </div>
      </div>

      <button 
        type="button" 
        class="bg-status-warning text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shrink-0 touch-target flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
      >
        Resolver
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>

    <!-- 2. Tarjeta Resumen de Fecha -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border flex items-center justify-between shadow-sm">
      <div class="flex items-center gap-2.5">
        <CalendarIcon class="w-5 h-5 text-brand-accent stroke-[2.5]" />
        <div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Resumen del Día</span>
          <span class="text-base font-extrabold text-brand-dark">{{ adminStore.currentDate }}</span>
        </div>
      </div>
      <button class="text-brand-accent hover:text-brand-dark font-bold text-xs underline">
        Cambiar
      </button>
    </div>

    <!-- 3. Lista Dinámica de Recurso y Ocupación -->
    <div class="bg-white p-4 rounded-2xl border-2 border-brand-border shadow-sm space-y-3">
      <h2 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Ocupación del Día</h2>

      <div class="space-y-2.5">
        <div 
          v-for="res in adminStore.resources" 
          :key="res.id"
          class="p-3 rounded-xl border border-brand-border bg-brand-light/40 flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl bg-white border border-brand-border shadow-xs">
              <Home v-if="res.type === 'cabin'" class="w-5 h-5 text-brand-dark stroke-[2.5]" />
              <Tent v-else-if="res.type === 'camping'" class="w-5 h-5 text-brand-dark stroke-[2.5]" />
              <UtensilsCrossed v-else class="w-5 h-5 text-brand-dark stroke-[2.5]" />
            </div>
            <div>
              <h3 class="font-bold text-brand-text text-base leading-tight">{{ res.name }}</h3>
              <p class="text-xs font-semibold text-gray-500">
                Ocupados: <span class="font-extrabold text-brand-dark">{{ res.occupied }} de {{ res.total }}</span>
              </p>
            </div>
          </div>

          <!-- Insignia Dinámica -->
          <span 
            :class="[
              'text-xs font-bold px-3 py-1 rounded-full border',
              res.occupied >= res.total 
                ? 'bg-status-danger/15 text-status-danger border-status-danger/30' 
                : 'bg-status-success/15 text-status-success border-status-success/30'
            ]"
          >
            {{ res.occupied >= res.total ? 'Ocupado' : `${res.total - res.occupied} Libres` }}
          </span>
        </div>
      </div>
    </div>

    <!-- 4. Acceso Directo a Solicitudes Pendientes (Contador Dinámico) -->
    <button 
      @click="handleGoToRequests"
      class="w-full bg-white p-4 rounded-2xl border-2 border-brand-border shadow-sm flex items-center justify-between hover:bg-brand-light transition-colors text-left touch-target"
    >
      <div class="flex items-center gap-3">
        <div class="p-2.5 bg-brand-accent/10 rounded-xl text-brand-accent">
          <ClipboardList class="w-6 h-6 stroke-[2.5]" />
        </div>
        <div>
          <h3 class="font-bold text-brand-dark text-base">Solicitudes Pendientes</h3>
          <p class="text-xs font-semibold text-gray-500">Revisar y gestionar</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <span class="bg-status-danger text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-xs">
          {{ adminStore.pendingCount }}
        </span>
        <ChevronRight class="w-5 h-5 text-gray-400" />
      </div>
    </button>

    <!-- 5. Botón Acción Principal -->
    <div class="pt-2">
      <BaseButton 
        variant="success" 
        size="xl" 
        fullWidth 
        @click="handleNewReservation"
      >
        <Plus class="w-7 h-7 mr-2 stroke-" />
        + Nueva Reserva
      </BaseButton>
    </div>

  </div>
</template>