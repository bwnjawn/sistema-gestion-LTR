<script setup lang="ts">
// Ajustes → Reglas de reservas: abono, plazo, IVA, precio de la piscina, margen y cupos.
import { ref } from 'vue'
import { Utensils, Users, Percent } from 'lucide-vue-next'
import { formatCLP } from '../../../lib/format'
import { useSettingsStore } from '../../../stores/settingsStore'
import AjustesVolver from '../../../components/admin/AjustesVolver.vue'
import HojaModal from '../../../components/ui/HojaModal.vue'

const settingsStore = useSettingsStore()

const isEditingParameters = ref(false)

const editDeposit = ref(settingsStore.defaultDepositPercentage)
const editDeadline = ref(settingsStore.depositDeadlineHours)
const editIva = ref(settingsStore.ivaPercentage)
const editPoolPrice = ref(settingsStore.poolEntryPrice)
const editMargin = ref(settingsStore.marginPercentage)
const editSpaces = ref(settingsStore.capacityRules.restaurantSpaces.map(e => ({ ...e })))
const editMaxCamping = ref(settingsStore.capacityRules.maxCampingPeopleCapacity)
const editMenuThreshold = ref(settingsStore.capacityRules.menuLargeGroupThreshold)
const editMenuVarieties = ref(settingsStore.capacityRules.maxMenuVarietiesLargeGroup)

function openParametersEdit() {
  editDeposit.value = settingsStore.defaultDepositPercentage
  editDeadline.value = settingsStore.depositDeadlineHours
  editIva.value = settingsStore.ivaPercentage
  editPoolPrice.value = settingsStore.poolEntryPrice
  editMargin.value = settingsStore.marginPercentage
  editSpaces.value = settingsStore.capacityRules.restaurantSpaces.map(e => ({ ...e }))
  editMaxCamping.value = settingsStore.capacityRules.maxCampingPeopleCapacity
  editMenuThreshold.value = settingsStore.capacityRules.menuLargeGroupThreshold
  editMenuVarieties.value = settingsStore.capacityRules.maxMenuVarietiesLargeGroup
  isEditingParameters.value = true
}

