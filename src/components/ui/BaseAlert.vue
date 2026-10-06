<script setup lang="ts">
import { computed } from 'vue'
import { Info, AlertTriangle, CheckCircle2, XCircle } from 'lucide-vue-next'

interface Props {
  variant?: 'info' | 'warning' | 'success' | 'danger'
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'info'
})

const variantStyles = computed(() => {
  switch (props.variant) {
    case 'warning':
      return {
        box: 'bg-amber-50 border-amber-300 text-amber-950',
        iconBg: 'bg-amber-400 text-amber-950',
        icon: AlertTriangle
      }
    case 'success':
      return {
        box: 'bg-emerald-50 border-emerald-300 text-emerald-950',
        iconBg: 'bg-status-success text-white',
        icon: CheckCircle2
      }
    case 'danger':
      return {
        box: 'bg-rose-50 border-rose-300 text-rose-950',
        iconBg: 'bg-status-danger text-white',
        icon: XCircle
      }
    case 'info':
    default:
      return {
        box: 'bg-amber-50 border-amber-300 text-amber-950',
        iconBg: 'bg-amber-400 text-amber-950',
        icon: Info
      }
  }
})
</script>

<template>
  <div 
    :class="[
      'border-2 rounded-2xl p-4 flex items-start gap-3.5 shadow-xs transition-colors',
      variantStyles.box
    ]"
    role="alert"
  >
    <div :class="['p-2 rounded-xl shrink-0 mt-0.5', variantStyles.iconBg]">
      <component :is="variantStyles.icon" class="w-5 h-5 stroke-[2.5]" />
    </div>

    <div class="space-y-0.5">
      <h3 v-if="title" class="font-extrabold text-base leading-tight">
        {{ title }}
      </h3>
      <div class="text-sm font-bold leading-snug">
        <slot />
      </div>
    </div>
  </div>
</template>