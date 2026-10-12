<script setup lang="ts">
import { Phone, Mail, Globe, Instagram, MapPin, Clock } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'

const settingsStore = useSettingsStore()
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-20">
    <!-- Encabezado -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-1 text-center">
      <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">
        Centro Turístico
      </span>
      <h1 class="text-xl font-black text-brand-dark">Los Troncos de Repil</h1>
      <p class="text-xs font-medium text-gray-600">
        Naturaleza, descanso y gastronomía en la Comuna de Fresia.
      </p>
    </div>

    <!-- Canales de Contacto Directo -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <h2 class="text-sm font-black text-brand-dark border-b border-gray-100 pb-2">
        Atención y Consultas
      </h2>

      <div class="space-y-2 text-xs font-bold">
        <!-- Teléfonos -->
        <a
          :href="'tel:' + settingsStore.phone1Clean"
          class="flex items-center gap-3 p-3 bg-brand-light hover:bg-gray-100 rounded-2xl border border-brand-border text-brand-dark transition-all active:scale-95"
        >
          <div class="p-2 bg-white rounded-xl border border-brand-border text-brand-accent">
            <Phone class="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span class="text-[10px] text-gray-500 block leading-none">Llamar / WhatsApp</span>
            <span class="text-xs font-black">{{ settingsStore.contactInfo.phone1 }}</span>
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
            <span class="text-[10px] text-gray-500 block leading-none">Teléfono Secundario</span>
            <span class="text-xs font-black">{{ settingsStore.contactInfo.phone2 }}</span>
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
            <span class="text-[10px] text-gray-500 block leading-none">Correo Electrónico</span>
            <span class="text-xs font-black truncate block">{{ settingsStore.contactInfo.email }}</span>
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
            <span class="text-[10px] text-gray-500 block leading-none">Sitio Web Oficial</span>
            <span class="text-xs font-black">{{ settingsStore.contactInfo.websiteDisplay }}</span>
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
            <span class="text-[10px] text-gray-500 block leading-none">Síguenos en Instagram</span>
            <span class="text-xs font-black">{{ settingsStore.contactInfo.instagramUser }}</span>
          </div>
        </a>
      </div>
    </div>

    <!-- Horarios de Atención -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center gap-2 text-brand-dark">
        <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        <h2 class="text-sm font-black">Horarios de Atención y Servicios</h2>
      </div>

      <div class="space-y-2 text-xs font-bold text-gray-700 bg-brand-light p-3.5 rounded-2xl border border-brand-border">
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Cabañas (Check-in / Out):</span>
          <span class="text-brand-dark">{{ settingsStore.cabinSchedules.checkIn }} - {{ settingsStore.cabinSchedules.checkOut }} hrs</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Camping (Día de campo):</span>
          <span class="text-brand-dark">{{ settingsStore.campingSchedules.diario.checkIn }} - {{ settingsStore.campingSchedules.diario.checkOut }} hrs</span>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Restaurante (Almuerzo):</span>
          <span class="text-brand-dark">{{ settingsStore.restaurantSchedules.almuerzo.start }} - {{ settingsStore.restaurantSchedules.almuerzo.end }} hrs</span>
        </div>
      </div>
    </div>

    <!-- Ubicación y Mapa -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center gap-2 text-brand-dark">
        <MapPin class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        <h2 class="text-sm font-black">Cómo Llegar</h2>
      </div>

      <p class="text-xs font-medium text-gray-600">
        {{ settingsStore.contactInfo.address }}
      </p>

      <!-- Iframe Google Maps -->
      <div v-if="settingsStore.contactInfo.iframeMapUrl" class="rounded-2xl overflow-hidden border-2 border-brand-border h-48 bg-gray-100">
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
        class="w-full py-3 px-4 bg-brand-dark text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
      >
        <span>Abrir en Google Maps GPS</span>
      </a>
    </div>
  </div>
</template>