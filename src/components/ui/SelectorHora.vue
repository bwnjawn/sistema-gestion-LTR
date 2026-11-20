<script setup lang="ts">
// Selector de hora de media en media hora (SCRUM-280). En el teléfono abre la lista nativa, sin escribir la hora a mano.
import { computed, useId } from 'vue'
import { opcionesDeHora } from '../../services/horarios'

const props = defineProps<{
  modelValue: string
  etiqueta: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', valor: string): void }>()

const id = useId()
const opciones = computed(() => opcionesDeHora(props.modelValue))
</script>

<template>
  <div>
    <label :for="id" class="campo-etiqueta">{{ etiqueta }}</label>
    <select :id="id" :value="modelValue" class="campo-entrada" @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option v-for="hora in opciones" :key="hora" :value="hora">{{ hora }}</option>
    </select>
  </div>
</template>
