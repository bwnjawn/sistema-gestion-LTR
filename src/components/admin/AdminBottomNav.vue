<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRequestsStore } from '../../stores/requestsStore'
import IconoBarra, { type NombreIconoBarra } from '../ui/IconoBarra.vue'

const route = useRoute()
const router = useRouter()
const requestsStore = useRequestsStore()

// Solicitudes pendientes por resolver: el número que se muestra sobre el ícono de Solicitudes
const pendientes = computed(() => requestsStore.requests.filter(r => r.status === 'pending').length)
const textoPendientes = computed(() => (pendientes.value > 99 ? '99+' : String(pendientes.value)))

const navItems: { name: string; path: string; icono: NombreIconoBarra }[] = [
  { name: 'Inicio', path: '/admin', icono: 'inicio' },
  { name: 'Solicitudes', path: '/admin/solicitudes', icono: 'solicitudes' },
  { name: 'Calendario', path: '/admin/calendario', icono: 'calendario' },
  { name: 'Catálogo', path: '/admin/catalogo', icono: 'catalogo' },
  { name: 'Ajustes', path: '/admin/ajustes', icono: 'ajustes' }
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
  <!-- El ícono activo se rellena y se oscurece; los demás quedan en contorno gris -->
  <nav class="barra-fija-inferior fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-brand-border px-2 pt-2.5 pb-seguro-nav shadow-2xl">
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
          'relative flex items-center justify-center py-3 px-0.5 rounded-2xl transition-colors active:scale-95 touch-target',
          isActive(item.path) ? 'text-brand-dark' : 'text-gray-600'
        ]"
      >
        <IconoBarra :nombre="item.icono" :activo="isActive(item.path)" />
        <span
          v-if="item.icono === 'solicitudes' && pendientes > 0"
          class="absolute top-1.5 left-1/2 ml-1.5 min-w-5 h-5 px-1 rounded-full bg-status-danger text-white text-sm font-bold leading-5 text-center border-2 border-white box-content"
          :aria-label="`${pendientes} pendientes`"
        >{{ textoPendientes }}</span>
      </button>
    </div>
  </nav>
</template>
