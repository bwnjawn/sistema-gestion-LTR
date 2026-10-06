<script setup lang="ts">
import { computed } from 'vue'
import { Info, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-vue-next'

interface Props {
  variant?: 'info' | 'warning' | 'success' | 'danger'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info',
  title: undefined
})

// 1. Estilos por variante (corregido para usar alertClasses)
const alertClasses = computed(() => {
  switch (props.variant) {
    case 'warning':
      return 'bg-amber-50 border-amber-200 text-amber-900'
    case 'success':
      return 'bg-emerald-50 border-emerald-200 text-emerald-900'
    case 'danger':
      return 'bg-rose-50 border-rose-200 text-rose-900'
    case 'info':
    default:
      return 'bg-amber-50/90 border-amber-200 text-amber-950'
  }
})

// 2. Icono reactivo según la variante (corregido para exponer 'icon')
const icon = computed(() => {
  switch (props.variant) {
    case 'warning':
      return AlertTriangle
    case 'success':
      return CheckCircle2
    case 'danger':
      return AlertCircle
    case 'info':
    default:
      return Info
  }
})
</script>

<template>
  <div :class="['p-3.5 rounded-2xl border-2 flex items-start gap-3', alertClasses]">
    <!-- Icono del cuadro de alerta -->
    <component :is="icon" class="w-5 h-5 shrink-0 mt-0.5 stroke-[2.5]" />

    <div class="space-y-0.5">
      <!-- Título destacado en negrita -->
      <h4 v-if="title" class="font-extrabold text-xs uppercase tracking-wider">
        {{ title }}
      </h4>

      <!-- Mensaje secundario en texto normal sin negrita -->
      <div class="text-xs font-normal leading-relaxed opacity-90">
        <slot />
      </div>
    </div>
  </div>
</template>