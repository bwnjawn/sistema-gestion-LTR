<script setup lang="ts">
import { computed, inject } from 'vue'
import { DESTINO_BARRA_INFERIOR } from './marcoApp'
import { usePantallaAncha } from '../../composables/usePantallaAncha'

// Envuelve una barra inferior (la de acción de los pasos, la navegación del cliente). En teléfono la lleva al
// contenedor de abajo del marco (`MarcoApp`), fuera del contenido que se desplaza, para que nunca se despegue.
// En PC, o si no hay marco, la deja donde está.
const destino = inject(DESTINO_BARRA_INFERIOR, null)
const { esAncha } = usePantallaAncha()
const activo = computed(() => !!destino?.value && !esAncha.value)
</script>

<template>
  <Teleport :to="destino ?? undefined" :disabled="!activo">
    <slot />
  </Teleport>
</template>
