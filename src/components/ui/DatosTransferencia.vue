<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Copy } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import { copiarTexto } from '../../lib/clipboard'

// Datos bancarios para pagar el abono, con botón para copiarlos. Se usa plegado en el último paso
// y completo en la pantalla posterior al envío.
const settingsStore = useSettingsStore()
const transfer = computed(() => settingsStore.transferInfo)

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
  <div class="bg-brand-light rounded-2xl border border-brand-border p-3.5 space-y-1 text-sm text-gray-700 text-left">
    <p>{{ transfer.bank }} · {{ transfer.accountType }}</p>
    <p>Cuenta N° <span class="font-bold text-brand-dark select-all">{{ transfer.accountNumber }}</span></p>
    <p>{{ transfer.holderName }} · RUT {{ transfer.holderRut }}</p>
    <p v-if="transfer.email">Envía el comprobante a {{ transfer.email }}</p>
    <p v-if="errorCopia" class="font-bold text-rose-700">No se pudo copiar. Mantén presionado el texto para copiarlo.</p>
    <button
      type="button"
      class="mt-2 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-brand-dark text-brand-dark text-sm font-bold active:scale-95 transition-transform touch-target"
      @click="copiarDatos"
    >
      <Check v-if="copiado" class="w-4 h-4 stroke-[3]" aria-hidden="true" />
      <Copy v-else class="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
      {{ copiado ? 'Copiado' : 'Copiar datos' }}
    </button>
  </div>
</template>
