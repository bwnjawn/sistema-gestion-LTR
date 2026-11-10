<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Encabezado pegado arriba con `fixed` (igual que las barras inferiores), más un
// espacio del mismo alto para que el contenido no quede debajo. Así el encabezado y las
// barras usan el mismo mecanismo y la misma compensación del viewport de iOS.
defineOptions({ inheritAttrs: false })

const el = ref<HTMLElement | null>(null)
const alto = ref(0)
let observador: ResizeObserver | undefined

function medir() {
  if (el.value) alto.value = el.value.offsetHeight
}

onMounted(() => {
  medir()
  if (typeof ResizeObserver !== 'undefined' && el.value) {
    observador = new ResizeObserver(medir)
    observador.observe(el.value)
  }
})
onBeforeUnmount(() => observador?.disconnect())
</script>

<template>
  <div :style="{ height: alto + 'px' }">
    <header
      ref="el"
      v-bind="$attrs"
      class="encabezado-fijo fixed top-0 left-0 right-0 z-40 pt-[env(safe-area-inset-top,0px)]"
    >
      <slot />
    </header>
  </div>
</template>
