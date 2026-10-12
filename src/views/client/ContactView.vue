<script setup lang="ts">
import { useRouter } from 'vue-router'
import { 
  Phone, 
  Mail, 
  Globe, 
  Instagram, 
  MapPin, 
  ExternalLink, 
  MessageCircle, 
  ArrowLeft,
  Compass
} from 'lucide-vue-next'
import ClientBottomNav from '../../components/ui/ClientBottomNav.vue'

const router = useRouter()

const phone1 = '+56 9 8502 5056'
const phone1Clean = '56985025056'
const phone2 = '+56 9 5883 3853'
const phone2Clean = '56958833853'
const email = 'contacto@lostroncosderepil.cl'

// Enlace oficial actualizado y texto visible resumido para móviles
const websiteUrl = 'https://www.fresianatural.cl/troncos-de-repil-fresia-natural.html'
const websiteDisplay = 'fresianatural.cl/troncos-de-repil'

const instagramUser = '@lostroncosderepil'
const instagramUrl = 'https://www.instagram.com/lostroncosderepil'
const mapsUrl = 'https://www.google.com/maps/place/Turismo+Los+Troncos+de+Repil/@-41.0616375,-73.647016,17z'

const iframeMapUrl = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2983.847120042735!2d-73.647016!3d-41.0616375!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x963d67cf2a3c64e9%3A0x203014f305c60387!2sTurismo%20Los%20Troncos%20de%20Repil!5e0!3m2!1ses!2scl!4v1710000000000!5m2!1ses!2scl'

function handleBack() {
  router.push('/')
}
</script>

