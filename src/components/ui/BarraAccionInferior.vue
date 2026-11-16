<script setup lang="ts">
import { ArrowRight, Send } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'
import { formatCLP } from '../../lib/format'

// Barra fija inferior de los pasos de reserva: una sola acción, la de avanzar.
// Volver atrás se hace desde el encabezado.
defineProps<{
  disabled?: boolean
  /** Trabajando: muestra el spinner y no deja tocar de nuevo. */
  loading?: boolean
  /** Muestra el ícono de enviar en vez de la flecha (último paso). */
  enviar?: boolean
  /** Si se indica, la barra muestra el total encima del botón. */
  total?: number
  /** Abono que exige la reserva; con 0 y `sinAbono` dice que no se exige. */
  abono?: number
  sinAbono?: boolean
}>()

defineEmits<{ (e: 'click', ev: MouseEvent): void }>()
</script>

<template>
  <div class="barra-fija-inferior fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border px-3.5 pt-3.5 pb-seguro-nav shadow-2xl">
    <div class="max-w-md mx-auto space-y-2.5">
      <div v-if="total !== undefined" class="flex items-end justify-between gap-3 px-1">
        <div>
          <p class="text-sm text-gray-700">Total</p>
          <p class="text-2xl font-bold text-brand-dark leading-none">{{ formatCLP(total) }}</p>
        </div>
        <div v-if="abono || sinAbono" class="text-right">
          <p class="text-sm text-gray-700">{{ abono ? 'Abono para confirmar' : 'Abono' }}</p>
          <p class="text-lg font-bold text-brand-accent leading-none">{{ abono ? formatCLP(abono) : 'No se exige' }}</p>
        </div>
      </div>
      <BaseButton
        variant="primary"
        size="lg"
        full-width
        :disabled="disabled"
        :loading="loading"
        @click="$emit('click', $event)"
      >
        <Send v-if="enviar && !loading" class="w-5 h-5 mr-1.5 stroke-[2.5]" aria-hidden="true" />
        <slot />
        <ArrowRight v-if="!enviar && !loading" class="w-5 h-5 ml-1.5 stroke-[2.5]" aria-hidden="true" />
      </BaseButton>
    </div>
  </div>
</template>
