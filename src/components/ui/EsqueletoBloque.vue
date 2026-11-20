<script setup lang="ts">
// Un bloque gris que imita lo que va a aparecer (SCRUM-258). Es decorativo: quien lo usa pone aria-busy y el
// aviso para el lector de pantalla. Sin texto adentro; la clase decide el tamaño y la forma.
</script>

<template>
  <div class="esqueleto-bloque bg-[#c9d4c3] rounded-xl" aria-hidden="true"></div>
</template>

<style scoped>
.esqueleto-bloque { animation: esqueleto-pulso 1.4s ease-in-out infinite; }
@keyframes esqueleto-pulso { 50% { opacity: .55; } }
@media (prefers-reduced-motion: reduce) { .esqueleto-bloque { animation: none; } }
</style>
