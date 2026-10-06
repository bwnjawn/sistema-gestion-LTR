<template>
  <header class="p-4 pt-6 bg-transparent flex items-center justify-between max-w-md mx-auto w-full">
    <!-- Marca Principal (Logo + Título + Ubicación) -->
    <div class="flex items-center gap-3 cursor-pointer" @click="goHome">
      <div class="w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-2 border-brand-border shadow-xs flex items-center justify-center p-1 shrink-0 overflow-hidden">
        <img 
          src="/images/logo.png" 
          alt="Logo Los Troncos de Repil" 
          class="w-full h-full object-cover rounded-full scale-150"
          @error="onImgError"
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

    <!-- Botones de Acción según la vista -->
    <div class="flex items-center gap-2 shrink-0">
      <slot>
        <!-- Botón Acceso Admin -->
        <button 
          v-if="showAdmin"
          type="button" 
          @click="emit('admin-click')" 
          class="text-[11px] font-black text-brand-dark bg-white/80 hover:bg-white border border-brand-border px-2.5 py-1 rounded-full shadow-2xs flex items-center gap-1 touch-target active:scale-95 transition-transform"
          title="Acceso Administración"
        >
          <ShieldCheck class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
          <span>Admin</span>
        </button>

        <!-- Botón Modo Oscuro -->
        <button 
          v-if="showDarkMode"
          type="button" 
          @click="emit('toggle-dark-mode')"
          class="flex items-center justify-center p-2.5 rounded-full bg-white dark:bg-gray-800 border-2 border-brand-border text-brand-dark dark:text-amber-300 shadow-xs active:scale-95 transition-transform touch-target shrink-0"
          title="Cambiar tema"
        >
          <Moon v-if="!isDarkMode" class="w-5 h-5 stroke-[2.5]" />
          <Sun v-else class="w-5 h-5 stroke-[2.5]" />
        </button>
      </slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ShieldCheck, Moon, Sun } from 'lucide-vue-next'

withDefaults(defineProps<{
  showAdmin?: boolean
  showDarkMode?: boolean
  isDarkMode?: boolean
}>(), {
  showAdmin: false,
  showDarkMode: false,
  isDarkMode: false
})

const emit = defineEmits<{
  (e: 'admin-click'): void
  (e: 'toggle-dark-mode'): void
}>()

const router = useRouter()

const goHome = () => {
  router.push({ name: 'home' })
}

const onImgError = (e: Event) => {
  const target = e.target as HTMLImageElement
  target.src = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=200&q=80'
}
</script>