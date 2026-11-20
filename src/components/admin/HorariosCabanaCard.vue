<script setup lang="ts">
// Horarios de las cabañas (SCRUM-280): hora de ingreso y de salida que el cliente ve al elegir su cabaña.
import { ref } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { armarHorarioCabana } from '../../services/horarios'
import HojaModal from '../ui/HojaModal.vue'
import SelectorHora from '../ui/SelectorHora.vue'
import TarjetaAjuste from './TarjetaAjuste.vue'

const settingsStore = useSettingsStore()

const abierto = ref(false)
const ingreso = ref('')
const salida = ref('')

function abrir() {
  ingreso.value = settingsStore.cabinSchedules.checkIn
  salida.value = settingsStore.cabinSchedules.checkOut
  abierto.value = true
}

async function guardar() {
  const guardado = await settingsStore.updateCabinSchedules(armarHorarioCabana(ingreso.value, salida.value))
  if (guardado) abierto.value = false
}
</script>

<template>
  <TarjetaAjuste titulo="Horarios de las cabañas" @editar="abrir">
    <p class="flex justify-between gap-2"><span>Ingreso</span><span class="font-bold text-brand-dark">{{ settingsStore.cabinSchedules.checkIn }} hrs</span></p>
    <p class="flex justify-between gap-2"><span>Salida (día siguiente)</span><span class="font-bold text-brand-dark">{{ settingsStore.cabinSchedules.checkOut }} hrs</span></p>
  </TarjetaAjuste>

  <HojaModal :abierto="abierto" titulo="Horarios de las cabañas" texto-guardar="Guardar" @cerrar="abierto = false" @guardar="guardar">
    <div class="grid grid-cols-2 gap-3">
      <SelectorHora v-model="ingreso" etiqueta="Ingreso" />
      <SelectorHora v-model="salida" etiqueta="Salida" />
    </div>
    <p class="campo-ayuda">El cliente ve estas horas al elegir su cabaña y en el resumen de su solicitud. La salida es el día siguiente al último día de estadía.</p>
  </HojaModal>
</template>
