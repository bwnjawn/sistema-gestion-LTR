<script setup lang="ts">
import { computed } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'
import BaseButton from './BaseButton.vue'
import HojaModal from './HojaModal.vue'
import { useReservationStore } from '../../stores/reservationStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { PAYMENT_METHOD_LABELS } from '../../services/payments'
import { formatCLP } from '../../lib/format'

// Solo se muestra en el modo administrador (SCRUM-264). Al tocar Enviar, el admin elige cómo queda la reserva
// y, si ya recibió un abono, lo anota. El cliente nunca ve esto: sus solicitudes siempre quedan pendientes.
const props = defineProps<{
  abierto: boolean
  /** Abono que exige la reserva (0 si no exige, por ejemplo una institución). */
  depositAmount: number
  totalAmount: number
}>()

const emit = defineEmits<{
  (e: 'confirmar'): void
  (e: 'cerrar'): void
}>()

const store = useReservationStore()
const settingsStore = useSettingsStore()

const abono = computed(() => Number(store.adminAbonoMonto) || 0)
const faltaAbono = computed(() => Math.max(0, props.depositAmount - abono.value))
const exigeAbono = computed(() => props.depositAmount > 0)

const opciones = computed(() => [
  {
    valor: 'pending' as const,
    titulo: 'Pendiente de abono',
    detalle: exigeAbono.value
      ? `Espera el abono. Si pasan ${settingsStore.depositDeadlineHours} horas sin abono, se marca "Abono vencido".`
      : 'Queda pendiente hasta que la apruebes. Esta reserva no exige abono.'
  },
  {
    valor: 'confirmed' as const,
    titulo: 'Confirmada',
    detalle: 'Retiene las fechas y los cupos desde ahora. Úsala cuando el abono ya está o cuando decides confirmar igual.'
  }
])
</script>

<template>
  <HojaModal :abierto="abierto" titulo="¿Cómo queda esta reserva?" :nivel="70" @cerrar="emit('cerrar')">
  <div class="space-y-2" role="radiogroup" aria-label="Estado de la reserva">
    <label
      v-for="op in opciones"
      :key="op.valor"
      :class="[
        'flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer touch-target',
        store.adminEstado === op.valor ? 'border-brand-dark bg-brand-light' : 'border-gray-400 bg-white'
      ]"
    >
      <input type="radio" name="estado-reserva-admin" :value="op.valor" v-model="store.adminEstado" class="mt-1 w-5 h-5 shrink-0 accent-brand-dark" />
      <span class="space-y-0.5">
        <span class="block text-base font-bold text-brand-dark">{{ op.titulo }}</span>
        <span class="block text-sm text-gray-700">{{ op.detalle }}</span>
      </span>
    </label>
  </div>

  <div class="space-y-2 border-t-2 border-gray-200 pt-3">
    <h4 class="text-base font-bold text-brand-dark">Abono recibido (opcional)</h4>
    <p class="text-sm text-gray-700">
      Si el cliente ya abonó, anótalo aquí.
      <template v-if="exigeAbono">El abono exigido es {{ formatCLP(depositAmount) }}.</template>
      <template v-else>Esta reserva no exige abono.</template>
    </p>
    <div class="grid grid-cols-2 gap-2">
      <label class="space-y-1 text-sm font-bold text-gray-800">
        Monto (CLP)
        <input
          v-model.number="store.adminAbonoMonto"
          type="number"
          inputmode="numeric"
          min="0"
          :max="totalAmount"
          class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-normal text-base"
        />
      </label>
      <label class="space-y-1 text-sm font-bold text-gray-800">
        Medio de pago
        <select v-model="store.adminAbonoMedio" class="w-full p-3 rounded-xl border-2 border-gray-500 bg-white font-normal text-base">
          <option v-for="(label, key) in PAYMENT_METHOD_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>
    </div>
  </div>

  <p
    v-if="store.adminEstado === 'confirmed' && exigeAbono && faltaAbono > 0"
    class="flex items-start gap-1.5 text-sm bg-amber-100 border-2 border-amber-500 text-amber-950 rounded-xl p-3"
  >
    <AlertTriangle class="w-5 h-5 stroke-[2.5] shrink-0" aria-hidden="true" />
    Quedará confirmada sin el abono completo: faltan {{ formatCLP(faltaAbono) }}. Podrás anotarlo después en el detalle.
  </p>

    <template #pie>
      <div class="grid grid-cols-2 gap-2">
        <BaseButton variant="primary" size="lg" class="!text-base" @click="emit('confirmar')">Enviar reserva</BaseButton>
        <BaseButton variant="outline" size="lg" class="!text-base" @click="emit('cerrar')">Volver</BaseButton>
      </div>
    </template>
  </HojaModal>
</template>
