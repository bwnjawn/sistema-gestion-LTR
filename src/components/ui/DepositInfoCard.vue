<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck, CreditCard } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCLP } from '../../lib/format'

const props = defineProps<{
  totalAmount?: number
}>()

const settingsStore = useSettingsStore()

const depositPercentage = computed(() => settingsStore.defaultDepositPercentage)

const calculatedDeposit = computed(() => {
  if (!props.totalAmount) return 0
  return Math.round((props.totalAmount * depositPercentage.value) / 100)
})

const formattedDeposit = computed(() => formatCLP(calculatedDeposit.value))
const formattedTotal = computed(() => formatCLP(props.totalAmount || 0))
</script>

<template>
  <div class="bg-brand-light rounded-3xl p-4 border-2 border-brand-border space-y-3">
    <div class="flex items-center gap-2 text-brand-dark">
      <ShieldCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" />
      <h3 class="text-xs font-black">Política de Abono y Garantía</h3>
    </div>

    <p class="text-xs font-bold text-gray-700 leading-relaxed">
      Para confirmar tu reserva solicitamos un abono previo del 
      <span class="font-black text-brand-accent">{{ depositPercentage }}%</span> 
      del total del servicio.
    </p>

    <!-- Cálculo Dinámico si hay un total -->
    <div v-if="totalAmount && totalAmount > 0" class="p-3 bg-white rounded-2xl border border-brand-border space-y-1">
      <div class="flex justify-between items-center text-xs font-bold text-gray-600">
        <span>Total Reserva:</span>
        <span class="font-black text-brand-dark">{{ formattedTotal }}</span>
      </div>
      <div class="flex justify-between items-center text-xs font-black text-brand-dark pt-1 border-t border-gray-100">
        <span>Abono a Transferir ({{ depositPercentage }}%):</span>
        <span class="text-sm font-black text-brand-accent">{{ formattedDeposit }}</span>
      </div>
    </div>

    <div class="flex items-start gap-2 pt-1 text-[11px] font-bold text-gray-600">
      <CreditCard class="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
      <span>El saldo restante se cancela directamente al momento de tu llegada al centro turístico.</span>
    </div>
  </div>
</template>