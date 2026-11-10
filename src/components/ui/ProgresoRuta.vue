<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

// Barra fina arriba que aparece si cambiar de pantalla tarda (descarga lenta de la
// pantalla). Con conexión rápida ni se alcanza a ver.
const router = useRouter()
const visible = ref(false)
let temporizador: ReturnType<typeof setTimeout> | undefined

function mostrar() {
  temporizador = setTimeout(() => { visible.value = true }, 150)
}
function ocultar() {
  clearTimeout(temporizador)
  visible.value = false
}

const quitarAntes = router.beforeEach((to, from) => {
  if (to.fullPath !== from.fullPath) mostrar()
})
const quitarDespues = router.afterEach(ocultar)
const quitarError = router.onError(ocultar)

onBeforeUnmount(() => {
  quitarAntes()
  quitarDespues()
  quitarError()
  clearTimeout(temporizador)
})
</script>

<template>
  <div
    v-if="visible"
    role="progressbar"
    aria-label="Cargando pantalla"
    aria-busy="true"
    class="fixed top-0 left-0 right-0 h-1 z-[70] overflow-hidden bg-brand-border/40 pointer-events-none"
  >
    <div class="progreso-ruta-barra h-full w-1/3 bg-brand-accent"></div>
  </div>
</template>
