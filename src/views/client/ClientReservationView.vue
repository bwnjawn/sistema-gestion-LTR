<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Building2, Tent, Utensils, ChevronRight, Sparkles, ShieldCheck } from 'lucide-vue-next'
import { useReservationStore } from '../../stores/reservationStore'

const router = useRouter()
const store = useReservationStore()

function handleSelectService(service: 'cabana' | 'camping' | 'restaurant') {
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
</script>

<template>
  <div class="space-y-5 max-w-md mx-auto pb-6">
    
    <!-- Mensaje de Bienvenida -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-2 text-center">
      <span class="inline-flex items-center gap-1.5 bg-brand-light border border-brand-border px-3 py-1 rounded-full text-xs font-extrabold text-brand-dark">
        <Sparkles class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
        Portal de Reservas Online
      </span>
      <h2 class="text-2xl font-black text-brand-dark tracking-tight">
        ¿Qué servicio deseas solicitar?
      </h2>
      <p class="text-xs font-semibold text-gray-600 leading-relaxed max-w-xs mx-auto">
        Selecciona una de las opciones para verificar disponibilidad y enviar tu solicitud directamente a los administradores.
      </p>
    </div>

    <!-- Lista de Servicios Disponibles -->
    <div class="space-y-3.5">
      
      <!-- Opción 1: Cabañas -->
      <div 
        @click="handleSelectService('cabana')"
        class="bg-white p-5 rounded-3xl border-2 border-brand-border hover:border-brand-dark shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-98 touch-target flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-emerald-50 text-brand-dark rounded-2xl flex items-center justify-center shrink-0 border-2 border-emerald-200 group-hover:bg-brand-dark group-hover:text-white transition-colors">
            <Building2 class="w-7 h-7 stroke-[2.5]" />
          </div>
          <div class="space-y-0.5">
            <h3 class="text-lg font-black text-brand-dark group-hover:text-brand-accent transition-colors">
              Cabañas
            </h3>
            <p class="text-xs font-bold text-gray-500 leading-snug">
              Alojamiento totalmente equipado para 6 y 8 personas.
            </p>
          </div>
        </div>
        <div class="w-10 h-10 rounded-full bg-brand-light group-hover:bg-brand-dark group-hover:text-white flex items-center justify-center shrink-0 transition-colors border border-brand-border">
          <ChevronRight class="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>

      <!-- Opción 2: Camping -->
      <div 
        @click="handleSelectService('camping')"
        class="bg-white p-5 rounded-3xl border-2 border-brand-border hover:border-brand-dark shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-98 touch-target flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-emerald-50 text-brand-dark rounded-2xl flex items-center justify-center shrink-0 border-2 border-emerald-200 group-hover:bg-brand-dark group-hover:text-white transition-colors">
            <Tent class="w-7 h-7 stroke-[2.5]" />
          </div>
          <div class="space-y-0.5">
            <h3 class="text-lg font-black text-brand-dark group-hover:text-brand-accent transition-colors">
              Camping
            </h3>
            <p class="text-xs font-bold text-gray-500 leading-snug">
              Pase diario o pernoctación en sitios naturales.
            </p>
          </div>
        </div>
        <div class="w-10 h-10 rounded-full bg-brand-light group-hover:bg-brand-dark group-hover:text-white flex items-center justify-center shrink-0 transition-colors border border-brand-border">
          <ChevronRight class="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>

      <!-- Opción 3: Restaurante -->
      <div 
        @click="handleSelectService('restaurant')"
        class="bg-white p-5 rounded-3xl border-2 border-brand-border hover:border-brand-dark shadow-sm hover:shadow-md transition-all cursor-pointer group active:scale-98 touch-target flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-emerald-50 text-brand-dark rounded-2xl flex items-center justify-center shrink-0 border-2 border-emerald-200 group-hover:bg-brand-dark group-hover:text-white transition-colors">
            <Utensils class="w-7 h-7 stroke-[2.5]" />
          </div>
          <div class="space-y-0.5">
            <h3 class="text-lg font-black text-brand-dark group-hover:text-brand-accent transition-colors">
              Restaurante
            </h3>
            <p class="text-xs font-bold text-gray-500 leading-snug">
              Menú criollo, asado al palo y acompañamientos.
            </p>
          </div>
        </div>
        <div class="w-10 h-10 rounded-full bg-brand-light group-hover:bg-brand-dark group-hover:text-white flex items-center justify-center shrink-0 transition-colors border border-brand-border">
          <ChevronRight class="w-5 h-5 stroke-[2.5]" />
        </div>
      </div>

    </div>

    <!-- Garantía de Atención Directa -->
    <div class="bg-brand-light p-4 rounded-2xl border border-brand-border flex items-center gap-3 text-xs font-extrabold text-gray-700">
      <ShieldCheck class="w-5 h-5 text-brand-accent shrink-0 stroke-[2.5]" />
      <span>Confirmación personalizada por teléfono directo con los dueños del centro turístico.</span>
    </div>

  </div>
</template> 