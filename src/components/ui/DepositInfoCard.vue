<script setup lang="ts">
import { computed, ref } from 'vue'
import { ShieldCheck, CreditCard, AlertTriangle, Landmark, Copy, Check } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCLP } from '../../lib/format'
import { copiarTexto } from '../../lib/clipboard'

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

const copiado = ref(false)
const errorCopia = ref(false)

// Todos los datos juntos, listos para pegar en la app del banco o en un mensaje
const textoTransferencia = computed(() => {
  const t = transfer.value
  return [
    `Banco: ${t.bank}`,
    `Tipo de cuenta: ${t.accountType}`,
    `N° de cuenta: ${t.accountNumber}`,
    `Titular: ${t.holderName}`,
    `RUT: ${t.holderRut}`,
    t.email ? `Correo: ${t.email}` : ''
  ].filter(Boolean).join('\n')
})

async function copiarDatos() {
  const ok = await copiarTexto(textoTransferencia.value)
  copiado.value = ok
  errorCopia.value = !ok
  setTimeout(() => {
    copiado.value = false
    errorCopia.value = false
  }, 2500)
}
</script>

<template>
  <div class="bg-brand-light rounded-3xl p-4 border-2 border-brand-border space-y-3">
    <div class="flex items-center gap-2 text-brand-dark">
      <ShieldCheck class="w-5 h-5 text-brand-accent stroke-[2.5]" />
      <h3 class="text-sm font-black">Política de Abono y Garantía</h3>
    </div>

    <!-- Aviso destacado -->
    <div class="flex items-start gap-2.5 p-3.5 bg-amber-100 rounded-2xl border-2 border-amber-500 text-sm font-bold text-amber-950">
      <AlertTriangle class="w-6 h-6 text-amber-700 shrink-0 stroke-[2.5]" />
      <span>
        <strong class="font-black block">Esto es solo una solicitud.</strong>
        Tu reserva queda confirmada cuando transfieras el abono y te lo confirmemos.
      </span>
    </div>

    <p class="text-sm font-bold text-gray-700 leading-relaxed">
      Para confirmar tu reserva solicitamos un abono previo del
      <span class="font-black text-brand-accent">{{ depositPercentage }}%</span>
      del total del servicio.
    </p>

    <!-- Cálculo Dinámico si hay un total -->
    <div v-if="totalAmount && totalAmount > 0" class="p-3 bg-white rounded-2xl border border-brand-border space-y-1">
      <div class="flex justify-between items-center text-sm font-bold text-gray-600">
        <span>Total Reserva:</span>
        <span class="font-black text-brand-dark">{{ formattedTotal }}</span>
      </div>
      <div class="flex justify-between items-center text-sm font-black text-brand-dark pt-1 border-t border-gray-100">
        <span>Abono a Transferir ({{ depositPercentage }}%):</span>
        <span class="text-base font-black text-brand-accent">{{ formattedDeposit }}</span>
      </div>
    </div>

    <!-- Datos de transferencia destacados -->
    <div class="p-3.5 bg-emerald-50 rounded-2xl border-2 border-emerald-400 space-y-1.5 text-sm font-bold text-gray-700">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 text-brand-dark font-black">
          <Landmark class="w-4 h-4 text-emerald-700 stroke-[2.5]" />
          <span>Datos para transferir</span>
        </div>
        <button
          type="button"
          @click="copiarDatos"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-dark text-white text-sm font-black active:scale-95 transition-transform touch-target"
        >
          <Check v-if="copiado" class="w-4 h-4 stroke-[3]" />
          <Copy v-else class="w-4 h-4 stroke-[2.5]" />
          <span>{{ copiado ? 'Copiado' : 'Copiar' }}</span>
        </button>
      </div>
      <p v-if="errorCopia" class="text-sm font-black text-rose-700">No se pudo copiar. Mantén presionado el texto para copiarlo.</p>
      <p>{{ transfer.bank }} · {{ transfer.accountType }}</p>
      <p>Cuenta N° <span class="font-black text-brand-dark select-all">{{ transfer.accountNumber }}</span></p>
      <p>{{ transfer.holderName }} · RUT {{ transfer.holderRut }}</p>
      <p v-if="transfer.email" class="text-gray-700">Envía el comprobante a {{ transfer.email }}</p>
    </div>

    <div class="flex items-start gap-2 pt-1 text-sm font-bold text-gray-600">
      <CreditCard class="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
      <span>El saldo restante se cancela directamente al momento de tu llegada al centro turístico.</span>
    </div>
  </div>
</template>
