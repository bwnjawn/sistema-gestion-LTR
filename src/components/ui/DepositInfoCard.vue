<script setup lang="ts">
import { computed } from 'vue'
import { Info } from 'lucide-vue-next'
import { useAdminStore } from '../../stores/adminStore'

const props = withDefaults(defineProps<{
  totalWithIva: number
  depositPercentage?: number
  serviceName?: string
}>(), {
  depositPercentage: undefined,
  serviceName: 'servicio'
})

const adminStore = useAdminStore()

// Lee el porcentaje parametrizado global si no se especifica
const effectivePercentage = computed(() => {
  return props.depositPercentage ?? adminStore.defaultDepositPercentage
})

// Cálculos del Abono sobre el Total con IVA
const depositAmount = computed(() => Math.round(props.totalWithIva * (effectivePercentage.value / 100)))
const remainingBalance = computed(() => props.totalWithIva - depositAmount.value)

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`
}
</script>

<template>
  <div class="bg-amber-50/90 border-2 border-amber-200 p-4 rounded-2xl space-y-2 text-amber-950">
    <div class="flex items-center gap-2 font-black text-sm">
      <Info class="w-4 h-4 text-amber-700 shrink-0 stroke-[2.5]" />
      <span>Forma de Pago y Confirmación</span>
    </div>
    
    <div class="space-y-1.5 text-xs font-bold text-amber-900 border-t border-amber-200/80 pt-2">
      <div class="flex justify-between items-center">
        <span>Abono requerido para reservar ({{ effectivePercentage }}%):</span>
        <span class="text-sm font-black text-amber-950">{{ formatCLP(depositAmount) }}</span>
      </div>
      <div class="flex justify-between items-center text-amber-800">
        <span>Saldo pendiente al llegar:</span>
        <span class="font-extrabold">{{ formatCLP(remainingBalance) }}</span>
      </div>
    </div>

    <p class="text-[11px] font-semibold text-amber-800 leading-relaxed pt-1">
      Es una solicitud: no se cobra en línea. El abono del {{ effectivePercentage }}% se coordina por llamada telefónica tras confirmar la disponibilidad por los dueños.
    </p>
  </div>
</template>