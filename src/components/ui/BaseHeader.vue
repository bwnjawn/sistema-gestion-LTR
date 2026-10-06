<script setup lang="ts">
import { ChevronLeft, Wifi } from 'lucide-vue-next'
import StepIndicator from './StepIndicator.vue'

interface Props {
  variant?: 'client' | 'admin'
  category?: string
  currentStep?: number
  totalSteps?: number
  showBack?: boolean
  isConnected?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'client',
  currentStep: 0, // 0 indica que no está en el wizard (ej. Portada)
  totalSteps: 4,
  showBack: false,
  isConnected: true
})

const emit = defineEmits<{
  (e: 'back'): void
}>()
</script>

<template>
  <header class="bg-brand-dark text-white shadow-md border-b-4 border-brand-accent sticky top-0 z-40">
    <div class="max-w-md mx-auto px-4 py-3">
      
      <div class="flex items-center justify-between gap-3">
        <!-- Marca Principal (Logo + Los Troncos de Repil) -->
        <div class="flex items-center gap-2.5">
          <button
            v-if="showBack"
            type="button"
            aria-label="Volver atrás"
            class="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white touch-target transition-colors shrink-0"
            @click="emit('back')"
          >
            <ChevronLeft class="w-6 h-6 stroke-[2.5]" />
          </button>

          <!-- Isotipo/Logo -->
          <div class="w-9 h-9 rounded-xl bg-white p-1 shadow-sm shrink-0 flex items-center justify-center">
            <img src="/images/logo.png" alt="Los Troncos de Repil" class="w-full h-full object-contain" />
          </div>

          <!-- Nombre Institucional -->
          <div>
            <h1 class="text-lg font-extrabold tracking-tight leading-none text-white">
              Los Troncos de Repil
            </h1>
            <span v-if="category" class="text-[11px] font-bold text-brand-light/80 uppercase tracking-wider block mt-0.5">
              {{ category }}
            </span>
          </div>
        </div>

        <!-- Indicador Admin -->
        <div v-if="variant === 'admin'" class="shrink-0">
          <span 
            v-if="isConnected"
            class="inline-flex items-center gap-1 bg-status-success/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-2.5 py-1 rounded-full"
          >
            <Wifi class="w-3.5 h-3.5 text-emerald-400" />
            Conectado
          </span>
        </div>
      </div>

      <!-- Componente Modular de Pasos (Solo si currentStep > 0) -->
      <div v-if="variant === 'client' && currentStep > 0" class="mt-2.5 pt-2 border-t border-white/10">
        <StepIndicator :current-step="currentStep" :total-steps="totalSteps" />
      </div>

    </div>
  </header>
</template>