<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Save, Home, Tent, Utensils, Percent } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const settingsStore = useSettingsStore()

const depositPercentage = ref(30)
const marginPercentage = ref(10)

const cabinCheckIn = ref('15:00')
const cabinCheckOut = ref('11:00')

const campingDiarioIn = ref('09:00')
const campingDiarioOut = ref('19:30')
const campingPernoctarIn = ref('12:00')
const campingPernoctarOut = ref('11:00')

const desayunoStart = ref('08:30')
const desayunoEnd = ref('11:00')
const almuerzoStart = ref('12:30')
const almuerzoEnd = ref('14:00')
const onceStart = ref('17:00')
const onceEnd = ref('19:30')

watch(() => props.isOpen, (open) => {
  if (open) {
    depositPercentage.value = settingsStore.parameters.defaultDepositPercentage
    marginPercentage.value = settingsStore.parameters.marginPercentage

    cabinCheckIn.value = settingsStore.cabinSchedules.checkIn
    cabinCheckOut.value = settingsStore.cabinSchedules.checkOut

    campingDiarioIn.value = settingsStore.campingSchedules.diario.checkIn
    campingDiarioOut.value = settingsStore.campingSchedules.diario.checkOut
    campingPernoctarIn.value = settingsStore.campingSchedules.pernoctar.checkIn
    campingPernoctarOut.value = settingsStore.campingSchedules.pernoctar.checkOut

    desayunoStart.value = settingsStore.restaurantSchedules.desayuno.start
    desayunoEnd.value = settingsStore.restaurantSchedules.desayuno.end
    almuerzoStart.value = settingsStore.restaurantSchedules.almuerzo.start
    almuerzoEnd.value = settingsStore.restaurantSchedules.almuerzo.end
    onceStart.value = settingsStore.restaurantSchedules.once.start
    onceEnd.value = settingsStore.restaurantSchedules.once.end
  }
}, { immediate: true })

function handleSave() {
  settingsStore.updateParameters({
    defaultDepositPercentage: depositPercentage.value,
    marginPercentage: marginPercentage.value
  })

  settingsStore.cabinSchedules.checkIn = cabinCheckIn.value
  settingsStore.cabinSchedules.checkOut = cabinCheckOut.value
  settingsStore.cabinSchedules.display = `Día de ingreso (${cabinCheckIn.value} hrs) - Día de salida (${cabinCheckOut.value} hrs)`

  settingsStore.campingSchedules.diario.checkIn = campingDiarioIn.value
  settingsStore.campingSchedules.diario.checkOut = campingDiarioOut.value
  settingsStore.campingSchedules.diario.display = `Día de ingreso (${campingDiarioIn.value} hrs) - Día de ingreso (${campingDiarioOut.value} hrs)`

  settingsStore.campingSchedules.pernoctar.checkIn = campingPernoctarIn.value
  settingsStore.campingSchedules.pernoctar.checkOut = campingPernoctarOut.value
  settingsStore.campingSchedules.pernoctar.display = `Día de ingreso (${campingPernoctarIn.value} hrs) - Día de salida (${campingPernoctarOut.value} hrs)`

  settingsStore.restaurantSchedules.desayuno.start = desayunoStart.value
  settingsStore.restaurantSchedules.desayuno.end = desayunoEnd.value

  settingsStore.restaurantSchedules.almuerzo.start = almuerzoStart.value
  settingsStore.restaurantSchedules.almuerzo.end = almuerzoEnd.value

  settingsStore.restaurantSchedules.once.start = onceStart.value
  settingsStore.restaurantSchedules.once.end = onceEnd.value

  emit('close')
}

