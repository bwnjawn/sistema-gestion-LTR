<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle, XCircle, CheckCircle2, Info, X } from 'lucide-vue-next'

interface Props {
  type?: 'warning' | 'danger' | 'success' | 'info'
  title?: string
  message: string
  dismissible?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'warning',
  dismissible: false,
})

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()

const iconComponent = computed(() => {
  switch (props.type) {
    case 'warning':
      return AlertTriangle
    case 'danger':
      return XCircle
    case 'success':
      return CheckCircle2
    case 'info':
    default:
      return Info
  }
})

const config = computed(() => {
  switch (props.type) {
    case 'warning':
      return {
        bg: 'bg-status-warning/10',
        border: 'border-status-warning',
        text: 'text-status-warning',
      }
    case 'danger':
      return {
        bg: 'bg-status-danger/10',
        border: 'border-status-danger',
        text: 'text-status-danger',
      }
    case 'success':
      return {
        bg: 'bg-status-success/10',
        border: 'border-status-success',
        text: 'text-status-success',
      }
    case 'info':
    default:
      return {
        bg: 'bg-brand-accent/10',
        border: 'border-brand-accent',
        text: 'text-brand-accent',
      }
  }
})
</script>

<template>
  <div :class="['p-4 rounded-xl border-2 flex items-start gap-3 shadow-sm', config.bg, config.border]">
    <component :is="iconComponent" :class="['w-7 h-7 shrink-0 stroke-[2.5]', config.text]" />
    <div class="grow">
      <h4 v-if="title" :class="['font-bold text-lg mb-0.5', config.text]">{{ title }}</h4>
      <p class="text-brand-text text-base leading-relaxed font-medium">{{ message }}</p>
    </div>
    <button
      v-if="dismissible"
      type="button"
      class="text-gray-500 hover:text-gray-800 p-1 rounded-lg touch-target"
      @click="emit('dismiss')"
    >
      <X class="w-5 h-5" />
    </button>
  </div>
</template>