<template>
  <div class="space-y-5 pb-28 max-w-md mx-auto">
    <!-- Header superior con botón volver -->
    <div class="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-brand-border shadow-xs">
      <div class="flex items-center gap-3">
        <button 
          type="button" 
          @click="handleBack"
          class="p-2 rounded-xl bg-brand-light hover:bg-gray-200 text-brand-dark transition-colors touch-target"
        >
          <ArrowLeft class="w-5 h-5 stroke-[2.5]" />
        </button>
        <div>
          <h1 class="text-lg font-black text-brand-dark leading-tight">Contacto y Ubicación</h1>
          <p class="text-xs font-bold text-gray-500">Centro Turístico Los Troncos de Repil</p>
        </div>
      </div>
    </div>

    <!-- TARJETA 1: LÍNEAS DE ATENCIÓN DIRECTA -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-4">
      <h2 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
        <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        Líneas de Atención
      </h2>

      <!-- TELÉFONO 1 + WHATSAPP -->
      <div class="bg-brand-light p-3.5 rounded-2xl border border-brand-border space-y-2.5">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-black text-brand-accent block">Teléfono 1</span>
            <span class="text-sm font-black text-brand-dark">{{ phone1 }}</span>
          </div>
          <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
            WhatsApp
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <a
            :href="`tel:${phone1Clean}`"
            class="bg-brand-dark text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform touch-target shadow-xs"
          >
            <Phone class="w-3.5 h-3.5 stroke-[2.5]" />
            Llamar
          </a>

          <a
            :href="`https://wa.me/${phone1Clean}?text=Hola,%20quisiera%20consultar%20por%20una%20reserva`"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-emerald-600 text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform touch-target shadow-xs"
          >
            <MessageCircle class="w-3.5 h-3.5 stroke-[2.5]" />
            WhatsApp
          </a>
        </div>
      </div>

      <!-- TELÉFONO 2 + WHATSAPP -->
      <div class="bg-brand-light p-3.5 rounded-2xl border border-brand-border space-y-2.5">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-[10px] uppercase font-black text-brand-accent block">Teléfono 2</span>
            <span class="text-sm font-black text-brand-dark">{{ phone2 }}</span>
          </div>
          <span class="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
            WhatsApp
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <a
            :href="`tel:${phone2Clean}`"
            class="bg-brand-dark text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform touch-target shadow-xs"
          >
            <Phone class="w-3.5 h-3.5 stroke-[2.5]" />
            Llamar
          </a>

          <a
            :href="`https://wa.me/${phone2Clean}?text=Hola,%20quisiera%20consultar%20por%20una%20reserva`"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-emerald-600 text-white text-xs font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform touch-target shadow-xs"
          >
            <MessageCircle class="w-3.5 h-3.5 stroke-[2.5]" />
            WhatsApp
          </a>
        </div>
      </div>

      <!-- Correo Electrónico -->
      <div class="bg-brand-light p-3.5 rounded-2xl border border-brand-border flex items-center justify-between">
        <div class="truncate mr-2">
          <span class="text-[10px] uppercase font-black text-gray-400 block">Correo Electrónico</span>
          <span class="text-xs font-black text-brand-dark truncate block">{{ email }}</span>
        </div>

        <a
          :href="`mailto:${email}`"
          class="bg-white border-2 border-brand-border text-brand-dark hover:bg-gray-100 text-xs font-black py-2 px-3.5 rounded-xl flex items-center gap-1.5 shrink-0 active:scale-95 transition-transform touch-target"
        >
          <Mail class="w-3.5 h-3.5 stroke-[2.5]" />
          Escribir
        </a>
      </div>
    </div>

    <!-- TARJETA 2: CANALES DIGITALES -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-4">
      <h2 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
        <Globe class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        Canales Digitales
      </h2>

      <div class="grid grid-cols-1 gap-2.5">
        <!-- Sitio Web Oficial -->
        <a
          :href="websiteUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="bg-brand-light hover:bg-gray-100 p-3.5 rounded-2xl border-2 border-brand-border flex items-center justify-between group transition-all active:scale-98 touch-target"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="w-9 h-9 bg-brand-dark text-white rounded-xl flex items-center justify-center shrink-0">
              <Globe class="w-5 h-5 stroke-[2.5]" />
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-xs font-black text-brand-dark block">Sitio Web Oficial</span>
              <span class="text-[11px] font-extrabold text-brand-accent truncate block">
                {{ websiteDisplay }}
              </span>
            </div>
          </div>
          <ExternalLink class="w-4 h-4 text-gray-400 group-hover:text-brand-dark transition-colors stroke-[2.5] shrink-0 ml-2" />
        </a>

        <!-- Instagram -->
        <a
          :href="instagramUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="bg-pink-50/80 hover:bg-pink-100/80 p-3.5 rounded-2xl border-2 border-pink-200 flex items-center justify-between group transition-all active:scale-98 touch-target"
        >
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <div class="w-9 h-9 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
              <Instagram class="w-5 h-5 stroke-[2.5]" />
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-xs font-black text-pink-950 block">Instagram</span>
              <span class="text-[11px] font-extrabold text-pink-700 truncate block">{{ instagramUser }}</span>
            </div>
          </div>
          <ExternalLink class="w-4 h-4 text-pink-400 group-hover:text-pink-800 transition-colors stroke-[2.5] shrink-0 ml-2" />
        </a>
      </div>
    </div>

    <!-- TARJETA 3: UBICACIÓN EXACTA Y MAPA GPS -->
    <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-4">
      <h2 class="text-xs font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2.5">
        <MapPin class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        Ubicación y Cómo Llegar
      </h2>

      <div class="space-y-3">
        <p class="text-xs font-bold text-gray-700 leading-relaxed">
          <strong class="text-brand-dark font-black">Sector Repil s/n, Comuna de Fresia</strong>, Región de Los Lagos, Chile (Ruta Fresia - Ñapeco).
        </p>

        <!-- Contenedor del Mapa Google Maps -->
        <div class="relative w-full h-52 bg-gray-100 rounded-2xl overflow-hidden border-2 border-brand-border shadow-xs">
          <iframe 
            :src="iframeMapUrl"
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen 
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade"
            title="Mapa Turismo Los Troncos de Repil"
          ></iframe>
        </div>

        <!-- Botón para abrir GPS -->
        <a
          :href="mapsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="w-full bg-brand-dark hover:bg-black text-white text-xs font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-xs touch-target"
        >
          <Compass class="w-4 h-4 text-emerald-300 stroke-[2.5]" />
          Abrir Ruta en Google Maps / GPS
        </a>
      </div>
    </div>

    <!-- Navegación Inferior Fija -->
    <ClientBottomNav />
  </div>
</template>