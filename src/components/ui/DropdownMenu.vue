<script setup lang="ts">
import { ref, nextTick, onBeforeUnmount, type Component } from 'vue'
import { MoreVertical, ChevronDown, Check } from 'lucide-vue-next'

export interface DropdownItem {
  key: string
  label: string
  icon?: Component
  danger?: boolean
  /** Para opciones excluyentes (como el tamaño de la letra): marca la que está elegida. */
  activo?: boolean
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
  /** Botón de tres puntos sin borde ni fondo, para esquinas de tarjetas (el área de toque sigue siendo de 44 px). */
  discreto?: boolean
}>()

const emit = defineEmits<{ (e: 'select', key: string): void }>()

const isOpen = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const menuStyle = ref<Record<string, string>>({})

const MENU_WIDTH = 220

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
      'inline-flex items-center justify-center gap-1.5 text-brand-dark font-bold text-sm transition-all',
      discreto
        ? 'w-11 h-11 rounded-full text-gray-600 active:bg-gray-100'
        : 'touch-target border border-brand-border bg-brand-light active:scale-95 hover:bg-gray-100',
      !discreto && (label ? 'py-2.5 px-3 rounded-2xl w-full' : 'p-2.5 rounded-xl')
    ]"
  >
    <template v-if="label">
      <component :is="icon" v-if="icon" class="w-4 h-4 text-brand-accent stroke-[2.5]" />
      <span>{{ label }}</span>
      <ChevronDown :class="['w-4 h-4 stroke-[2.5] transition-transform', isOpen ? 'rotate-180' : '']" />
    </template>
    <component :is="triggerIcon" v-else-if="triggerIcon" class="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
    <MoreVertical v-else :class="discreto ? 'w-5 h-5 stroke-2' : 'w-4 h-4 stroke-[2.5]'" />
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
        :role="item.activo === undefined ? 'menuitem' : 'menuitemradio'"
        :aria-checked="item.activo"
        @click.stop="choose(item.key)"
        :class="[
          'w-full flex items-center gap-2 px-3 py-3 rounded-xl text-base font-bold text-left active:scale-98 transition-colors',
          item.danger ? 'text-rose-700 hover:bg-rose-50' : 'text-brand-dark hover:bg-brand-light'
        ]"
      >
        <component :is="item.icon" v-if="item.icon" class="w-5 h-5 stroke-[2.5] shrink-0" />
        <span class="grow">{{ item.label }}</span>
        <Check v-if="item.activo" class="w-5 h-5 stroke-[3] text-brand-accent shrink-0" aria-hidden="true" />
      </button>
    </div>
  </Teleport>
</template>
