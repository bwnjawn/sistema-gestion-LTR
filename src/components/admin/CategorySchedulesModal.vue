<script setup lang="ts">
import { useBloqueoScroll } from '../../composables/useBloqueoScroll'
import { ref, watch, computed } from 'vue'
import { X, Save, Clock } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import BaseButton from '../ui/BaseButton.vue'

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
useBloqueoScroll(computed(() => props.isOpen))
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-5 max-w-sm w-full border-2 border-brand-border shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 class="text-sm font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
          <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Horarios de Camping
        </h3>
        <button aria-label="Cerrar" type="button" @click="emit('close')" class="p-1 text-gray-700 hover:bg-gray-100 rounded-full">
          <X class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <div class="space-y-3 text-xs font-bold">
        <div class="bg-brand-light p-3 rounded-2xl border border-brand-border space-y-2">
          <span class="block font-black text-brand-dark uppercase text-xs">Camping Día</span>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-700">Ingreso</label>
              <input v-model="campingDiario.checkIn" type="text" class="w-full p-2 rounded-xl border border-brand-border bg-white font-bold" />
            </div>
            <div>
              <label class="block text-xs text-gray-700">Salida</label>
              <input v-model="campingDiario.checkOut" type="text" class="w-full p-2 rounded-xl border border-brand-border bg-white font-bold" />
            </div>
          </div>
        </div>

        <div class="bg-brand-light p-3 rounded-2xl border border-brand-border space-y-2">
          <span class="block font-black text-brand-dark uppercase text-xs">Camping Pernoctar</span>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-700">Ingreso</label>
              <input v-model="campingPernoctar.checkIn" type="text" class="w-full p-2 rounded-xl border border-brand-border bg-white font-bold" />
            </div>
            <div>
              <label class="block text-xs text-gray-700">Salida</label>
              <input v-model="campingPernoctar.checkOut" type="text" class="w-full p-2 rounded-xl border border-brand-border bg-white font-bold" />
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <BaseButton variant="outline" class="flex-1" @click="emit('close')">Cancelar</BaseButton>
        <BaseButton variant="primary" class="flex-1" @click="handleSave">
          <Save class="w-4 h-4 mr-1 stroke-[2.5]" /> Guardar
        </BaseButton>
      </div>
    </div>
  </div>
</template>