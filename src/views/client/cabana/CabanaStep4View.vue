<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { CheckCircle2, Utensils, Tent, RotateCcw } from 'lucide-vue-next'
import BaseButton from '../../../components/ui/BaseButton.vue'
import AvisoEnvio from '../../../components/ui/AvisoEnvio.vue'
import CodigoSolicitud from '../../../components/ui/CodigoSolicitud.vue'
import { useEnvioSolicitud } from '../../../composables/useEnvioSolicitud'
import { useSalidaReserva } from '../../../composables/useSalidaReserva'
import ConfirmacionReservaAdmin from '../../../components/ui/ConfirmacionReservaAdmin.vue'
import CasilleroEventoEspecial from '../../../components/ui/CasilleroEventoEspecial.vue'
import ModalEstadoReservaAdmin from '../../../components/ui/ModalEstadoReservaAdmin.vue'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import DatosTransferencia from '../../../components/ui/DatosTransferencia.vue'
import DepositInfoCard from '../../../components/ui/DepositInfoCard.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useCatalogStore } from '../../../stores/catalogStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { formatCLP } from '../../../lib/format'
import { formatDateShort, nightsBetween } from '../../../lib/dates'

const router = useRouter()
const store = useReservationStore()
const catalogStore = useCatalogStore()
const settingsStore = useSettingsStore()

const isSubmitted = ref(false)
const reservationCode = ref('')

const selectedCabin = computed(() => {
  return catalogStore.cabins.find(c => c.id === store.selectedCabinId)
})

const nightsCount = computed(() => nightsBetween(store.checkInDate, store.checkOutDate))

const subtotal = computed(() => store.priceBreakdown?.subtotal ?? 0)
const ivaAmount = computed(() => store.priceBreakdown?.ivaAmount ?? 0)
const totalWithIva = computed(() => store.priceBreakdown?.totalWithIva ?? 0)
const depositAmount = computed(() => store.priceBreakdown?.depositAmount ?? 0)

const formattedScheduleRange = computed(() => {
  if (!store.checkInDate || !store.checkOutDate) return 'No definido'
  return `${formatDateShort(store.checkInDate)} al ${formatDateShort(store.checkOutDate)}`
})

function handleGoToRestaurant() {
  store.prepareCrossServiceBooking('restaurante')
  router.push('/restaurante/paso1')
}

function handleGoToCamping() {
  store.prepareCrossServiceBooking('camping')
  router.push('/camping/paso1')
}

const { terminar: handleGoHome } = useSalidaReserva()

const { isSubmitting, errorEnvio, sinConexion, seGuardaParaDespues, bloqueado, enviar } = useEnvioSolicitud()

function handleSendRequest() {
  return enviar(async () => {
    reservationCode.value = await store.submitReservationRequest()
    isSubmitted.value = true
  })
}

// El administrador elige cómo queda la reserva en un modal antes de enviar; el cliente envía directo
const mostrarEstadoAdmin = ref(false)

function alTocarEnviar() {
  if (store.isAdminMode) mostrarEstadoAdmin.value = true
  else handleSendRequest()
}

function confirmarEstadoAdmin() {
  mostrarEstadoAdmin.value = false
  handleSendRequest()
}

</script>

