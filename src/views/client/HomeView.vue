<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Home, PhoneCall, ChevronRight, ShieldCheck } from 'lucide-vue-next'
import { useReservationStore } from '../../stores/reservationStore'

const router = useRouter()
const store = useReservationStore()

function selectService(service: 'cabana' | 'camping' | 'restaurant') {
  store.resetStore()
  store.setService(service)
  
  if (service === 'cabana') {
    router.push({ name: 'cabana-step1' })
  } else if (service === 'camping') {
    router.push({ name: 'camping-step1' })
  } else if (service === 'restaurant') {
    router.push({ name: 'restaurant-step1' })
  }
}

function goToContact() {
  router.push({ name: 'contact' })
}

function goToAdmin() {
  router.push({ name: 'admin-dashboard' })
}
</script>

<template>
  <div class="min-h-screen bg-[#f2f5f0] text-brand-dark flex flex-col justify-between max-w-md mx-auto relative pb-24 font-sans">
    
    <!-- ENCABEZADO PROTOTIPO (Logo Real + Título + Ubicación + Acceso Admin) -->
    <header class="p-4 pt-6 bg-transparent flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-16 h-16 rounded-full bg-white border-2 border-brand-border shadow-xs flex items-center justify-center p-1 shrink-0 overflow-hidden">
          <img 
            src="/images/logo.png" 
            alt="Logo Los Troncos de Repil" 
            class="w-full h-full object-cover rounded-ful scale-150"
            @error="(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=200&q=80' }"
          />
        </div>
        
        <div>
          <h1 class="text-lg font-black text-brand-dark leading-tight tracking-tight">
            Los Troncos de Repil
          </h1>
          <p class="text-xs font-extrabold text-gray-500">
            Fresia, Los Lagos
          </p>
        </div>
      </div>

      <button 
        type="button" 
        @click="goToAdmin" 
        class="text-[11px] font-black text-brand-dark bg-white/80 hover:bg-white border border-brand-border px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1 touch-target active:scale-95 transition-transform"
        title="Acceso Administración"
      >
        <ShieldCheck class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
        <span>Admin</span>
      </button>
    </header>

    <!-- CONTENIDO PRINCIPAL: TARJETAS DE SERVICIO SEGÚN PROTOTIPO -->
    <main class="p-4 space-y-4 grow">
      
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

    <!-- BARRA INFERIOR FIJA DE NAVEGACIÓN CLIENTE -->
    <nav class="fixed bottom-0 left-0 right-0 z-30 bg-[#e3eae1]/95 backdrop-blur-md border-t-2 border-brand-border p-2.5 shadow-2xl">
      <div class="max-w-md mx-auto grid grid-cols-2 gap-2">
        <button 
          type="button" 
          class="py-2.5 px-3 rounded-2xl bg-[#c5d7be] text-brand-dark font-black text-xs flex items-center justify-center gap-2 border border-brand-border shadow-2xs touch-target"
        >
          <Home class="w-4 h-4 stroke-[2.5]" />
          <span>Inicio</span>
        </button>

        <button 
          type="button" 
          @click="goToContact"
          class="py-2.5 px-3 rounded-2xl bg-white/60 hover:bg-white text-gray-600 font-extrabold text-xs flex items-center justify-center gap-2 border border-brand-border/60 touch-target active:scale-95 transition-all"
        >
          <PhoneCall class="w-4 h-4 stroke-[2.5]" />
          <span>Contacto</span>
        </button>
      </div>
    </nav>

  </div>
</template>