<script setup lang="ts">
// Lista de textos cortos que el administrador agrega y quita (por ejemplo, los servicios incluidos de una
// cabaña). Se muestran en filas, con un contador junto al título, y se agregan con un campo y un botón.
import { ref } from 'vue'
import ListaFilas from './ListaFilas.vue'

let contador = 0

const props = defineProps<{
  modelValue: string[]
  etiqueta: string
  placeholder?: string
  /** Texto mientras no hay ninguno. */
  vacio?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', valor: string[]): void }>()

const nuevo = ref('')
// Un id sin espacios para unir la etiqueta con el campo
const idCampo = `lista-${++contador}`

function agregar() {
  const texto = nuevo.value.trim()
  if (!texto) return
  if (!props.modelValue.includes(texto)) emit('update:modelValue', [...props.modelValue, texto])
  nuevo.value = ''
}

function quitar(texto: string) {
  emit('update:modelValue', props.modelValue.filter(t => t !== texto))
}
</script>

<template>
  <div class="space-y-3">
    <label class="campo-etiqueta !mb-0" :for="idCampo">
      {{ etiqueta }}<span v-if="modelValue.length > 0"> ({{ modelValue.length }})</span>
    </label>
    <ListaFilas :items="modelValue" :vacio="vacio ?? 'Aún no hay ninguno.'" @quitar="quitar" />
    <div class="flex gap-2">
      <input :id="idCampo" v-model="nuevo" type="text" :placeholder="placeholder" class="campo-entrada min-w-0 flex-1" @keydown.enter.prevent="agregar" />
      <button type="button" class="px-4 rounded-xl border border-brand-dark text-brand-dark font-bold active:scale-95" @click="agregar">Agregar</button>
    </div>
  </div>
</template>
