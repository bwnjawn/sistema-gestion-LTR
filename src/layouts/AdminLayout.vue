<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Home, Calendar, ClipboardList, MoreHorizontal, Plus, Wifi } from 'lucide-vue-next'
import BaseButton from '../components/ui/BaseButton.vue'

const route = useRoute()
const router = useRouter()

// Cantidad de solicitudes pendientes para la insignia de la pestaña
const pendingRequestsCount = 4

function handleNewReservation() {
  router.push({ name: 'client-reservation' })
}
</script>

<template>
  <div class="min-h-screen bg-brand-light flex flex-col pb-20 md:pb-0">
    
    <!-- Encabezado Superior Fijo Admin -->
    <header class="bg-brand-dark text-white px-4 py-3 shadow-md sticky top-0 z-40">
      <div class="max-w-md mx-auto flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h1 class="text-xl font-bold tracking-tight">Los Troncos</h1>
          <span class="inline-flex items-center gap-1 bg-status-success/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-2 py-0.5 rounded-full">
            <Wifi class="w-3 h-3 text-emerald-400" />
            Conectado
          </span>
        </div>

        <button 
          type="button" 
          @click="handleNewReservation"
          class="bg-brand-accent hover:bg-opacity-90 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 touch-target md:hidden"
        >
          <Plus class="w-4 h-4 stroke-[3]" />
          Reserva
        </button>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="grow max-w-md w-full mx-auto p-4 space-y-4">
      <router-view />
    </main>

    <!-- Navegación Móvil Fija Inferior (Basada en maquetas del PDF) -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-brand-border shadow-lg z-50 px-2 py-1.5">
      <div class="max-w-md mx-auto flex justify-around items-center">
        
        <!-- Inicio -->
        <router-link 
          to="/admin" 
          exact
          class="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-xs font-bold transition-colors touch-target"
          :class="route.name === 'admin-dashboard' ? 'text-brand-dark bg-brand-light' : 'text-gray-500 hover:text-brand-dark'"
        >
          <Home class="w-5 h-5 stroke-[2.5]" />
          <span>Inicio</span>
        </router-link>

        <!-- Calendario -->
        <router-link 
          to="/admin/solicitudes" 
          class="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-xs font-bold transition-colors touch-target"
          :class="route.name === 'admin-calendar' ? 'text-brand-dark bg-brand-light' : 'text-gray-500 hover:text-brand-dark'"
        >
          <Calendar class="w-5 h-5 stroke-[2.5]" />
          <span>Calendario</span>
        </router-link>

        <!-- Solicitudes + Insignia (4) -->
        <router-link 
          to="/admin/solicitudes" 
          class="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-xs font-bold transition-colors touch-target relative"
          :class="route.name === 'admin-requests' ? 'text-brand-dark bg-brand-light' : 'text-gray-500 hover:text-brand-dark'"
        >
          <div class="relative">
            <ClipboardList class="w-5 h-5 stroke-[2.5]" />
            <span 
              v-if="pendingRequestsCount > 0"
              class="absolute -top-1.5 -right-2.5 bg-status-danger text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border-2 border-white"
            >
              {{ pendingRequestsCount }}
            </span>
          </div>
          <span>Solicitudes</span>
        </router-link>

        <!-- Más (Ajustes y Catálogo) -->
        <router-link 
          to="/admin/catalogo" 
          class="flex flex-col items-center justify-center gap-0.5 py-1 px-3 rounded-xl text-xs font-bold transition-colors touch-target"
          :class="route.name === 'admin-catalog' ? 'text-brand-dark bg-brand-light' : 'text-gray-500 hover:text-brand-dark'"
        >
          <MoreHorizontal class="w-5 h-5 stroke-[2.5]" />
          <span>Más</span>
        </router-link>

      </div>
    </nav>

  </div>
</template>