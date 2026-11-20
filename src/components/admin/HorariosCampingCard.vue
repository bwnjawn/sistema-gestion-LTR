<script setup lang="ts">
// Horarios del camping (SCRUM-280): ingreso y salida "por el día" y "con noche", que el cliente ve al elegir.
import { ref } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { armarHorarioCamping, validarHorarioDelDia } from '../../services/horarios'
import HojaModal from '../ui/HojaModal.vue'
import SelectorHora from '../ui/SelectorHora.vue'
import TarjetaAjuste from './TarjetaAjuste.vue'

const settingsStore = useSettingsStore()

const abierto = ref(false)
const diario = ref({ ingreso: '', salida: '' })
const noche = ref({ ingreso: '', salida: '' })
const error = ref('')

function abrir() {
  const { diario: d, pernoctar: p } = settingsStore.campingSchedules
  diario.value = { ingreso: d.checkIn, salida: d.checkOut }
  noche.value = { ingreso: p.checkIn, salida: p.checkOut }
  error.value = ''
  abierto.value = true
}

async function guardar() {
  error.value = validarHorarioDelDia(diario.value.ingreso, diario.value.salida) ?? ''
  if (error.value) return
  const guardado = await settingsStore.updateCampingSchedules(armarHorarioCamping(diario.value, noche.value))
  if (guardado) abierto.value = false
}
</script>

<template>
  <TarjetaAjuste titulo="Horarios del camping" @editar="abrir">
    <p class="flex justify-between gap-2">
      <span>Por el día</span>
      <span class="font-bold text-brand-dark">{{ settingsStore.campingSchedules.diario.checkIn }} a {{ settingsStore.campingSchedules.diario.checkOut }} hrs</span>
    </p>
    <p class="flex justify-between gap-2">
      <span>Con noche</span>
      <span class="font-bold text-brand-dark">{{ settingsStore.campingSchedules.pernoctar.checkIn }} a {{ settingsStore.campingSchedules.pernoctar.checkOut }} hrs</span>
    </p>
  </TarjetaAjuste>

  <HojaModal :abierto="abierto" titulo="Horarios del camping" texto-guardar="Guardar" @cerrar="abierto = false" @guardar="guardar">
    <fieldset class="space-y-3">
      <legend class="font-bold text-brand-dark mb-2">Por el día</legend>
      <div class="grid grid-cols-2 gap-3">
        <SelectorHora v-model="diario.ingreso" etiqueta="Ingreso" />
        <SelectorHora v-model="diario.salida" etiqueta="Salida" />
      </div>
      <p class="campo-ayuda">El cliente entra y sale el mismo día.</p>
    </fieldset>

    <fieldset class="space-y-3">
      <legend class="font-bold text-brand-dark mb-2">Con noche</legend>
      <div class="grid grid-cols-2 gap-3">
        <SelectorHora v-model="noche.ingreso" etiqueta="Ingreso" />
        <SelectorHora v-model="noche.salida" etiqueta="Salida" />
      </div>
      <p class="campo-ayuda">La salida es el día siguiente al último día de estadía.</p>
    </fieldset>

    <p v-if="error" role="alert" class="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm">{{ error }}</p>
  </HojaModal>
</template>