<template>
  <div class="space-y-4 max-w-md lg:max-w-none mx-auto w-full pb-contenido-precio">
    
    <div v-if="!isSubmitted" class="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-x-8 lg:gap-y-5 lg:items-start">
      <h2 class="lg:col-span-2 text-2xl lg:text-3xl font-bold text-brand-dark leading-tight">Revisa tu reserva</h2>

      <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-4">
        <div class="space-y-0.5">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-bold text-brand-accent">Alojamiento</p>
            <button type="button" @click="router.push('/cabana/paso2')" class="text-sm font-bold text-brand-accent underline py-1 shrink-0">Editar</button>
          </div>
          <p class="text-xl font-bold text-brand-dark">{{ selectedCabin?.name }}</p>
          <p class="text-base text-gray-700">{{ store.guestsCount }} personas</p>
        </div>
        <div class="space-y-0.5 pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-bold text-brand-accent">Fechas y horarios</p>
            <button type="button" @click="router.push('/cabana/paso1')" class="text-sm font-bold text-brand-accent underline py-1 shrink-0">Editar</button>
          </div>
          <p class="text-base font-bold text-brand-dark">{{ formattedScheduleRange }} · {{ nightsCount }} noche/s</p>
          <p class="text-base text-gray-700">Ingreso {{ settingsStore.cabinSchedules.checkIn }} hrs · Salida {{ settingsStore.cabinSchedules.checkOut }} hrs</p>
        </div>
        <div class="space-y-0.5 pt-4 border-t border-gray-200">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-bold text-brand-accent">Titular</p>
            <button type="button" @click="router.push('/cabana/paso3')" class="text-sm font-bold text-brand-accent underline py-1 shrink-0">Editar</button>
          </div>
          <p class="text-base font-bold text-brand-dark">{{ store.clientName }}</p>
          <p class="text-base text-gray-700">{{ store.clientPhone }}</p>
          <p v-if="store.clientEmail" class="text-base text-gray-700">{{ store.clientEmail }}</p>
        </div>
        <div v-if="store.comments" class="pt-4 border-t border-gray-200 space-y-0.5">
          <p class="text-sm font-bold text-brand-accent">Comentarios</p>
          <p class="text-base text-gray-700 italic">"{{ store.comments }}"</p>
        </div>
        <div class="pt-4 border-t border-gray-200 space-y-1.5 text-sm text-gray-700">
          <div class="flex justify-between gap-3"><span>Valor noche × {{ nightsCount }}</span><span>{{ formatCLP(subtotal) }}</span></div>
          <div class="flex justify-between gap-3"><span>IVA (19%)</span><span>{{ formatCLP(ivaAmount) }}</span></div>
        </div>
      </div>

      <!-- En PC: a la derecha el total, el envío y los avisos -->
      <div class="flex flex-col gap-4 lg:sticky lg:top-24">
      <DepositInfoCard v-if="!store.isAdminMode" />
      <CasilleroEventoEspecial v-if="store.isAdminMode" />

      <AvisoEnvio
        :sin-conexion="sinConexion"
        :se-guarda="seGuardaParaDespues"
        :error="errorEnvio"
        :enviando="isSubmitting"
        @reintentar="handleSendRequest"
      />

      <ModalEstadoReservaAdmin
        v-if="store.isAdminMode"
        :abierto="mostrarEstadoAdmin"
        :deposit-amount="depositAmount"
        :total-amount="totalWithIva"
        @confirmar="confirmarEstadoAdmin"
        @cerrar="mostrarEstadoAdmin = false"
      />

      <BarraAccionInferior enviar :total="totalWithIva" :abono="depositAmount" :loading="isSubmitting || bloqueado" :disabled="bloqueado" @click="alTocarEnviar">{{ bloqueado ? 'Esperando conexión…' : isSubmitting ? 'Enviando…' : 'Enviar solicitud' }}</BarraAccionInferior>
      </div>
    </div>

    <!-- El administrador ve su propia confirmación, sin el texto dirigido al cliente -->
    <ConfirmacionReservaAdmin
      v-else-if="store.isAdminMode"
      :codigo="reservationCode"
      :servicio="String(selectedCabin?.name ?? '')"
      :fechas="String(formattedScheduleRange)"
      :total="totalWithIva"
    />

    <div v-else class="lg:max-w-2xl lg:mx-auto space-y-6 text-center">
      <div class="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs border-2 border-emerald-300">
        <CheckCircle2 class="w-10 h-10 stroke-[2.5]" />
      </div>

      <div class="space-y-2.5">
        <CodigoSolicitud :codigo="reservationCode" />

        <h2 class="text-2xl font-bold text-brand-dark tracking-tight">
          ¡Solicitud de Cabaña Registrada!
        </h2>

        <p class="text-base text-gray-700 leading-relaxed max-w-xs mx-auto">
          Registramos tu solicitud para <strong class="text-brand-dark font-bold">{{ selectedCabin?.name }}</strong> ({{ nightsCount }} noche/s). Te contactaremos al <strong class="text-brand-dark font-bold">{{ store.clientPhone }}</strong>. <span class="block mt-2 text-brand-dark font-bold">Tu solicitud queda pendiente. La fecha se asegura al confirmar y abonar.</span>
        </p>
      </div>

      <div class="bg-white p-4 rounded-2xl border-2 border-brand-border text-left space-y-2 text-sm text-gray-700">
        <div class="flex justify-between items-center">
          <span class="text-gray-600">Servicio:</span>
          <span class="text-brand-dark font-bold">{{ selectedCabin?.name }}</span>
        </div>
        <div class="flex justify-between items-start gap-2">
          <span class="text-gray-600 shrink-0">Fechas y Horarios:</span>
          <span class="text-brand-dark font-bold text-right">{{ formattedScheduleRange }}</span>
        </div>
        <div class="flex justify-between items-center border-t border-gray-200/60 pt-2 mt-1">
          <span class="text-gray-600">Total Estimado:</span>
          <span class="text-sm font-bold text-brand-dark">{{ formatCLP(totalWithIva) }}</span>
        </div>
      </div>

      <div v-if="depositAmount > 0" class="bg-white p-4 rounded-2xl border-2 border-brand-border text-left space-y-2.5">
        <h3 class="text-base font-bold text-brand-dark">Abono para confirmar: {{ formatCLP(depositAmount) }}</h3>
        <p class="text-base text-gray-700">Transfiere dentro de {{ settingsStore.depositDeadlineHours }} horas. El saldo se paga al llegar.</p>
        <DatosTransferencia />
      </div>

      <div class="bg-amber-50/90 border-2 border-amber-200 p-4 rounded-2xl text-left space-y-3">
        <div class="flex items-center gap-2 text-amber-950 font-bold text-sm">
          <Utensils class="w-5 h-5 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>¿Quieres agregar comida o espacio de camping?</span>
        </div>

        <p class="text-base font-normal text-amber-900 leading-relaxed">
          Conservamos las fechas y tu grupo de <strong class="text-amber-950 font-bold">{{ store.guestsCount }} personas</strong> para que selecciones tus servicios adicionales sin volver a llenar datos.
        </p>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            @click="handleGoToRestaurant"
            class="bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-sm py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs touch-target active:scale-95 transition-transform"
          >
            <Utensils class="w-4 h-4 stroke-[2.5]" />
            <span>Restaurante</span>
          </button>

          <button
            type="button"
            @click="handleGoToCamping"
            class="bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-sm py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs touch-target active:scale-95 transition-transform"
          >
            <Tent class="w-4 h-4 stroke-[2.5]" />
            <span>Camping</span>
          </button>
        </div>
      </div>

      <div class="pt-1">
        <BaseButton variant="outline" size="lg" fullWidth @click="handleGoHome">
          <RotateCcw class="w-5 h-5 mr-1.5 stroke-[2.5]" />
          Volver al Inicio
        </BaseButton>
      </div>
    </div>

  </div>
</template> 