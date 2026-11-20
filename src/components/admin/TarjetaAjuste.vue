<script setup lang="ts">
// Tarjeta de un ajuste del panel: título, botón para editar y un resumen de lo que hay hoy (slot).
// La edición se hace en una hoja (`HojaModal`) que abre quien usa la tarjeta.
withDefaults(defineProps<{ titulo: string; textoBoton?: string }>(), { textoBoton: 'Editar' })
const emit = defineEmits<{ (e: 'editar'): void }>()
</script>

<template>
  <section class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-sm font-black text-brand-dark">{{ titulo }}</h3>
      <button type="button" class="py-1.5 px-3 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-100" @click="emit('editar')">
        {{ textoBoton }}
      </button>
    </div>
    <div class="space-y-2 text-sm text-gray-700 bg-brand-light p-3 rounded-2xl border border-brand-border">
      <slot />
    </div>
  </section>
</template>