function close() {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white w-full max-w-lg rounded-3xl border-2 border-brand-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="p-4 sm:p-5 border-b-2 border-brand-border bg-brand-light flex items-center justify-between">
        <div>
          <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">
            Reglas Operativas
          </span>
          <h3 class="text-lg font-black text-brand-dark leading-tight">
            Horarios y Parámetros
          </h3>
        </div>
        <button type="button" @click="close" class="p-2 rounded-full bg-white border border-brand-border text-brand-dark hover:bg-gray-100">
          <X class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSave" class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-bold grow">
        <!-- Porcentajes y Reglas -->
        <div class="p-3 bg-brand-light rounded-2xl border-2 border-brand-border space-y-2">
          <label class="block text-brand-dark font-black flex items-center gap-1.5">
            <Percent class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Porcentajes Generales
          </label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] text-gray-600 block">Abono Exigido (%)</span>
              <input v-model.number="depositPercentage" type="number" min="0" max="100" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-white font-black text-xs" />
            </div>
            <div>
              <span class="text-[10px] text-gray-600 block">Margen Aforo (%)</span>
              <input v-model.number="marginPercentage" type="number" min="0" max="100" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-white font-black text-xs" />
            </div>
          </div>
        </div>

        <!-- Horarios Cabañas -->
        <div class="space-y-1.5">
          <label class="block text-brand-dark font-black flex items-center gap-1.5">
            <Home class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Horarios Cabañas
          </label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] text-gray-500 block">Check-In</span>
              <input v-model="cabinCheckIn" type="time" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-bold text-xs" />
            </div>
            <div>
              <span class="text-[10px] text-gray-500 block">Check-Out</span>
              <input v-model="cabinCheckOut" type="time" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-bold text-xs" />
            </div>
          </div>
        </div>

        <!-- Horarios Camping -->
        <div class="space-y-1.5">
          <label class="block text-brand-dark font-black flex items-center gap-1.5">
            <Tent class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Horarios Camping
          </label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] text-gray-500 block">Camping Diario (Entrada / Salida)</span>
              <div class="flex gap-1">
                <input v-model="campingDiarioIn" type="time" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-bold text-xs" />
                <input v-model="campingDiarioOut" type="time" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-bold text-xs" />
              </div>
            </div>
            <div>
              <span class="text-[10px] text-gray-500 block">Camping Pernoctar (Entrada / Salida)</span>
              <div class="flex gap-1">
                <input v-model="campingPernoctarIn" type="time" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-bold text-xs" />
                <input v-model="campingPernoctarOut" type="time" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-bold text-xs" />
              </div>
            </div>
          </div>
        </div>

        <!-- Horarios Restaurante -->
        <div class="space-y-1.5">
          <label class="block text-brand-dark font-black flex items-center gap-1.5">
            <Utensils class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Horarios Restaurante
          </label>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <span class="text-[10px] text-gray-500 block">Desayuno</span>
              <input v-model="desayunoStart" type="time" class="w-full p-1.5 rounded-lg border border-brand-border bg-brand-light font-bold text-xs mb-1" />
              <input v-model="desayunoEnd" type="time" class="w-full p-1.5 rounded-lg border border-brand-border bg-brand-light font-bold text-xs" />
            </div>
            <div>
              <span class="text-[10px] text-gray-500 block">Almuerzo</span>
              <input v-model="almuerzoStart" type="time" class="w-full p-1.5 rounded-lg border border-brand-border bg-brand-light font-bold text-xs mb-1" />
              <input v-model="almuerzoEnd" type="time" class="w-full p-1.5 rounded-lg border border-brand-border bg-brand-light font-bold text-xs" />
            </div>
            <div>
              <span class="text-[10px] text-gray-500 block">Once</span>
              <input v-model="onceStart" type="time" class="w-full p-1.5 rounded-lg border border-brand-border bg-brand-light font-bold text-xs mb-1" />
              <input v-model="onceEnd" type="time" class="w-full p-1.5 rounded-lg border border-brand-border bg-brand-light font-bold text-xs" />
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="pt-2 flex gap-2">
          <button type="button" @click="close" class="flex-1 py-3 bg-brand-light border-2 border-brand-border rounded-2xl font-black text-brand-dark">Cancelar</button>
          <button type="submit" class="flex-1 py-3 bg-brand-dark text-white rounded-2xl font-black border-2 border-brand-dark flex items-center justify-center gap-1.5">
            <Save class="w-4 h-4 stroke-[2.5]" /> Guardar Parámetros
          </button>
        </div>
      </form>
    </div>
  </div>
</template>