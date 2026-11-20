<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import HojaModal from '../ui/HojaModal.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const settingsStore = useSettingsStore()

const campingDiario = ref({ ...settingsStore.campingSchedules.diario })
const campingPernoctar = ref({ ...settingsStore.campingSchedules.pernoctar })

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    campingDiario.value = { ...settingsStore.campingSchedules.diario }
    campingPernoctar.value = { ...settingsStore.campingSchedules.pernoctar }
  }
})

async function handleSave() {
  const guardado = await settingsStore.updateCampingSchedules({
    diario: { ...campingDiario.value },
    pernoctar: { ...campingPernoctar.value }
  })
  if (guardado) emit('close')
}
</script>

<template>
  <HojaModal :abierto="isOpen" titulo="Horarios de camping" texto-guardar="Guardar" @cerrar="emit('close')" @guardar="handleSave">
    <fieldset class="space-y-3">
      <legend class="font-bold text-brand-dark mb-2">Camping por el día</legend>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="campingDiario-ingreso" class="campo-etiqueta">Ingreso</label>
          <input id="campingDiario-ingreso" v-model="campingDiario.checkIn" type="text" class="campo-entrada" />
        </div>
        <div>
          <label for="campingDiario-salida" class="campo-etiqueta">Salida</label>
          <input id="campingDiario-salida" v-model="campingDiario.checkOut" type="text" class="campo-entrada" />
        </div>
      </div>
    </fieldset>
    <fieldset class="space-y-3">
      <legend class="font-bold text-brand-dark mb-2">Camping con noche</legend>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label for="campingPernoctar-ingreso" class="campo-etiqueta">Ingreso</label>
          <input id="campingPernoctar-ingreso" v-model="campingPernoctar.checkIn" type="text" class="campo-entrada" />
        </div>
        <div>
          <label for="campingPernoctar-salida" class="campo-etiqueta">Salida</label>
          <input id="campingPernoctar-salida" v-model="campingPernoctar.checkOut" type="text" class="campo-entrada" />
        </div>
      </div>
    </fieldset>
  </HojaModal>
</template>
