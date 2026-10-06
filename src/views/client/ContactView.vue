<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Home, 
  PhoneCall, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  Compass, 
  ExternalLink,
  MessageCircle,
  Moon,
  Sun
} from 'lucide-vue-next'

const router = useRouter()
const isDarkMode = ref(false)

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
}

function goToHome() {
  router.push({ name: 'home' })
}

// Datos reales de Los Troncos de Repil
const phones = [
  { raw: '+56985025056', display: '+56 9 8502 5056', label: 'Contacto Principal' },
  { raw: '+56958833853', display: '+56 9 5883 3853', label: 'Contacto Secundario' }
]

const email = 'lostroncosderepil@gmail.com'
const websiteUrl = 'https://www.fresianatural.cl/troncos-de-repil-fresia-natural.html'
const websiteDisplay = 'fresianatural.cl/troncos-de-repil'
const address = 'Sector Repil, Fresia, Región de Los Lagos, Chile'

// Enlace e Iframe de Google Maps
const mapEmbedUrl = 'https://maps.google.com/maps?q=Los+Troncos+de+Repil,+Fresia,+Los+Lagos,+Chile&t=&z=12&ie=UTF8&iwloc=&output=embed'
const directMapsUrl = 'https://www.google.com/maps/search/?api=1&query=Los+Troncos+de+Repil+Fresia+Chile'
</script>

<template>
  <div class="min-h-screen bg-[#f2f5f0] dark:bg-gray-900 text-brand-dark dark:text-gray-100 flex flex-col justify-between max-w-md mx-auto relative pb-28 font-sans transition-colors duration-300 overflow-x-hidden">
    
    <!-- ENCABEZADO CON LOGO REAL -->
    <header class="p-4 pt-6 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-2 border-brand-border shadow-xs flex items-center justify-center p-1 shrink-0 overflow-hidden">
          <img 
            src="/images/logo.png" 
            alt="Logo Los Troncos de Repil" 
            class="w-full h-full object-cover rounded-full scale-150"
            @error="(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=200&q=80' }"
          />
        </div>
        <div>
          <h1 class="text-lg font-black text-brand-dark dark:text-white leading-tight tracking-tight">
            Los Troncos de Repil
          </h1>
          <p class="text-xs font-extrabold text-gray-500 dark:text-gray-400">
            Fresia, Los Lagos
          </p>
        </div>
      </div>

      <button 
        type="button" 
        @click="toggleDarkMode"
        class="flex items-center justify-center p-2.5 rounded-full bg-white dark:bg-gray-800 border-2 border-brand-border text-brand-dark dark:text-amber-300 shadow-xs active:scale-95 transition-transform touch-target shrink-0"
        title="Cambiar tema"
      >
        <Moon v-if="!isDarkMode" class="w-5 h-5 stroke-[2.5]" />
        <Sun v-else class="w-5 h-5 stroke-[2.5]" />
      </button>
    </header>

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

      <!-- MAPA INTERACTIVO REAL -->
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
          <!-- CORREO -->
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

          <!-- SITIO WEB RECURTADO Y RECORTADO SIN DESBORDAMIENTO -->
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

    <!-- NAVEGACIÓN FIJA CENTRADA PERFECTAMENTE DENTRO DEL CONTENEDOR MAX-W-MD -->
    <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-[#e3eae1]/95 dark:bg-gray-900/95 backdrop-blur-md border-t-2 border-brand-border p-2.5 shadow-2xl">
      <div class="grid grid-cols-2 gap-2">
        <button 
          type="button" 
          @click="goToHome"
          class="py-2.5 px-3 rounded-2xl bg-white/60 dark:bg-gray-800/60 hover:bg-white text-gray-600 dark:text-gray-300 font-extrabold text-xs flex items-center justify-center gap-2 border border-brand-border/60 touch-target active:scale-95 transition-all"
        >
          <Home class="w-4 h-4 stroke-[2.5]" />
          <span>Inicio</span>
        </button>

        <button 
          type="button" 
          class="py-2.5 px-3 rounded-2xl bg-[#c5d7be] dark:bg-brand-dark text-brand-dark dark:text-white font-black text-xs flex items-center justify-center gap-2 border border-brand-border shadow-2xs touch-target"
        >
          <PhoneCall class="w-4 h-4 stroke-[2.5]" />
          <span>Contacto</span>
        </button>
      </div>
    </nav>

  </div>
</template> 