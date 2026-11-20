<script setup lang="ts">
import { useMenuAdmin } from '../../composables/useMenuAdmin'
import IconoBarra from '../ui/IconoBarra.vue'

const { secciones: navItems, pendientes, textoPendientes, estaActiva: isActive, ir: navigate } = useMenuAdmin()
</script>

<template>
  <!-- Solo en teléfono y tablet: en PC se usa el menú lateral (AdminMenuLateral).
       El ícono activo se rellena y se oscurece; los demás quedan en contorno gris -->
  <nav class="lg:hidden barra-fija-inferior fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-brand-border px-2 pt-2.5 pb-seguro-nav shadow-2xl">
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
