<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Save, Landmark } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import BaseButton from '../ui/BaseButton.vue'

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

const campos: { clave: keyof typeof form.value; etiqueta: string; tipo: string }[] = [
  { clave: 'bank', etiqueta: 'Banco', tipo: 'text' },
  { clave: 'accountType', etiqueta: 'Tipo de cuenta', tipo: 'text' },
  { clave: 'accountNumber', etiqueta: 'Número de cuenta', tipo: 'text' },
  { clave: 'holderName', etiqueta: 'Nombre del titular', tipo: 'text' },
  { clave: 'holderRut', etiqueta: 'RUT del titular', tipo: 'text' },
  { clave: 'email', etiqueta: 'Correo para enviar el comprobante', tipo: 'email' }
]

function guardar() {
  const limpio = Object.fromEntries(
    Object.entries(form.value).map(([clave, valor]) => [clave, String(valor).trim()])
  )
  settingsStore.updateTransferInfo(limpio)
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-5 max-w-sm w-full border-2 border-brand-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 class="text-sm font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
          <Landmark class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Datos de transferencia
        </h3>
        <button type="button" @click="emit('close')" class="p-1 text-gray-500 hover:bg-gray-100 rounded-full" aria-label="Cerrar">
          <X class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <form @submit.prevent="guardar" class="space-y-3 text-xs font-bold">
        <div v-for="campo in campos" :key="campo.clave">
          <label :for="`transfer-${campo.clave}`" class="block text-gray-700 mb-1">{{ campo.etiqueta }}</label>
          <input
            :id="`transfer-${campo.clave}`"
            v-model="form[campo.clave]"
            :type="campo.tipo"
            class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs"
          />
        </div>

        <div class="flex gap-2 pt-2">
          <BaseButton variant="outline" class="flex-1" type="button" @click="emit('close')">
            Cancelar
          </BaseButton>
          <BaseButton variant="primary" class="flex-1" type="submit">
            <Save class="w-4 h-4 mr-1 stroke-[2.5]" /> Guardar
          </BaseButton>
        </div>
      </form>
    </div>
  </div>
</template>
