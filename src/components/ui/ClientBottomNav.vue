<template>
  <!-- Mismo estilo que la barra del admin: ícono relleno y oscuro cuando está activo, más una etiqueta -->
  <nav class="barra-fija-inferior fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-[#e3eae1]/95 backdrop-blur-md border-t-2 border-brand-border px-2.5 pt-2.5 pb-seguro-nav shadow-2xl">
    <div class="grid grid-cols-2 gap-2">
      <button
        v-for="item in items"
        :key="item.etiqueta"
        type="button"
        @click="item.ir"
        :aria-label="item.etiqueta"
        :aria-current="item.activo ? 'page' : undefined"
        :class="[
          'py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 touch-target active:scale-95 transition-colors',
          item.activo ? 'text-brand-dark' : 'text-gray-600'
        ]"
      >
        <IconoBarra :nombre="item.icono" :activo="item.activo" />
        <span :class="['text-sm', item.activo ? 'font-bold' : 'font-normal']">{{ item.etiqueta }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import IconoBarra, { type NombreIconoBarra } from './IconoBarra.vue'

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

const items = computed<{ etiqueta: string; icono: NombreIconoBarra; activo: boolean; ir: () => void }[]>(() => [
  { etiqueta: 'Inicio', icono: 'inicio', activo: isHomeActive.value, ir: goToHome },
  { etiqueta: 'Contacto', icono: 'contacto', activo: isContactActive.value, ir: goToContact }
])
</script>
