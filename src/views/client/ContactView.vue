<template>
  <div :class="['min-h-screen flex flex-col pb-20 transition-colors', isDarkMode ? 'dark bg-gray-900' : 'bg-brand-light']">
    <!-- Encabezado Reutilizable con Conmutador de Modo Oscuro -->
    <ClientHeader 
      show-dark-mode 
      :is-dark-mode="isDarkMode" 
      @toggle-dark-mode="toggleDarkMode" 
    />

    <!-- CONTENIDO PRINCIPAL -->
    <main class="p-4 space-y-4 grow w-full max-w-md mx-auto">
      <div class="space-y-1">
        <h2 class="text-xl font-black text-brand-dark dark:text-white tracking-tight">
          Contacto y Ubicación
        </h2>
        <p class="text-xs font-semibold text-gray-600 dark:text-gray-300">
          Ubicados en un entorno de naturaleza viva en la Región de Los Lagos.
        </p>
      </div>

      <!-- MAPA INTERACTIVO -->
      <div class="bg-white dark:bg-gray-800 rounded-3xl border-2 border-brand-border overflow-hidden shadow-sm space-y-3 p-3">
        <div class="flex items-center justify-between px-1">
          <span class="text-xs font-black text-brand-dark dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin class="w-4 h-4 text-brand-accent stroke-[2.5] shrink-0" />
            Ubicación en el Mapa
          </span>
          <a 
            :href="directMapsUrl" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-[11px] font-black text-brand-accent hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Abrir Maps</span>
            <ExternalLink class="w-3.5 h-3.5 stroke-[2.5]" />
          </a>
        </div>

        <div class="h-48 w-full rounded-2xl overflow-hidden border border-brand-border relative bg-gray-100">
          <iframe 
            title="Mapa Los Troncos de Repil"
            width="100%" 
            height="100%" 
            style="border:0;" 
            loading="lazy" 
            allowfullscreen
            :src="mapEmbedUrl"
          ></iframe>
        </div>

        <div class="bg-brand-light dark:bg-gray-700/60 p-3 rounded-2xl border border-brand-border text-xs space-y-1.5">
          <div class="flex items-start gap-2 font-bold text-brand-dark dark:text-gray-200">
            <MapPin class="w-4 h-4 text-brand-accent shrink-0 stroke-[2.5] mt-0.5" />
            <span>{{ address }}</span>
          </div>

          <div class="pt-2 border-t border-gray-200/80 dark:border-gray-600/60 space-y-1 text-[11px] text-gray-600 dark:text-gray-300 font-medium">
            <div class="flex items-start gap-1.5">
              <Compass class="w-3.5 h-3.5 text-brand-accent shrink-0 stroke-[2.5] mt-0.5" />
              <span><strong>Desde Fresia (30 km):</strong> Tomar ruta a Ñapeco (50% camino asfaltado).</span>
            </div>
            <div class="flex items-start gap-1.5">
              <Compass class="w-3.5 h-3.5 text-brand-accent shrink-0 stroke-[2.5] mt-0.5" />
              <span><strong>Desde Purranque (45 km):</strong> Ruta Crucero - Hueyusca - La Mocha - Collihuinco - Repil.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- BOTONES DE CONTACTO -->
      <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border-2 border-brand-border shadow-sm space-y-3">
        <h3 class="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <PhoneCall class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Teléfonos de Contacto
        </h3>

        <div class="space-y-2">
          <div 
            v-for="p in phones" 
            :key="p.raw"
            class="bg-brand-light dark:bg-gray-700/60 p-3 rounded-2xl border border-brand-border flex items-center justify-between gap-2"
          >
            <div>
              <span class="text-[10px] font-black text-gray-400 dark:text-gray-300 uppercase block">{{ p.label }}</span>
              <span class="text-sm font-black text-brand-dark dark:text-white">{{ p.display }}</span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <a 
                :href="`tel:${p.raw}`" 
                class="w-9 h-9 rounded-xl bg-white dark:bg-gray-800 border border-brand-border text-brand-dark dark:text-white flex items-center justify-center touch-target active:scale-95 shadow-2xs"
                title="Llamar directamente"
              >
                <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              </a>

              <a 
                :href="`https://wa.me/${p.raw.replace('+', '')}`" 
                target="_blank" 
                rel="noopener noreferrer"
                class="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center touch-target active:scale-95 shadow-2xs"
                title="Enviar mensaje WhatsApp"
              >
                <MessageCircle class="w-4 h-4 stroke-[2.5]" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- CORREO Y SITIO WEB -->
      <div class="bg-white dark:bg-gray-800 p-4 rounded-3xl border-2 border-brand-border shadow-sm space-y-3">
        <h3 class="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <Mail class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Correo y Sitio Web
        </h3>

        <div class="space-y-2 text-xs font-bold">
          <a 
            :href="`mailto:${email}`"
            class="bg-brand-light dark:bg-gray-700/60 p-3 rounded-2xl border border-brand-border flex items-center justify-between gap-2 text-brand-dark dark:text-white hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-2 min-w-0 overflow-hidden">
              <Mail class="w-4 h-4 text-brand-accent stroke-[2.5] shrink-0" />
              <span class="truncate block">{{ email }}</span>
            </div>
            <ExternalLink class="w-3.5 h-3.5 text-gray-400 stroke-[2.5] shrink-0" />
          </a>

          <a 
            :href="websiteUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-brand-light dark:bg-gray-700/60 p-3 rounded-2xl border border-brand-border flex items-center justify-between gap-2 text-brand-dark dark:text-white hover:bg-gray-100 transition-colors"
          >
            <div class="flex items-center gap-2 min-w-0 overflow-hidden">
              <Globe class="w-4 h-4 text-brand-accent stroke-[2.5] shrink-0" />
              <span class="truncate block">{{ websiteDisplay }}</span>
            </div>
            <ExternalLink class="w-3.5 h-3.5 text-gray-400 stroke-[2.5] shrink-0" />
          </a>
        </div>
      </div>
    </main>

    <!-- Barra de Navegación Inferior Reutilizable -->
    <ClientBottomNav />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  MapPin, 
  PhoneCall, 
  Phone, 
  MessageCircle, 
  Mail, 
  Globe, 
  ExternalLink, 
  Compass 
} from 'lucide-vue-next'
import ClientHeader from '../../components/ui/ClientHeader.vue'
import ClientBottomNav from '../../components/ui/ClientBottomNav.vue'

const isDarkMode = ref(false)

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
}

const address = 'Sector Repil, Fresia, Región de Los Lagos, Chile'
const directMapsUrl = 'https://maps.google.com/?q=-41.1500,-73.4167'
const mapEmbedUrl = 'https://maps.google.com/maps?q=-41.1500,-73.4167&hl=es&z=13&output=embed'

const email = 'lostroncosderepil@gmail.com'
const websiteUrl = 'https://www.fresianatural.cl/troncos-de-repil-fresia-natural.html'
const websiteDisplay = 'fresianatural.cl/troncos-de-repil'

const phones = [
  { label: 'Administración 1', display: '+56 9 8502 5056', raw: '+56985025056' },
  { label: 'Administración 2', display: '+56 9 9588 3385', raw: '+56995883385' }
]
</script>