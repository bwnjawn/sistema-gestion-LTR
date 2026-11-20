<script setup lang="ts">
// Tarjeta que hace de "ventana" dentro de la página (SCRUM-278): mismas ranuras que `HojaModal`
// (`cabecera`, contenido y `pie`), pero sin fondo oscuro ni capa encima. Sirve para mostrar un detalle al lado de una
// lista en PC; el mismo contenido se abre en una `HojaModal` en el teléfono.
</script>

<template>
  <section class="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
    <slot name="cabecera" />
    <div class="overflow-y-auto grow min-h-0">
      <slot />
    </div>
    <footer v-if="$slots.pie" class="px-5 py-4 border-t border-gray-200 bg-white shrink-0">
      <slot name="pie" />
    </footer>
  </section>
</template>
