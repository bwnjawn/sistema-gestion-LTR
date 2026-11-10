<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Home, ClipboardList, Calendar, BookOpen, Settings } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const navItems = [
  { name: 'Inicio', path: '/admin', icon: Home },
  { name: 'Solicitudes', path: '/admin/solicitudes', icon: ClipboardList },
  { name: 'Calendario', path: '/admin/calendario', icon: Calendar },
  { name: 'Catálogo', path: '/admin/catalogo', icon: BookOpen },
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
  <nav class="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-brand-border px-2 pt-2.5 pb-seguro-nav shadow-2xl">
    <div class="max-w-md mx-auto grid grid-cols-5 gap-1">
      <button
        v-for="item in navItems"
        :key="item.path"
        type="button"
        @click="navigate(item.path)"
        :aria-label="item.name"
        :aria-current="isActive(item.path) ? 'page' : undefined"
        :title="item.name"
        :class="[
          'flex items-center justify-center py-3 px-0.5 rounded-2xl transition-all touch-target',
          isActive(item.path)
            ? 'bg-brand-dark text-white font-black shadow-xs'
            : 'text-gray-800 hover:bg-brand-light font-bold'
        ]"
      >
        <component :is="item.icon" aria-hidden="true" :class="['w-6 h-6 stroke-[2.5]', isActive(item.path) ? 'text-emerald-300' : 'text-gray-700']" />
      </button>
    </div>
  </nav>
</template>