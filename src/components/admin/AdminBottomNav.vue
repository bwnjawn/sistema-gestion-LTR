<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Home, Inbox, Calendar, Grid, Settings } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const navItems = [
  { name: 'Inicio', path: '/admin', icon: Home },
  { name: 'Solicitudes', path: '/admin/solicitudes', icon: Inbox },
  { name: 'Calendario', path: '/admin/calendario', icon: Calendar },
  { name: 'Catálogo', path: '/admin/catalogo', icon: Grid },
  { name: 'Ajustes', path: '/admin/ajustes', icon: Settings }
]

function isActive(path: string) {
  if (path === '/admin') {
    return route.path === '/admin' || route.path === '/admin/' || route.path === '/admin/dashboard'
  }
  return route.path.startsWith(path)
}

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-2 shadow-2xl">
    <div class="max-w-md mx-auto grid grid-cols-5 gap-1">
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        @click="navigate(item.path)"
        :class="[
          'flex flex-col items-center justify-center py-2 px-0.5 rounded-2xl transition-all touch-target',
          isActive(item.path)
            ? 'bg-brand-dark text-white font-black shadow-xs'
            : 'text-gray-600 hover:bg-brand-light font-bold'
        ]"
      >
        <component :is="item.icon" :class="['w-5 h-5 stroke-[2.5]', isActive(item.path) ? 'text-emerald-300' : 'text-gray-500']" />
        <span class="text-[9px] mt-1 tracking-tight truncate w-full text-center">{{ item.name }}</span>
      </button>
    </div>
  </nav>
</template>