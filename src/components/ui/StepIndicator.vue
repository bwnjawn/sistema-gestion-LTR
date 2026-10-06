<script setup lang="ts">
import { Check, Calendar, Bed, Utensils, UserCheck } from 'lucide-vue-next'

interface Props {
  currentStep: number
}

const props = withDefaults(defineProps<Props>(), {
  currentStep: 1
})

const steps = [
  { id: 1, label: 'Fechas', icon: Calendar },
  { id: 2, label: 'Servicio', icon: Bed },
  { id: 3, label: 'Menú', icon: Utensils },
  { id: 4, label: 'Confirmar', icon: UserCheck },
]
</script>

<template>
  <nav aria-label="Progreso de la reserva" class="w-full py-2">
    <ol class="flex items-center justify-between w-full text-xs font-bold">
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        :class="[
          'flex items-center relative',
          index < steps.length - 1 ? 'grow after:content-[\'\'] after:w-full after:h-0.5 after:mx-2 sm:after:mx-3 after:transition-colors' : '',
          step.id < currentStep 
            ? 'after:bg-status-success text-status-success' 
            : 'after:bg-gray-200 text-gray-400'
        ]"
      >
        <div class="flex items-center gap-2 shrink-0">
          <!-- Paso Completado (Verde + Check) -->
          <span
            v-if="step.id < currentStep"
            class="w-8 h-8 rounded-full bg-status-success text-white flex items-center justify-center shadow-xs shrink-0"
          >
            <Check class="w-4.5 h-4.5 stroke-[2.5]" />
          </span>

          <!-- Paso Actual (Verde Bosque Destacado) -->
          <span
            v-else-if="step.id === currentStep"
            class="w-8 h-8 rounded-full bg-brand-dark text-white font-extrabold flex items-center justify-center shadow-sm shrink-0 ring-4 ring-brand-dark/15"
          >
            <component :is="step.icon" class="w-4.5 h-4.5 stroke-[2.5]" />
          </span>

          <!-- Paso Futuro (Gris Claro) -->
          <span
            v-else
            class="w-8 h-8 rounded-full bg-white text-gray-400 border-2 border-gray-200 flex items-center justify-center shrink-0 font-bold"
          >
            {{ step.id }}
          </span>

          <!-- Nombre del Paso -->
          <span
            :class="[
              'text-xs font-bold tracking-tight hidden xs:inline-block',
              step.id === currentStep 
                ? 'text-brand-dark font-extrabold' 
                : step.id < currentStep 
                  ? 'text-status-success font-semibold' 
                  : 'text-gray-400 font-medium'
            ]"
          >
            {{ step.label }}
          </span>
        </div>
      </li>
    </ol>
  </nav>
</template>