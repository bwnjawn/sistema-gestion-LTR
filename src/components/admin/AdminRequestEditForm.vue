<script setup lang="ts">
import { computed, ref } from 'vue'
import { Save, X } from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import BaseCalendar from '../ui/BaseCalendar.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { dateToISO, formatDateLong, isoToDate, nightsBetween } from '../../lib/dates'
import { isSingleDayRequest, toRequestEdit } from '../../services/requests'
import type { ReservationRequest } from '../../types/domain'

const props = defineProps<{
  request: ReservationRequest
}>()

const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'cancel'): void
}>()

const requestsStore = useRequestsStore()

const form = ref(toRequestEdit(props.request))
const error = ref('')

const isSingleDay = computed(() => isSingleDayRequest(props.request))
const guestsLabel = computed(() => (props.request.type === 'restaurante' ? 'Comensales' : 'Personas'))

const startDate = computed(() => isoToDate(form.value.startDate))
const endDate = computed(() => isoToDate(form.value.endDate))

const nights = computed(() => nightsBetween(form.value.startDate, form.value.endDate))

// El calendario entrega un rango (primer clic = llegada, segundo = salida).
// En visitas de un día solo interesa un día: el último clic manda.
function onCalendarChange(range: { start: Date | null; end: Date | null }) {
  if (isSingleDay.value) {
    const day = range.end ?? range.start
    form.value.startDate = day ? dateToISO(day) : ''
    form.value.endDate = ''
    return
  }
  form.value.startDate = range.start ? dateToISO(range.start) : ''
  form.value.endDate = range.end ? dateToISO(range.end) : ''
}

// Fechas originales, para avisar y pedir confirmación si el admin las cambia.
const originalStart = form.value.startDate
const originalEnd = form.value.endDate
const confirmingDates = ref(false)

const datesChanged = computed(() =>
  form.value.startDate !== originalStart || form.value.endDate !== originalEnd
)

function describeRange(start: string, end: string): string {
  if (!start) return 'sin fecha'
  if (isSingleDay.value || !end) return formatDateLong(start)
  return `${formatDateLong(start)} – ${formatDateLong(end)}`
}

const datesChangeMessage = computed(() =>
  `¿Cambiar la reserva de ${describeRange(originalStart, originalEnd)} a ${describeRange(form.value.startDate, form.value.endDate)}?`
)

function requestSave() {
  if (datesChanged.value) {
    confirmingDates.value = true
    return
  }
  save()
}

function save() {
  confirmingDates.value = false
  const result = requestsStore.updateRequestDetails(props.request.id, {
    ...form.value,
    guestsCount: Number(form.value.guestsCount)
  })
  if (!result.ok) {
    error.value = result.message || 'No se pudieron guardar los cambios.'
    return
  }
  error.value = ''
  emit('saved')
}
</script>

<template>
  <form @submit.prevent="requestSave" class="border-2 border-brand-dark rounded-2xl p-3 space-y-3">
    <h3 class="text-lg font-black text-brand-dark">Modificar la solicitud</h3>

    <label class="space-y-1 text-sm font-black text-gray-800 block">
      Nombre
      <input v-model="form.clientName" type="text" class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-bold text-base" />
    </label>

    <div class="grid grid-cols-2 gap-2">
      <label class="space-y-1 text-sm font-black text-gray-800">
        Teléfono
        <input v-model="form.clientPhone" type="tel" inputmode="tel" class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-bold text-base" />
      </label>
      <label class="space-y-1 text-sm font-black text-gray-800">
        {{ guestsLabel }}
        <input v-model.number="form.guestsCount" type="number" inputmode="numeric" min="1" class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-bold text-base" />
      </label>
    </div>

    <label class="space-y-1 text-sm font-black text-gray-800 block">
      Correo (opcional)
      <input v-model="form.clientEmail" type="email" class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-bold text-base" />
    </label>

    <label class="space-y-1 text-sm font-black text-gray-800 block">
      Comentarios
      <textarea v-model="form.comments" rows="2" class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-bold text-base"></textarea>
    </label>

    <div class="space-y-2">
      <p class="text-sm font-black text-gray-800">
        {{ isSingleDay ? 'Fecha de la visita' : 'Fechas de llegada y salida' }}
      </p>
      <p class="text-base font-black text-brand-dark bg-gray-100 border-2 border-gray-300 rounded-xl p-2.5">
        <template v-if="isSingleDay">{{ formatDateLong(form.startDate) }}</template>
        <template v-else>
          {{ formatDateLong(form.startDate) }} → {{ form.endDate ? formatDateLong(form.endDate) : 'elige la salida' }}
          <span v-if="nights > 0"> · {{ nights }} {{ nights === 1 ? 'noche' : 'noches' }}</span>
        </template>
      </p>
      <BaseCalendar
        :start-date="startDate"
        :end-date="endDate"
        @change="onCalendarChange"
      />
    </div>

    <p v-if="request.type !== 'restaurante'" class="text-sm font-bold text-gray-700">
      Si cambias las fechas o las personas, el total y el abono exigido se recalculan. Los pagos ya registrados se conservan.
    </p>

    <p v-if="error" class="text-sm font-black text-rose-950 bg-rose-50 border-2 border-status-danger rounded-xl p-2" role="alert">{{ error }}</p>

    <div v-if="confirmingDates" class="border-2 border-amber-500 bg-amber-50 rounded-2xl p-3 space-y-2" role="alertdialog">
      <p class="text-base font-black text-amber-950">{{ datesChangeMessage }}</p>
      <div class="grid grid-cols-2 gap-2">
        <BaseButton type="button" variant="primary" @click="save">Sí, cambiar</BaseButton>
        <BaseButton type="button" variant="outline" @click="confirmingDates = false">No, volver</BaseButton>
      </div>
    </div>

    <div v-else class="grid grid-cols-2 gap-2">
      <BaseButton type="submit" variant="primary">
        <Save class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" /> Guardar cambios
      </BaseButton>
      <BaseButton type="button" variant="outline" @click="emit('cancel')">
        <X class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" /> Cancelar
      </BaseButton>
    </div>
  </form>
</template>
