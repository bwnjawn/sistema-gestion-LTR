<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost'
  size?: 'md' | 'lg' | 'xl'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'lg',
  type: 'button',
  disabled: false,
  loading: false,
  fullWidth: false,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'primary':
      return 'bg-brand-dark hover:bg-opacity-90 text-white border-2 border-brand-dark focus:ring-4 focus:ring-brand-dark/30'
    case 'secondary':
      return 'bg-brand-accent hover:bg-opacity-90 text-white border-2 border-brand-accent focus:ring-4 focus:ring-brand-accent/30'
    case 'success':
      return 'bg-status-success hover:bg-opacity-90 text-white border-2 border-status-success focus:ring-4 focus:ring-status-success/30'
    case 'danger':
      return 'bg-status-danger hover:bg-opacity-90 text-white border-2 border-status-danger focus:ring-4 focus:ring-status-danger/30'
    case 'outline':
      return 'bg-white hover:bg-brand-light text-brand-dark border-2 border-brand-dark focus:ring-4 focus:ring-brand-dark/20'
    case 'ghost':
      return 'bg-transparent hover:bg-black/5 text-brand-text border-2 border-transparent'
    default:
      return ''
  }
})

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'md':
      return 'py-2.5 px-5 text-base rounded-xl touch-target'
    case 'lg':
      return 'py-3.5 px-6 text-lg font-bold rounded-xl touch-target'
    case 'xl':
      return 'py-4 px-8 text-xl font-bold rounded-2xl touch-target'
    default:
      return ''
  }
})

function handleClick(event: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-bold tracking-wide transition-all active:scale-[0.98]',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
      variantClasses,
      sizeClasses,
      { 'w-full': fullWidth }
    ]"
    @click="handleClick"
  >
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-3 h-6 w-6 text-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <slot />
  </button>
</template>