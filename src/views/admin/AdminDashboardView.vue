<template>
  <div class="space-y-6">
    <!-- Banner de Sincronización / Conflictos Offline (si existen) -->
    <div 
      v-if="adminStore.hasConflicts" 
      class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm"
    >
      <div class="flex items-start justify-between">
        <div>
          <h3 class="text-sm font-bold text-amber-800">Sincronización pendiente</h3>
          <p class="text-xs text-amber-700 mt-1">
            Se detectaron reservas ingresadas sin conexión que requieren revisión.
          </p>
        </div>
        <button 
          @click="router.push('/admin/solicitudes')"
          class="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-md font-medium hover:bg-amber-700"
        >
          Resolver
        </button>
      </div>
    </div>

    <!-- Resumen de Ocupación del Día -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-base font-bold text-gray-800">Ocupación de Hoy</h2>
        <span class="text-xs text-gray-500 capitalize">{{ currentDateFormatted }}</span>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div 
          v-for="resource in occupancyList" 
          :key="resource.id"
          class="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between"
        >
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ resource.type }}</span>
          <p class="text-sm font-bold text-gray-800 mt-1">{{ resource.name }}</p>
          
          <div class="mt-3 flex items-center justify-between">
            <span 
              class="text-[11px] px-2 py-0.5 rounded-full font-medium"
              :class="resource.isOccupied ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'"
            >
              {{ resource.isOccupied ? 'Ocupado' : 'Disponible' }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Acceso Rápido a Solicitudes Pendientes -->
    <section class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-bold text-gray-800">Solicitudes Pendientes</h3>
        <span class="bg-[#25636B] text-white text-xs px-2 py-0.5 rounded-full font-bold">
          {{ adminStore.pendingCount }}
        </span>
      </div>
      <p class="text-xs text-gray-600 mb-3">
        Revisa las nuevas reservas ingresadas por clientes o recibidas por teléfono.
      </p>
      <button 
        @click="router.push('/admin/solicitudes')"
        class="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-[#1E4620] font-semibold text-xs rounded-lg border border-gray-200 transition-colors"
      >
        Ver todas las solicitudes
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'

const router = useRouter()
const adminStore = useAdminStore()

const currentDateFormatted = computed(() => {
  return new Date().toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
})

// Mapea los recursos reales declarados en adminStore.ts (cabañas, camping, restaurante)
const occupancyList = computed(() => {
  return (adminStore.resources || []).map(res => ({
    id: res.id,
    name: res.name,
    type: res.type === 'cabin' ? 'Cabaña' : res.type === 'camping' ? 'Camping' : 'Comida',
    isOccupied: res.occupied >= res.total
  }))
})
</script>