<script setup lang="ts">
// Barra superior del cliente en PC (desde 1024 px, SCRUM-278). En el teléfono no se ve: ahí se usa
// la barra inferior (`ClientBottomNav`). Lleva el logo, el nombre del lugar y las dos secciones.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const secciones = computed(() => [
  { etiqueta: 'Reservar', ruta: '/', activa: route.path === '/' },
  { etiqueta: 'Contacto', ruta: '/contacto', activa: route.path === '/contacto' }
])
</script>

<template>
  <header class="hidden lg:block sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-10 h-[4.5rem] flex items-center gap-10">
      <button type="button" class="flex items-center gap-3 text-left" aria-label="Ir al inicio" @click="router.push('/')">
        <img src="/images/logo.png" alt="" class="w-11 h-11 rounded-xl border border-gray-200 object-contain bg-white p-1" />
        <span>
          <span class="block text-sm font-bold text-brand-accent leading-none">Centro Turístico</span>
          <span class="block text-lg font-bold text-brand-dark leading-tight">Los Troncos de Repil</span>
        </span>
      </button>

      <nav aria-label="Secciones" class="ml-auto flex items-center gap-2">
        <button
          v-for="s in secciones"
          :key="s.ruta"
          type="button"
          :aria-current="s.activa ? 'page' : undefined"
          :class="[
            'px-4 py-2.5 rounded-xl text-base transition-colors',
            s.activa ? 'bg-emerald-50 text-brand-dark font-bold' : 'text-gray-700 hover:bg-gray-100'
          ]"
          @click="router.push(s.ruta)"
        >{{ s.etiqueta }}</button>
      </nav>
    </div>
  </header>
</template>
