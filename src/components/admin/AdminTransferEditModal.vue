<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import HojaModal from '../ui/HojaModal.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const settingsStore = useSettingsStore()

const form = ref({ ...settingsStore.transferInfo })

watch(() => props.isOpen, (abierto) => {
  if (abierto) form.value = { ...settingsStore.transferInfo }
})

const BANCOS = [
  'Banco de Chile', 'Banco Estado', 'Banco Santander', 'Banco BCI', 'Scotiabank', 'Banco Itaú',
  'Banco Security', 'Banco Falabella', 'Banco Ripley', 'Banco Consorcio', 'Banco Bice',
  'Banco Internacional', 'Mercado Pago', 'Tenpo', 'Mach'
]
const TIPOS_CUENTA = ['Cuenta Corriente', 'Cuenta Vista / Cuenta RUT', 'Cuenta Vista', 'Cuenta RUT', 'Cuenta de Ahorro']

// Si el valor guardado no está en la lista, se conserva como opción para no perderlo.
function opciones(lista: string[], actual: string): string[] {
  return actual && !lista.includes(actual) ? [actual, ...lista] : lista
}
const opcionesSelect = computed<Record<string, string[]>>(() => ({
  bank: opciones(BANCOS, form.value.bank),
  accountType: opciones(TIPOS_CUENTA, form.value.accountType)
}))

const campos: { clave: keyof typeof form.value; etiqueta: string; tipo: string }[] = [
  { clave: 'bank', etiqueta: 'Banco', tipo: 'select' },
  { clave: 'accountType', etiqueta: 'Tipo de cuenta', tipo: 'select' },
  { clave: 'accountNumber', etiqueta: 'Número de cuenta', tipo: 'text' },
  { clave: 'holderName', etiqueta: 'Nombre del titular', tipo: 'text' },
  { clave: 'holderRut', etiqueta: 'RUT del titular', tipo: 'text' },
  { clave: 'email', etiqueta: 'Correo para enviar el comprobante', tipo: 'email' }
]

async function guardar() {
  const limpio = Object.fromEntries(
    Object.entries(form.value).map(([clave, valor]) => [clave, String(valor).trim()])
  )
  const guardado = await settingsStore.updateTransferInfo(limpio)
  if (guardado) emit('close')
}
</script>

<template>
  <HojaModal :abierto="isOpen" titulo="Datos de transferencia" texto-guardar="Guardar" @cerrar="emit('close')" @guardar="guardar">
    <div v-for="campo in campos" :key="campo.clave">
      <label :for="`transfer-${campo.clave}`" class="campo-etiqueta">{{ campo.etiqueta }}</label>
      <select
        v-if="campo.tipo === 'select'"
        :id="`transfer-${campo.clave}`"
        v-model="form[campo.clave]"
        class="campo-entrada"
      >
        <option v-for="opcion in opcionesSelect[campo.clave]" :key="opcion" :value="opcion">{{ opcion }}</option>
      </select>
      <input
        v-else
        :id="`transfer-${campo.clave}`"
        v-model="form[campo.clave]"
        :type="campo.tipo"
        class="campo-entrada"
      />
    </div>
  </HojaModal>
</template>
