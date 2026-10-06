<template>
  <div class="min-h-screen bg-brand-light flex flex-col pb-20">
    <!-- Encabezado Reutilizable con Botón Admin -->
    <ClientHeader 
      show-admin 
      @admin-click="goToAdmin" 
    />

    <!-- CONTENIDO PRINCIPAL: TARJETAS DE SERVICIO -->
    <main class="p-4 space-y-4 grow max-w-md mx-auto w-full">
      <div class="space-y-1">
        <h2 class="text-xl font-black text-brand-dark tracking-tight">
          ¿Qué quieres reservar?
        </h2>
      </div>

      <div class="space-y-3.5">
        <!-- CARD 1: CABAÑA -->
        <div 
          @click="selectService('cabana')"
          class="relative h-40 rounded-3xl overflow-hidden border-2 border-brand-border shadow-sm cursor-pointer group active:scale-98 transition-all touch-target"
        >
          <img 
            src="https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80" 
            alt="Dormir en cabaña" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <h3 class="text-2xl font-black leading-tight drop-shadow-sm">
                Dormir en cabaña
              </h3>
              <p class="text-xs font-bold text-gray-200 mt-0.5">
                Desde $65.000 la noche
              </p>
            </div>
            <div class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-brand-dark transition-colors">
              <ChevronRight class="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
        </div>

        <!-- CARD 2: ACAMPAR -->
        <div 
          @click="selectService('camping')"
          class="relative h-40 rounded-3xl overflow-hidden border-2 border-brand-border shadow-sm cursor-pointer group active:scale-98 transition-all touch-target"
        >
          <img 
            src="https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80" 
            alt="Acampar en Los Troncos de Repil" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <h3 class="text-2xl font-black leading-tight drop-shadow-sm">
                Acampar
              </h3>
              <p class="text-xs font-bold text-gray-200 mt-0.5">
                $10.000 por persona la noche
              </p>
            </div>
            <div class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-brand-dark transition-colors">
              <ChevronRight class="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
        </div>

        <!-- CARD 3: COMER -->
        <div 
          @click="selectService('restaurant')"
          class="relative h-40 rounded-3xl overflow-hidden border-2 border-brand-border shadow-sm cursor-pointer group active:scale-98 transition-all touch-target"
        >
          <img 
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80" 
            alt="Restaurante y Comida" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <h3 class="text-2xl font-black leading-tight drop-shadow-sm">
                Comer
              </h3>
              <p class="text-xs font-bold text-gray-200 mt-0.5">
                Desayuno, almuerzo y once
              </p>
            </div>
            <div class="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 group-hover:bg-white group-hover:text-brand-dark transition-colors">
              <ChevronRight class="w-6 h-6 stroke-[2.5]" />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Barra de Navegación Inferior Reutilizable -->
    <ClientBottomNav />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import ClientHeader from '../../components/ui/ClientHeader.vue'
import ClientBottomNav from '../../components/ui/ClientBottomNav.vue'
import { useReservationStore } from '../../stores/reservationStore'

const router = useRouter()
const reservationStore = useReservationStore()

const selectService = (service: 'cabana' | 'camping' | 'restaurant') => {
  reservationStore.setService(service)
  if (service === 'cabana') {
    router.push({ name: 'cabana-step1' })
  } else if (service === 'camping') {
    router.push({ name: 'camping-step1' })
  } else if (service === 'restaurant') {
    router.push({ name: 'restaurant-step1' })
  }
}

const goToAdmin = () => {
  router.push({ name: 'admin-dashboard' })
}
</script>