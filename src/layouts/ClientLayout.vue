<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

function goHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-brand-light flex flex-col font-sans antialiased text-brand-dark pb-12">
    
    <!-- Encabezado visible únicamente en la pantalla principal (/) -->
    <header v-if="route.path === '/'" class="w-full max-w-md mx-auto pt-2 px-3">
      <div 
        @click="goHome"
        class="bg-brand-dark text-white p-4 rounded-3xl border-2 border-brand-border shadow-md cursor-pointer transition-transform active:scale-98 flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-3.5">
          <!-- Logo de 64x64 px -->
          <div class="w-16 h-16 bg-white rounded-2xl p-2 shrink-0 flex items-center justify-center shadow-xs border border-emerald-100">
            <img 
              src="/images/logo.png" 
              alt="Logo Los Troncos de Repil" 
              class="w-full h-full object-contain"
              @error="(e) => { (e.target as HTMLImageElement).src = '/favicon.ico' }"
            />
          </div>

          <!-- Título con tipografía moderna -->
          <div class="space-y-0.5">
            <span class="text-[10px] font-extrabold text-emerald-300 uppercase tracking-widest block leading-none">
              Centro Turístico
            </span>
            <h1 class="text-xl font-black text-white tracking-tight leading-tight font-modern">
              Los Troncos de Repil
            </h1>
            <span class="text-[11px] font-bold text-gray-300 block leading-none">
              Reservas y Servicios
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Área de contenido para los pasos -->
    <main class="grow p-4">
      <RouterView />
    </main>

  </div>
</template>

<style scoped>
.font-modern {
  font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
}
</style>