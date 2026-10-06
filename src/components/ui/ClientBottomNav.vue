<template>
  <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-[#e3eae1]/95 dark:bg-gray-900/95 backdrop-blur-md border-t-2 border-brand-border p-2.5 shadow-2xl">
    <div class="grid grid-cols-2 gap-2">
      <!-- Pestaña Inicio -->
      <button 
        type="button" 
        @click="goToHome"
        :class="[
          'py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border touch-target active:scale-95 transition-all',
          isHomeActive
            ? 'bg-[#c5d7be] dark:bg-brand-dark text-brand-dark dark:text-white border-brand-border shadow-2xs'
            : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white text-gray-600 dark:text-gray-300 border-brand-border/60 font-extrabold'
        ]"
      >
        <Home class="w-4 h-4 stroke-[2.5]" />
        <span>Inicio</span>
      </button>

      <!-- Pestaña Contacto -->
      <button 
        type="button" 
        @click="goToContact"
        :class="[
          'py-2.5 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border touch-target active:scale-95 transition-all',
          isContactActive
            ? 'bg-[#c5d7be] dark:bg-brand-dark text-brand-dark dark:text-white border-brand-border shadow-2xs'
            : 'bg-white/60 dark:bg-gray-800/60 hover:bg-white text-gray-600 dark:text-gray-300 border-brand-border/60 font-extrabold'
        ]"
      >
        <PhoneCall class="w-4 h-4 stroke-[2.5]" />
        <span>Contacto</span>
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