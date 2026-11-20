<script setup lang="ts">
// Foto de fondo de las tarjetas del inicio (SCRUM-271). Recorta la foto para cualquier ancho, la oscurece un poco
// en toda su superficie y refuerza el degradado de abajo para que el texto blanco se lea con cualquier foto.
// Si la foto no carga (por ejemplo sin conexión), el contenedor deja ver su fondo verde.
import { ref, watch } from 'vue'

const props = defineProps<{ imagen?: string }>()

const fotoRota = ref(false)
watch(() => props.imagen, () => { fotoRota.value = false })
</script>

<template>
  <img
    v-if="imagen && !fotoRota"
    :src="imagen"
    alt=""
    class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
    @error="fotoRota = true"
  />
  <!-- Oscurecimiento leve de toda la foto (12 %) y degradado inferior reforzado (88 %) -->
  <div class="absolute inset-0 bg-black/[0.12]"></div>
  <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent"></div>
</template>
