<template>
  <nav class="barra-fija-inferior fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-[#e3eae1]/95 backdrop-blur-md border-t-2 border-brand-border px-2.5 pt-3 pb-seguro-nav shadow-2xl">
    <div class="grid grid-cols-2 gap-2">
      <!-- Pestaña Inicio -->
      <button 
        type="button" 
        @click="goToHome"
        aria-label="Inicio"
        :aria-current="isHomeActive ? 'page' : undefined"
        title="Inicio"
        :class="[
          'py-3 px-3 rounded-2xl flex items-center justify-center border touch-target active:scale-95 transition-all',
          isHomeActive
            ? 'bg-[#c5d7be] text-brand-dark border-brand-border shadow-2xs'
            : 'bg-white/60 hover:bg-white text-gray-600 border-brand-border/60 font-extrabold'
        ]"
      >
        <Home class="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
      </button>

      <!-- Pestaña Contacto -->
      <button 
        type="button" 
        @click="goToContact"
        aria-label="Contacto"
        :aria-current="isContactActive ? 'page' : undefined"
        title="Contacto"
        :class="[
          'py-3 px-3 rounded-2xl flex items-center justify-center border touch-target active:scale-95 transition-all',
          isContactActive
            ? 'bg-[#c5d7be] text-brand-dark border-brand-border shadow-2xs'
            : 'bg-white/60 hover:bg-white text-gray-600 border-brand-border/60 font-extrabold'
        ]"
      >
        <PhoneCall class="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, PhoneCall } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const isHomeActive = computed(() => route.name === 'home' || route.path === '/')
const isContactActive = computed(() => route.name === 'contact' || route.path === '/contacto')

const goToHome = () => {
  if (!isHomeActive.value) {
    router.push({ name: 'home' })
  }
}

const goToContact = () => {
  if (!isContactActive.value) {
    router.push({ name: 'contact' })
  }
}
</script>