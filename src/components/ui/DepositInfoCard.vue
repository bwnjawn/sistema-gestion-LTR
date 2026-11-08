<script setup lang="ts">
import { computed } from 'vue'
import { ShieldCheck, CreditCard, Info, Landmark } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCLP } from '../../lib/format'

// El abono lo calcula services/pricing y llega ya resuelto: esta tarjeta solo lo muestra.
const props = defineProps<{
  totalAmount?: number
  depositAmount?: number
}>()

const settingsStore = useSettingsStore()

const transfer = computed(() => settingsStore.transferInfo)

const depositPercentage = computed(() => settingsStore.defaultDepositPercentage)

const formattedDeposit = computed(() => formatCLP(props.depositAmount || 0))
const formattedTotal = computed(() => formatCLP(props.totalAmount || 0))
</script>

<template>
  <div class="bg-brand-light rounded-3xl p-4 border-2 border-brand-border space-y-3">
    <div class="flex items-center gap-2 text-brand-dark">
      <ShieldCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" />
      <h3 class="text-xs font-black">Política de Abono y Garantía</h3>
    </div>

    <div class="flex items-start gap-2 p-3 bg-white rounded-2xl border-2 border-brand-border text-xs font-bold text-brand-dark">
      <Info class="w-4 h-4 text-brand-accent shrink-0 mt-0.5 stroke-[2.5]" />
      <span>
        Esto es solo una solicitud: tu reserva queda confirmada cuando transfieras el abono
        y te lo confirmemos.
      </span>
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

    <div class="p-3 bg-white rounded-2xl border border-brand-border space-y-1 text-xs font-bold text-gray-700">
      <div class="flex items-center gap-1.5 text-brand-dark font-black">
        <Landmark class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
        <span>Datos para transferir</span>
      </div>
      <p>{{ transfer.bank }} · {{ transfer.accountType }}</p>
      <p>Cuenta N° <span class="font-black text-brand-dark select-all">{{ transfer.accountNumber }}</span></p>
      <p>{{ transfer.holderName }} · RUT {{ transfer.holderRut }}</p>
      <p v-if="transfer.email" class="text-gray-600">Envía el comprobante a {{ transfer.email }}</p>
    </div>

    <div class="flex items-start gap-2 pt-1 text-[11px] font-bold text-gray-600">
      <CreditCard class="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
      <span>El saldo restante se cancela directamente al momento de tu llegada al centro turístico.</span>
    </div>
  </div>
</template>