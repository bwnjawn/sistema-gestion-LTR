<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronRight } from 'lucide-vue-next'
import { useReservationStore } from '../../stores/reservationStore'
import ClientBottomNav from '../../components/ui/ClientBottomNav.vue'
import FranjaModoAdmin from '../../components/ui/FranjaModoAdmin.vue'
import { useSalidaReserva } from '../../composables/useSalidaReserva'

const router = useRouter()
const reservationStore = useReservationStore()
const { terminar: salirAlPanel } = useSalidaReserva()

function selectService(service: 'cabana' | 'camping' | 'restaurant') {
  reservationStore.setService(service)
  if (service === 'cabana') {
    router.push('/cabana/paso1')
  } else if (service === 'camping') {
    router.push('/camping/paso1')
  } else if (service === 'restaurant') {
    router.push('/restaurante/paso1')
  }
}
</script>

<template>
  <div class="flex flex-col min-h-[85vh]">
    <!-- Modo administrador (SCRUM-56): la misma franja de los pasos, con botón para salir al panel -->
    <FranjaModoAdmin v-if="reservationStore.isAdminMode" con-salir @salir="salirAlPanel" />

    <main class="p-4 space-y-4 grow max-w-md mx-auto w-full pb-contenido-nav">
      
      <!-- Encabezado con Logo y Título Institucional Reincorporado -->
      <div class="flex items-center gap-3.5 px-1 pt-2">
        <div class="w-16 h-16 bg-white rounded-2xl p-2 shrink-0 flex items-center justify-center shadow-xs border border-brand-border">
          <img 
            src="/images/logo.png" 
            alt="Logo Los Troncos de Repil" 
            class="w-full h-full object-contain"
            @error="(e) => { (e.target as HTMLImageElement).src = '/favicon.ico' }"
          />
        </div>

        <div class="space-y-0.5">
          <span class="text-sm font-extrabold text-brand-accent uppercase tracking-widest block leading-none">
            Centro Turístico
          </span>
          <h1 class="text-xl font-black text-brand-dark tracking-tight leading-tight">
            Los Troncos de Repil
          </h1>
          <span class="text-sm font-bold text-gray-600 block leading-none">
            Fresia, Región de los Lagos
          </span>
        </div>
      </div>

      <!-- Título de Sección -->
      <div class="space-y-1">
        <h2 class="text-xl font-black text-brand-dark tracking-tight">
          ¿Qué quieres reservar?
        </h2>
      </div>

      <!-- Tarjetas de Servicio -->
      <div class="space-y-3.5">
        <!-- CARD 1: CABAÑA -->
        <div 
          @click="selectService('cabana')"
          class="relative h-40 rounded-3xl overflow-hidden border-2 border-brand-border shadow-sm cursor-pointer group active:scale-98 transition-all touch-target"
        >
          <img 
            src="https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80" 
            alt="Cabaña" 
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

          <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <h3 class="text-2xl font-black leading-tight drop-shadow-sm">
                Cabaña
              </h3>
              <p class="text-sm font-bold text-gray-200 mt-0.5">
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
                Camping
              </h3>
              <p class="text-sm font-bold text-gray-200 mt-0.5">
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
                Restaurante
              </h3>
              <p class="text-sm font-bold text-gray-200 mt-0.5">
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

    <!-- Navegación Inferior -->
    <ClientBottomNav v-if="!reservationStore.isAdminMode" />
  </div>
</template>