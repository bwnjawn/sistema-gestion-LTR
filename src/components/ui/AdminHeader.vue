<template>
  <header class="p-4 pt-6 bg-transparent flex items-center justify-between max-w-md mx-auto w-full">
    <!-- Marca Principal (Logo + Título + Subtítulo Admin) -->
    <div class="flex items-center gap-3 cursor-pointer" @click="goDashboard">
      <div class="w-16 h-16 rounded-full bg-white border-2 border-brand-border shadow-xs flex items-center justify-center p-1 shrink-0 overflow-hidden">
        <img 
          src="/images/logo.png" 
          alt="Logo Los Troncos de Repil" 
          class="w-full h-full object-cover rounded-full scale-150"
          @error="onImgError"
        />
      </div>
      <div>
        <h1 class="text-lg font-black text-brand-dark leading-tight tracking-tight">
          Los Troncos de Repil
        </h1>
        <p class="text-xs font-extrabold text-brand-accent">
          Panel de Administración
        </p>
      </div>
    </div>

    <!-- Indicador de Conectividad Estilizado -->
    <div class="flex items-center gap-2 shrink-0">
      <div 
        class="text-[11px] font-black text-brand-dark bg-white/90 border border-brand-border px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1.5 touch-target shrink-0"
        :title="isOnline ? 'Sistema conectado a internet' : 'Modo fuera de línea activo'"
      >
        <span 
          class="w-2.5 h-2.5 rounded-full"
          :class="isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'"
        ></span>
        <span>{{ isOnline ? 'Conectado' : 'Sin señal' }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isOnline = ref(navigator.onLine)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

const goDashboard = () => {
  router.push({ name: 'admin-dashboard' })
}

const onImgError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=200&q=80'
}
</script>