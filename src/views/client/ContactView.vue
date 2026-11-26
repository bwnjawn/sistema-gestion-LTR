<script setup lang="ts">
import { Phone, Mail, Globe, Instagram, MapPin, Clock } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import ClientHeader from '../../components/ui/ClientHeader.vue'
import ClientBottomNav from '../../components/ui/ClientBottomNav.vue'
import ClientBarraSuperior from '../../components/ui/ClientBarraSuperior.vue'
import MarcoApp from '../../components/ui/MarcoApp.vue'

const settingsStore = useSettingsStore()
</script>

<template>
  <MarcoApp class="bg-brand-light">
    <template #encabezado>
      <ClientBarraSuperior />
      <ClientHeader class="lg:hidden" titulo="Contacto" subtitulo="Los Troncos de Repil" />
    </template>

  <div class="space-y-4 max-w-md lg:max-w-7xl mx-auto w-full px-4 lg:px-10 pt-4 lg:pt-8 pb-contenido-nav lg:pb-12 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-6 lg:items-start">
    <!-- Canales de Contacto Directo -->
    <div class="bg-white p-5 lg:p-7 rounded-3xl border-2 border-brand-border shadow-xs space-y-3 lg:col-start-1 lg:row-start-1">
      <h2 class="text-sm lg:text-xl font-bold text-brand-dark border-b border-gray-100 pb-2">
        Atención y Consultas
      </h2>

      <div class="space-y-2 text-sm font-bold">
        <!-- Teléfonos -->
        <a
          :href="'tel:' + settingsStore.phone1Clean"
          class="flex items-center gap-3 p-3 bg-brand-light hover:bg-gray-100 rounded-2xl border border-brand-border text-brand-dark transition-all active:scale-95"
        >
          <div class="p-2 bg-white rounded-xl border border-brand-border text-brand-accent">
            <Phone class="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span class="text-sm text-gray-600 block leading-none">Llamar o escribir por WhatsApp</span>
            <span class="text-sm font-bold">{{ settingsStore.contactInfo.phone1 }}</span>
          </div>
        </a>

        <a
          v-if="settingsStore.contactInfo.phone2"
          :href="'tel:' + settingsStore.phone2Clean"
          class="flex items-center gap-3 p-3 bg-brand-light hover:bg-gray-100 rounded-2xl border border-brand-border text-brand-dark transition-all active:scale-95"
        >
          <div class="p-2 bg-white rounded-xl border border-brand-border text-brand-accent">
            <Phone class="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span class="text-sm text-gray-600 block leading-none">Teléfono Secundario</span>
            <span class="text-sm font-bold">{{ settingsStore.contactInfo.phone2 }}</span>
          </div>
        </a>

        <!-- Correo Electronico -->
        <a
          :href="'mailto:' + settingsStore.contactInfo.email"
          class="flex items-center gap-3 p-3 bg-brand-light hover:bg-gray-100 rounded-2xl border border-brand-border text-brand-dark transition-all active:scale-95"
        >
          <div class="p-2 bg-white rounded-xl border border-brand-border text-brand-accent">
            <Mail class="w-4 h-4 stroke-[2.5]" />
          </div>
          <div class="min-w-0 flex-1">
            <span class="text-sm text-gray-600 block leading-none">Correo Electrónico</span>
            <span class="text-sm font-bold truncate block">{{ settingsStore.contactInfo.email }}</span>
          </div>
        </a>

        <!-- Sitio Web -->
        <a
          v-if="settingsStore.contactInfo.websiteUrl"
          :href="settingsStore.contactInfo.websiteUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-3 bg-brand-light hover:bg-gray-100 rounded-2xl border border-brand-border text-brand-dark transition-all active:scale-95"
        >
          <div class="p-2 bg-white rounded-xl border border-brand-border text-brand-accent">
            <Globe class="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span class="text-sm text-gray-600 block leading-none">Sitio Web Oficial</span>
            <span class="text-sm font-bold">{{ settingsStore.contactInfo.websiteDisplay }}</span>
          </div>
        </a>

        <!-- Instagram -->
        <a
          v-if="settingsStore.contactInfo.instagramUrl"
          :href="settingsStore.contactInfo.instagramUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-3 bg-brand-light hover:bg-gray-100 rounded-2xl border border-brand-border text-brand-dark transition-all active:scale-95"
        >
          <div class="p-2 bg-white rounded-xl border border-brand-border text-brand-accent">
            <Instagram class="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span class="text-sm text-gray-600 block leading-none">Síguenos en Instagram</span>
            <span class="text-sm font-bold">{{ settingsStore.contactInfo.instagramUser }}</span>
          </div>
        </a>
      </div>
    </div>

    <!-- Horarios de Atención -->
    <div class="bg-white p-5 lg:p-7 rounded-3xl border-2 border-brand-border shadow-xs space-y-3 lg:col-start-1 lg:row-start-2">
      <div class="flex items-center gap-2 text-brand-dark">
        <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        <h2 class="text-sm lg:text-xl font-bold">Horarios de Atención y Servicios</h2>
      </div>

      <div class="space-y-2 text-base text-gray-700 bg-brand-light p-3.5 rounded-2xl border border-brand-border">
        <div class="flex flex-wrap justify-between items-center gap-x-3 gap-y-0.5">
          <span class="text-gray-600">Cabañas (entrada y salida):</span>
          <span class="font-bold text-brand-dark">{{ settingsStore.cabinSchedules.checkIn }} - {{ settingsStore.cabinSchedules.checkOut }} horas</span>
        </div>
        <div class="flex flex-wrap justify-between items-center gap-x-3 gap-y-0.5">
          <span class="text-gray-600">Camping (Día de campo):</span>
          <span class="font-bold text-brand-dark">{{ settingsStore.campingSchedules.diario.checkIn }} - {{ settingsStore.campingSchedules.diario.checkOut }} horas</span>
        </div>
        <div class="flex flex-wrap justify-between items-center gap-x-3 gap-y-0.5">
          <span class="text-gray-600">Restaurante (Almuerzo):</span>
          <span class="font-bold text-brand-dark">{{ settingsStore.restaurantSchedules.almuerzo.start }} - {{ settingsStore.restaurantSchedules.almuerzo.end }} horas</span>
        </div>
      </div>
    </div>

    <!-- Ubicación y Mapa -->
    <div class="bg-white p-5 lg:p-7 rounded-3xl border-2 border-brand-border shadow-xs space-y-3 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-stretch lg:flex lg:flex-col lg:space-y-0 lg:gap-4">
      <div class="flex items-center gap-2 text-brand-dark">
        <MapPin class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        <h2 class="text-sm lg:text-xl font-bold">Cómo Llegar</h2>
      </div>

      <p class="text-base text-gray-600">
        {{ settingsStore.direccionDelLocal }}
      </p>

      <!-- Iframe Google Maps -->
      <div v-if="settingsStore.contactInfo.iframeMapUrl" class="rounded-2xl overflow-hidden border-2 border-brand-border h-48 lg:h-auto lg:flex-1 lg:min-h-[22rem] bg-gray-100">
        <iframe
          :src="settingsStore.contactInfo.iframeMapUrl"
          width="100%"
          height="100%"
          style="border:0;"
          allowfullscreen="false"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>

      <a
        v-if="settingsStore.contactInfo.mapsUrl"
        :href="settingsStore.contactInfo.mapsUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="w-full py-3 px-4 bg-brand-dark text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <span>Abrir en Google Maps GPS</span>
      </a>
    </div>

    <!-- Navegación Inferior -->
    <ClientBottomNav />
  </div>
  </MarcoApp>
</template>