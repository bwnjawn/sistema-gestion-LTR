<script setup lang="ts">
import type { Component } from 'vue'

// Título de sección del panel de administración: un solo patrón para todas las pantallas.
defineProps<{
  title: string
  subtitle?: string
  icon?: Component
}>()
</script>

<template>
  <div class="flex items-start justify-between gap-3">
    <div class="flex items-start gap-3 min-w-0">
      <component :is="icon" v-if="icon" class="w-7 h-7 text-brand-accent stroke-[2.5] shrink-0 mt-0.5" aria-hidden="true" />
      <div class="min-w-0">
        <h1 class="text-2xl font-black text-brand-dark leading-tight">{{ title }}</h1>
        <p v-if="subtitle" class="text-sm font-bold text-gray-700 mt-0.5">{{ subtitle }}</p>
      </div>
    </div>
    <div class="shrink-0">
      <slot />
    </div>
  </div>
</template>
