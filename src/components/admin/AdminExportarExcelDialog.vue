<script setup lang="ts">
// Exportar las solicitudes a Excel (SCRUM-275): todo, o solo lo que la lista muestra con sus filtros.
import { computed, ref, watch } from 'vue'
import { Download } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import HojaModal from '../ui/HojaModal.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { descargarArchivo } from '../../lib/compartirArchivo'
import { generarExcelSolicitudes, TIPO_XLSX } from '../../lib/excelSolicitudes'
import { construirHojas, nombreArchivoExcel } from '../../services/exportacion'
import type { ReservationRequest } from '../../types/domain'

const props = defineProps<{
  abierto: boolean
  /** Las solicitudes que la lista muestra ahora, con los filtros aplicados. */
  visibles: ReservationRequest[]
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const requestsStore = useRequestsStore()
const settingsStore = useSettingsStore()

const alcance = ref<'todas' | 'visibles'>('todas')
const trabajando = ref(false)
const error = ref('')

const total = computed(() => requestsStore.requests.length)
// Solo tiene sentido elegir si los filtros dejan fuera alguna solicitud
const hayFiltro = computed(() => props.visibles.length !== total.value)
const aExportar = computed(() => (alcance.value === 'visibles' && hayFiltro.value ? props.visibles : requestsStore.requests))

watch(() => props.abierto, abierto => {
  if (!abierto) return
  alcance.value = 'todas'
  error.value = ''
})

async function descargar() {
  if (trabajando.value || aExportar.value.length === 0) return
  trabajando.value = true
  error.value = ''
  try {
    const hojas = construirHojas(aExportar.value, settingsStore.ivaPercentage)
    const libro = await generarExcelSolicitudes(hojas)
    const filtradas = alcance.value === 'visibles' && hayFiltro.value
    descargarArchivo(new File([libro], nombreArchivoExcel(filtradas), { type: TIPO_XLSX }))
    emit('close')
  } catch {
    error.value = 'No se pudo generar el Excel. Intenta de nuevo.'
  } finally {
    trabajando.value = false
  }
}

const claseOpcion = 'flex items-start gap-3 p-3 rounded-2xl border-2 touch-target cursor-pointer'
</script>

<template>
  <HojaModal :abierto="abierto" titulo="Exportar a Excel" :nivel="70" @cerrar="emit('close')">
    <p v-if="total === 0" class="text-sm text-gray-800">Todavía no hay solicitudes para exportar.</p>

    <template v-else>
      <fieldset v-if="hayFiltro" class="space-y-2">
        <legend class="sr-only">Qué solicitudes exportar</legend>
        <label :class="[claseOpcion, alcance === 'todas' ? 'border-brand-dark bg-brand-light' : 'border-brand-border bg-white']">
          <input v-model="alcance" type="radio" value="todas" class="mt-1 w-5 h-5 accent-[#1E4620]" />
          <span class="text-sm text-gray-800">
            <span class="font-bold text-brand-dark block">Todas las solicitudes ({{ total }})</span>
            Incluye pendientes, confirmadas, rechazadas y canceladas.
          </span>
        </label>
        <label :class="[claseOpcion, alcance === 'visibles' ? 'border-brand-dark bg-brand-light' : 'border-brand-border bg-white']">
          <input v-model="alcance" type="radio" value="visibles" class="mt-1 w-5 h-5 accent-[#1E4620]" />
          <span class="text-sm text-gray-800">
            <span class="font-bold text-brand-dark block">Solo las que veo en pantalla ({{ visibles.length }})</span>
            Con los filtros que tienes puestos ahora.
          </span>
        </label>
      </fieldset>
      <p v-else class="text-sm text-gray-800">
        Se exportan las <span class="font-bold">{{ total }}</span> solicitudes, también las rechazadas y canceladas.
      </p>

      <p class="text-base text-gray-700 bg-brand-light border border-brand-border rounded-xl p-3">
        El archivo trae los registros con año y mes, y hojas de resumen por mes, servicio y estado. En Excel puedes filtrar y ordenar desde los encabezados. Incluye teléfono y correo de los clientes: úsalo solo tú.
      </p>
    </template>

    <p v-if="error" class="text-sm font-bold text-rose-950 bg-rose-50 border border-status-danger rounded-xl p-2">{{ error }}</p>

    <template #pie>
      <div class="grid grid-cols-2 gap-2">
        <BaseButton variant="outline" size="md" class="!text-base" @click="emit('close')">Cancelar</BaseButton>
        <BaseButton variant="primary" size="md" class="!text-base" :disabled="trabajando || total === 0" @click="descargar">
          <Download class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" /> {{ trabajando ? 'Preparando…' : 'Descargar' }}
        </BaseButton>
      </div>
    </template>
  </HojaModal>
</template>
