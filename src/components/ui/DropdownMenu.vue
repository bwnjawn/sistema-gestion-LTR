<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, type Component } from 'vue'
import { MoreVertical, ChevronDown } from 'lucide-vue-next'

export interface DropdownItem {
  key: string
  label: string
  icon?: Component
  danger?: boolean
}

defineProps<{
  items: DropdownItem[]
  /** Si se indica, el botón muestra texto y flecha; si no, solo el ícono de tres puntos. */
  label?: string
  /** Ícono opcional al inicio del botón con texto. */
  icon?: Component
  /** Ícono del botón cuando no tiene texto (por defecto, tres puntos). */
  triggerIcon?: Component
  ariaLabel?: string
}>()

const emit = defineEmits<{ (e: 'select', key: string): void }>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

const MENU_WIDTH = 190

function updatePosition() {
  const el = triggerRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const menuHeight = menuRef.value?.offsetHeight ?? 0
  const left = Math.min(
    Math.max(8, rect.right - MENU_WIDTH),
    window.innerWidth - MENU_WIDTH - 8
  )
  const fitsBelow = rect.bottom + 6 + menuHeight <= window.innerHeight - 8
  const top = fitsBelow ? rect.bottom + 6 : Math.max(8, rect.top - 6 - menuHeight)
  menuStyle.value = { top: `${top}px`, left: `${left}px`, width: `${MENU_WIDTH}px` }
}

function onDocPointer(e: Event) {
  const t = e.target as Node
  if (triggerRef.value?.contains(t) || menuRef.value?.contains(t)) return
  close()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
    triggerRef.value?.focus()
  }
}

function open() {
  isOpen.value = true
  updatePosition()
  nextTick(updatePosition)
  document.addEventListener('pointerdown', onDocPointer)
  document.addEventListener('keydown', onKey)
  window.addEventListener('resize', close)
  window.addEventListener('scroll', close, true)
}

function close() {
  isOpen.value = false
  document.removeEventListener('pointerdown', onDocPointer)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('resize', close)
  window.removeEventListener('scroll', close, true)
}

function toggle() {
  isOpen.value ? close() : open()
}

function choose(key: string) {
  close()
  emit('select', key)
}

onBeforeUnmount(close)

</script>

<template>
  <button
    ref="triggerRef"
    type="button"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    :aria-label="ariaLabel || label || 'Opciones'"
    @click.stop="toggle"
    :class="[
      'touch-target inline-flex items-center justify-center gap-1.5 border border-brand-border bg-brand-light text-brand-dark font-black text-xs active:scale-95 hover:bg-gray-100 transition-all',
      label ? 'py-2.5 px-3 rounded-2xl w-full' : 'p-2.5 rounded-xl'
    ]"
  >
    <template v-if="label">
      <component :is="icon" v-if="icon" class="w-4 h-4 text-brand-accent stroke-[2.5]" />
      <span>{{ label }}</span>
      <ChevronDown :class="['w-4 h-4 stroke-[2.5] transition-transform', isOpen ? 'rotate-180' : '']" />
    </template>
    <component :is="triggerIcon" v-else-if="triggerIcon" class="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
    <MoreVertical v-else class="w-4 h-4 stroke-[2.5]" />
  </button>

  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="menuRef"
      role="menu"
      :style="menuStyle"
      class="fixed z-50 bg-white rounded-2xl border-2 border-brand-border shadow-xl p-1.5 space-y-0.5"
    >
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        role="menuitem"
        @click.stop="choose(item.key)"
        :class="[
          'w-full flex items-center gap-2 px-3 py-3 rounded-xl text-xs font-black text-left active:scale-98 transition-colors',
          item.danger ? 'text-rose-700 hover:bg-rose-50' : 'text-brand-dark hover:bg-brand-light'
        ]"
      >
        <component :is="item.icon" v-if="item.icon" class="w-4 h-4 stroke-[2.5]" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </Teleport>
</template>
