<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { ChevronRight, Waves, PartyPopper } from 'lucide-vue-next'
import { useReservationStore } from '../../stores/reservationStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCLP } from '../../lib/format'
import type { ServiceType } from '../../types/domain'
import ClientBottomNav from '../../components/ui/ClientBottomNav.vue'
import FondoFotoTarjeta from '../../components/ui/FondoFotoTarjeta.vue'
import TarjetaServicioExtra from '../../components/ui/TarjetaServicioExtra.vue'
import HojaContactoEvento from '../../components/ui/HojaContactoEvento.vue'
import FranjaModoAdmin from '../../components/ui/FranjaModoAdmin.vue'
import AvisoPendientesEnvio from '../../components/ui/AvisoPendientesEnvio.vue'
import { useSalidaReserva } from '../../composables/useSalidaReserva'

const router = useRouter()
const reservationStore = useReservationStore()
const settingsStore = useSettingsStore()
const contactoEventoAbierto = ref(false)
const { terminar: salirAlPanel } = useSalidaReserva()

function selectService(service: ServiceType) {
  reservationStore.setService(service)
  if (service === 'cabana') {
    router.push('/cabana/paso1')
  } else if (service === 'camping') {
    router.push('/camping/paso1')
  } else if (service === 'restaurante') {
    router.push('/restaurante/paso1')
  } else if (service === 'piscina') {
    router.push('/piscina/paso1')
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
          <span class="text-sm font-bold text-brand-accent block leading-none">
            Centro Turístico
          </span>
          <h1 class="text-xl font-bold text-brand-dark tracking-tight leading-tight">
            Los Troncos de Repil
          </h1>
          <span class="text-sm text-gray-600 block leading-none">
            Fresia, Región de los Lagos
          </span>
        </div>
      </div>

      <!-- Solicitudes guardadas por falta de señal que aún no se enviaron (SCRUM-250) -->
      <AvisoPendientesEnvio />

      <!-- Título de Sección -->
      <div class="space-y-1">
        <h2 class="text-xl font-bold text-brand-dark tracking-tight">
          ¿Qué quieres reservar?
        </h2>
      </div>

      <!-- Tarjetas de Servicio -->
      <div class="space-y-3.5">
        <!-- CARD 1: CABAÑA -->
        <div 
          @click="selectService('cabana')"
          class="relative h-36 rounded-3xl overflow-hidden border-2 border-brand-border shadow-sm cursor-pointer group active:scale-98 transition-all touch-target bg-gradient-to-br from-brand-dark to-brand-accent"
        >
          <FondoFotoTarjeta :imagen="settingsStore.fotoInicio('cabana')" />

          <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <h3 class="text-2xl font-bold leading-tight drop-shadow-sm">
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
          class="relative h-36 rounded-3xl overflow-hidden border-2 border-brand-border shadow-sm cursor-pointer group active:scale-98 transition-all touch-target bg-gradient-to-br from-brand-dark to-brand-accent"
        >
          <FondoFotoTarjeta :imagen="settingsStore.fotoInicio('camping')" />

          <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <h3 class="text-2xl font-bold leading-tight drop-shadow-sm">
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
          @click="selectService('restaurante')"
          class="relative h-36 rounded-3xl overflow-hidden border-2 border-brand-border shadow-sm cursor-pointer group active:scale-98 transition-all touch-target bg-gradient-to-br from-brand-dark to-brand-accent"
        >
          <FondoFotoTarjeta :imagen="settingsStore.fotoInicio('restaurante')" />

          <div class="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <h3 class="text-2xl font-bold leading-tight drop-shadow-sm">
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

        <!-- Servicios extra, más bajos y lado a lado (el administrador solo ve Piscina, a lo ancho) -->
        <div class="grid grid-cols-2 gap-3.5">
          <!-- Piscina (SCRUM-44): solo para quien no contrata otro servicio; es una solicitud informativa -->
          <TarjetaServicioExtra
            :class="{ 'col-span-2': reservationStore.isAdminMode }"
            titulo="Piscina"
            :subtitulo="`${formatCLP(settingsStore.poolEntryPrice)} por persona`"
            :imagen="settingsStore.fotoInicio('piscina')"
            nota="Gratis si reservas otro servicio"
            :icono="Waves"
            @click="selectService('piscina')"
          />

          <!-- Evento especial (SCRUM-45): no es una reserva, abre los contactos de los dueños -->
          <TarjetaServicioExtra
            v-if="!reservationStore.isAdminMode"
            titulo="Evento especial"
            subtitulo="Contacta a los dueños"
            :imagen="settingsStore.fotoInicio('evento')"
            :icono="PartyPopper"
            @click="contactoEventoAbierto = true"
          />
        </div>
      </div>
    </main>

    <HojaContactoEvento :abierto="contactoEventoAbierto" @cerrar="contactoEventoAbierto = false" />

    <!-- Navegación Inferior -->
    <ClientBottomNav v-if="!reservationStore.isAdminMode" />
  </div>
</template>