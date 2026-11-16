<script setup lang="ts">
import { computed } from 'vue'
import { User, Phone } from 'lucide-vue-next'
import { formatCLP } from '../../lib/format'
import { STATUS_LABELS } from '../../services/requests'
import type { ReservationRequest } from '../../types/domain'

const props = defineProps<{ request: ReservationRequest; seCruza?: boolean }>()
defineEmits<{ (e: 'abrir', id: string): void }>()

// Franja de color a la izquierda según el estado, igual que en la lista de Solicitudes
const borde = computed(() => {
  switch (props.request.status) {
    case 'confirmed': return 'border-l-status-success'
    case 'rejected': return 'border-l-status-danger'
    case 'cancelled': return 'border-l-gray-500'
    default: return 'border-l-amber-500'
  }
})

const insignia = computed(() => {
  switch (props.request.status) {
    case 'confirmed': return 'bg-status-success text-white'
    case 'rejected': return 'bg-status-danger text-white'
    case 'cancelled': return 'bg-gray-600 text-white'
    default: return 'bg-amber-200 text-amber-950 border border-amber-500'
  }
})
</script>

<template>
  <button
    type="button"
    @click="$emit('abrir', request.id)"
    :class="['w-full text-left bg-white p-3 rounded-2xl border border-gray-500 border-l-8 text-xs font-bold space-y-1.5 active:scale-[0.99] transition-transform', borde]"
  >
    <div class="flex justify-between items-start gap-2">
      <div class="min-w-0">
        <span class="font-black text-brand-dark block text-sm truncate">{{ request.clientName }}</span>
        <span class="text-xs text-gray-700 font-extrabold">{{ request.resourceName }} - {{ request.requestCode }}</span>
      </div>
      <span class="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
        <span v-if="seCruza" class="text-xs font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 border border-status-danger text-rose-950">Se cruza</span>
        <span :class="['text-xs font-black uppercase px-2 py-0.5 rounded-full', insignia]">{{ STATUS_LABELS[request.status] }}</span>
      </span>
    </div>
    <div class="flex items-center gap-3 text-xs text-gray-600 border-t border-gray-200/60 pt-1.5">
      <span class="flex items-center gap-1"><User class="w-3.5 h-3.5 text-brand-accent" /> {{ request.guestsCount }} pers.</span>
      <span class="flex items-center gap-1"><Phone class="w-3.5 h-3.5 text-brand-accent" /> {{ request.clientPhone }}</span>
      <span class="font-black text-brand-dark ml-auto">{{ formatCLP(request.totalAmount) }}</span>
    </div>
  </button>
</template>