async function saveParameters() {
  const parametrosGuardados = await settingsStore.updateParameters({
    defaultDepositPercentage: editDeposit.value,
    depositDeadlineHours: Math.max(1, Number(editDeadline.value) || 1),
    ivaPercentage: editIva.value,
    poolEntryPrice: Math.max(0, Math.round(Number(editPoolPrice.value) || 0)),
    marginPercentage: editMargin.value
  })
  const reglasGuardadas = await settingsStore.updateCapacityRules({
    restaurantSpaces: editSpaces.value.map(e => ({ ...e, capacidad: Math.max(0, Number(e.capacidad) || 0) })),
    menuLargeGroupThreshold: Math.max(1, Number(editMenuThreshold.value) || 1),
    maxMenuVarietiesLargeGroup: Math.max(1, Number(editMenuVarieties.value) || 1),
    maxCampingPeopleCapacity: editMaxCamping.value,
    marginPercentage: editMargin.value
  })
  if (parametrosGuardados && reglasGuardadas) isEditingParameters.value = false
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-20">
    <AjustesVolver />

    <div class="bg-white p-4 sm:p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Percent class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <h3 class="text-sm font-black text-brand-dark">Abonos, IVA y cupos</h3>
        </div>
        <button type="button" @click="openParametersEdit" class="py-1.5 px-3 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-100">
          Editar
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs font-bold">
        <div class="p-2.5 bg-brand-light rounded-2xl border border-brand-border text-center space-y-0.5">
          <span class="text-xs text-gray-700 uppercase block">Abono exigido</span>
          <span class="text-sm font-black text-brand-dark">{{ settingsStore.defaultDepositPercentage }}%</span>
        </div>
        <div class="p-2.5 bg-brand-light rounded-2xl border border-brand-border text-center space-y-0.5">
          <span class="text-xs text-gray-700 uppercase block">Plazo del abono</span>
          <span class="text-sm font-black text-brand-dark">{{ settingsStore.depositDeadlineHours }} h</span>
        </div>
        <div class="p-2.5 bg-brand-light rounded-2xl border border-brand-border text-center space-y-0.5">
          <span class="text-xs text-gray-700 uppercase block">IVA</span>
          <span class="text-sm font-black text-brand-dark">{{ settingsStore.ivaPercentage }}%</span>
        </div>
        <div class="p-2.5 bg-brand-light rounded-2xl border border-brand-border text-center space-y-0.5">
          <span class="text-xs text-gray-700 uppercase block">Entrada a la piscina</span>
          <span class="text-sm font-black text-brand-dark">{{ formatCLP(settingsStore.poolEntryPrice) }}</span>
        </div>
        <div class="p-2.5 bg-brand-light rounded-2xl border border-brand-border text-center space-y-0.5">
          <span class="text-xs text-gray-700 uppercase block">Margen de cupos</span>
          <span class="text-sm font-black text-brand-dark">{{ settingsStore.marginPercentage }}%</span>
        </div>
      </div>

      <div class="space-y-2 text-xs font-bold text-gray-700 bg-gray-50 p-3 rounded-2xl border border-gray-200">
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1 text-brand-dark"><Utensils class="w-3.5 h-3.5 text-brand-accent" /> Capacidad total del restaurante:</span>
          <span class="font-black text-brand-dark">{{ settingsStore.restaurantCapacity }} personas</span>
        </div>
        <div v-for="espacio in settingsStore.capacityRules.restaurantSpaces" :key="espacio.id" class="flex items-center justify-between pl-5">
          <span>{{ espacio.nombre }}:</span>
          <span class="font-black text-brand-dark">{{ espacio.capacidad }} personas</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1 text-brand-dark"><Utensils class="w-3.5 h-3.5 text-brand-accent" /> Grupos de más de {{ settingsStore.capacityRules.menuLargeGroupThreshold }} personas:</span>
          <span class="font-black text-brand-dark">máx. {{ settingsStore.capacityRules.maxMenuVarietiesLargeGroup }} menús distintos</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1 text-brand-dark"><Users class="w-3.5 h-3.5 text-brand-accent" /> Capacidad máxima del camping:</span>
          <span class="font-black text-brand-dark">{{ settingsStore.capacityRules.maxCampingPeopleCapacity }} personas</span>
        </div>
      </div>
    </div>

    <!-- Edición de los parámetros: hoja que sube desde abajo (SCRUM-279) -->
    <HojaModal :abierto="isEditingParameters" titulo="Abonos, IVA y cupos" texto-guardar="Guardar" @cerrar="isEditingParameters = false" @guardar="saveParameters">
      <div>
        <label for="reg-abono" class="campo-etiqueta">Abono requerido (%)</label>
        <input id="reg-abono" type="number" v-model.number="editDeposit" min="0" max="100" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-plazo" class="campo-etiqueta">Plazo para abonar desde que llega la solicitud (horas)</label>
        <input id="reg-plazo" type="number" inputmode="numeric" v-model.number="editDeadline" min="1" max="720" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-iva" class="campo-etiqueta">IVA (%)</label>
        <input id="reg-iva" type="number" v-model.number="editIva" min="0" max="100" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-piscina" class="campo-etiqueta">Entrada a la piscina por persona ($, sin abono)</label>
        <input id="reg-piscina" type="number" inputmode="numeric" v-model.number="editPoolPrice" min="0" max="1000000" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-margen" class="campo-etiqueta">Margen de cupos (%)</label>
        <input id="reg-margen" type="number" v-model.number="editMargin" min="0" max="100" class="campo-entrada" />
      </div>
      <div v-for="espacio in editSpaces" :key="espacio.id">
        <label :for="`reg-espacio-${espacio.id}`" class="campo-etiqueta">{{ espacio.nombre }} del restaurante (personas)</label>
        <input :id="`reg-espacio-${espacio.id}`" type="number" inputmode="numeric" v-model.number="espacio.capacidad" min="0" max="1000" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-umbral" class="campo-etiqueta">Menús distintos solo para grupos de más de (personas)</label>
        <input id="reg-umbral" type="number" inputmode="numeric" v-model.number="editMenuThreshold" min="1" max="1000" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-variedades" class="campo-etiqueta">Máximo de menús distintos por comida en esos grupos</label>
        <input id="reg-variedades" type="number" inputmode="numeric" v-model.number="editMenuVarieties" min="1" max="50" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-camping" class="campo-etiqueta">Capacidad máxima del camping (personas)</label>
        <input id="reg-camping" type="number" v-model.number="editMaxCamping" min="1" max="1000" class="campo-entrada" />
      </div>
    </HojaModal>
  </div>
</template>
