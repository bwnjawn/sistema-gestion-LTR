<script setup lang="ts">
// Cupos del restaurante (SCRUM-280): personas que caben en cada espacio y la regla de menús distintos para grupos
// grandes. El aforo total es la suma de los espacios (ver `getRestaurantCapacity`).
import { ref } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import HojaModal from '../ui/HojaModal.vue'
import TarjetaAjuste from './TarjetaAjuste.vue'

const settingsStore = useSettingsStore()

const abierto = ref(false)
const espacios = ref<{ id: string; nombre: string; capacidad: number }[]>([])
const umbral = ref(1)
const variedades = ref(1)

function abrir() {
  espacios.value = settingsStore.capacityRules.restaurantSpaces.map(e => ({ ...e }))
  umbral.value = settingsStore.capacityRules.menuLargeGroupThreshold
  variedades.value = settingsStore.capacityRules.maxMenuVarietiesLargeGroup
  abierto.value = true
}

async function guardar() {
  const guardado = await settingsStore.updateCapacityRules({
    restaurantSpaces: espacios.value.map(e => ({ ...e, capacidad: Math.max(0, Number(e.capacidad) || 0) })),
    menuLargeGroupThreshold: Math.max(1, Number(umbral.value) || 1),
    maxMenuVarietiesLargeGroup: Math.max(1, Number(variedades.value) || 1)
  })
  if (guardado) abierto.value = false
}
</script>

<template>
  <TarjetaAjuste titulo="Cupos del restaurante" @editar="abrir">
    <p class="flex justify-between gap-2">
      <span>Capacidad total</span>
      <span class="font-bold text-brand-dark">{{ settingsStore.restaurantCapacity }} personas</span>
    </p>
    <p v-for="espacio in settingsStore.capacityRules.restaurantSpaces" :key="espacio.id" class="flex justify-between gap-2 pl-4">
      <span>{{ espacio.nombre }}</span>
      <span class="font-bold text-brand-dark">{{ espacio.capacidad }}</span>
    </p>
    <p class="flex justify-between gap-2">
      <span>Grupos de más de {{ settingsStore.capacityRules.menuLargeGroupThreshold }}</span>
      <span class="font-bold text-brand-dark">máx. {{ settingsStore.capacityRules.maxMenuVarietiesLargeGroup }} platos distintos en el almuerzo</span>
    </p>
  </TarjetaAjuste>

  <HojaModal :abierto="abierto" titulo="Cupos del restaurante" texto-guardar="Guardar" @cerrar="abierto = false" @guardar="guardar">
    <div v-for="espacio in espacios" :key="espacio.id">
      <label :for="`cupo-${espacio.id}`" class="campo-etiqueta">{{ espacio.nombre }} (personas)</label>
      <input :id="`cupo-${espacio.id}`" v-model.number="espacio.capacidad" type="number" inputmode="numeric" min="0" max="1000" class="campo-entrada" />
    </div>
    <p class="campo-ayuda !mt-0">La capacidad total es la suma de los espacios.</p>

    <div>
      <label for="cupo-umbral" class="campo-etiqueta">Menús distintos solo para grupos de más de (personas)</label>
      <input id="cupo-umbral" v-model.number="umbral" type="number" inputmode="numeric" min="1" max="1000" class="campo-entrada" />
    </div>
    <div>
      <label for="cupo-variedades" class="campo-etiqueta">Máximo de platos distintos en el almuerzo de esos grupos</label>
      <input id="cupo-variedades" v-model.number="variedades" type="number" inputmode="numeric" min="1" max="50" class="campo-entrada" />
    </div>
  </HojaModal>
</template>
