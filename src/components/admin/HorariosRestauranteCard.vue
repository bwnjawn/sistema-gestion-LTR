<script setup lang="ts">
// Horarios del restaurante (SCRUM-280): el administrador fija desde y hasta de cada comida, y el cliente
// elige entre todas las medias horas de ese rango (ver `horasDeComida`).
import { computed, ref } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import { horasDeComida } from '../../services/availability'
import { armarComida, validarRangoComida } from '../../services/horarios'
import HojaModal from '../ui/HojaModal.vue'
import SelectorHora from '../ui/SelectorHora.vue'
import TarjetaAjuste from './TarjetaAjuste.vue'

const settingsStore = useSettingsStore()

const COMIDAS = [
  { id: 'desayuno', nombre: 'Desayuno' },
  { id: 'almuerzo', nombre: 'Almuerzo' },
  { id: 'once', nombre: 'Once' }
] as const
type IdComida = (typeof COMIDAS)[number]['id']

const abierto = ref(false)
const rangos = ref<Record<IdComida, { desde: string; hasta: string }>>({
  desayuno: { desde: '', hasta: '' },
  almuerzo: { desde: '', hasta: '' },
  once: { desde: '', hasta: '' }
})
const guardado = ref(false)

function abrir() {
  const actual = settingsStore.restaurantSchedules
  for (const { id } of COMIDAS) rangos.value[id] = { desde: actual[id].start, hasta: actual[id].end }
  guardado.value = false
  abierto.value = true
}

// Lo que verá el cliente y el error de cada comida, mientras el administrador elige
const detalle = computed(() =>
  COMIDAS.map(({ id, nombre }) => {
    const { desde, hasta } = rangos.value[id]
    const error = validarRangoComida(desde, hasta)
    return { id, nombre, error, horas: error ? [] : horasDeComida({ start: desde, end: hasta }) }
  })
)
const hayErrores = computed(() => detalle.value.some(c => c.error))

async function guardar() {
  guardado.value = true
  if (hayErrores.value) return
  const nuevo = {
    desayuno: armarComida(rangos.value.desayuno.desde, rangos.value.desayuno.hasta),
    almuerzo: armarComida(rangos.value.almuerzo.desde, rangos.value.almuerzo.hasta),
    once: armarComida(rangos.value.once.desde, rangos.value.once.hasta)
  }
  if (await settingsStore.updateRestaurantSchedules(nuevo)) abierto.value = false
}
</script>

<template>
  <TarjetaAjuste titulo="Horarios del restaurante" @editar="abrir">
    <p v-for="comida in COMIDAS" :key="comida.id" class="flex justify-between gap-2">
      <span>{{ comida.nombre }}</span>
      <span class="font-bold text-brand-dark">{{ settingsStore.restaurantSchedules[comida.id].start }} a {{ settingsStore.restaurantSchedules[comida.id].end }} hrs</span>
    </p>
  </TarjetaAjuste>

  <HojaModal :abierto="abierto" titulo="Horarios del restaurante" texto-guardar="Guardar" @cerrar="abierto = false" @guardar="guardar">
    <p class="campo-ayuda !mt-0">Elige desde y hasta qué hora se puede pedir cada comida. El cliente verá todas las medias horas de ese rango.</p>

    <fieldset v-for="comida in detalle" :key="comida.id" class="space-y-3">
      <legend class="font-bold text-brand-dark mb-2">{{ comida.nombre }}</legend>
      <div class="grid grid-cols-2 gap-3">
        <SelectorHora v-model="rangos[comida.id].desde" etiqueta="Desde" />
        <SelectorHora v-model="rangos[comida.id].hasta" etiqueta="Hasta" />
      </div>
      <p v-if="comida.error" role="alert" class="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm">{{ comida.error }}</p>
      <p v-else class="campo-ayuda">El cliente verá: {{ comida.horas.join(' · ') }}</p>
    </fieldset>

    <p v-if="guardado && hayErrores" role="alert" class="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm">Corrige los horarios marcados para guardar.</p>
  </HojaModal>
</template>
