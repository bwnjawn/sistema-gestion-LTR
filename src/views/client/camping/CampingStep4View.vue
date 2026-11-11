<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Calendar, Pencil, Clock, Receipt, User, Phone, CheckCircle2, FileCheck, Utensils, Home, RotateCcw 
} from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import AvisoEnvio from '../../../components/ui/AvisoEnvio.vue'
import { useEnvioSolicitud } from '../../../composables/useEnvioSolicitud'
import { useSalidaReserva } from '../../../composables/useSalidaReserva'
import ConfirmacionReservaAdmin from '../../../components/ui/ConfirmacionReservaAdmin.vue'
import CasilleroEventoEspecial from '../../../components/ui/CasilleroEventoEspecial.vue'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import DepositInfoCard from '../../../components/ui/DepositInfoCard.vue'
import HorarioCard from '../../../components/ui/HorarioCard.vue'
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

const selectedCampingSite = computed(() => {
  return catalogStore.campingSites.find(s => s.id === store.selectedCampingId)
})

const isDiario = computed(() => store.campingType === 'diario')

const nightsCount = computed(() => (isDiario.value ? 1 : nightsBetween(store.checkInDate, store.checkOutDate)))

const subtotal = computed(() => store.priceBreakdown?.subtotal ?? 0)
const ivaAmount = computed(() => store.priceBreakdown?.ivaAmount ?? 0)
const totalWithIva = computed(() => store.priceBreakdown?.totalWithIva ?? 0)
const depositAmount = computed(() => store.priceBreakdown?.depositAmount ?? 0)

const formattedScheduleDisplay = computed(() => {
  if (!store.checkInDate) return 'Sin fecha'
  if (isDiario.value) {
    return `${formatDateShort(store.checkInDate)} (Día de campo)`
  }
  return `${formatDateShort(store.checkInDate)} al ${formatDateShort(store.checkOutDate)} (${nightsCount.value} noc.)`
})

const horarioCamping = computed(() => {
  const h = settingsStore.campingSchedules[isDiario.value ? 'diario' : 'pernoctar']
  return h
})

const { isSubmitting, errorEnvio, sinConexion, enviar } = useEnvioSolicitud()

function handleSendRequest() {
  return enviar(async () => {
    reservationCode.value = await store.submitReservationRequest()
    isSubmitted.value = true
  })
}

function handleGoToRestaurant() {
  store.prepareCrossServiceBooking('restaurant')
  router.push('/restaurante/paso1')
}

function handleGoToCabana() {
  store.prepareCrossServiceBooking('cabana')
  router.push('/cabana/paso1')
}

const { terminar: handleGoHome } = useSalidaReserva()
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-contenido-nav">
    
    <div v-if="!isSubmitted" class="space-y-4">
      <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
        <StepIndicator :current-step="4" />
      </div>

      <BaseAlert variant="info" title="Revisa tu solicitud antes de enviar">
        Verifica todos los datos de tu reserva de camping antes de confirmar.
      </BaseAlert>

      <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-6">
        
        <div class="space-y-2">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Fechas y Modalidad
            </h3>
            <button type="button" @click="router.push('/camping/paso1')" class="text-sm font-black text-brand-accent hover:underline flex items-center gap-1">
              <Pencil class="w-3.5 h-3.5" /> Editar
            </button>
          </div>
          <p class="text-sm font-black text-brand-dark">
            {{ formattedScheduleDisplay }}
          </p>
          <HorarioCard :ingreso="horarioCamping.checkIn" :salida="horarioCamping.checkOut" :salida-mismo-dia="isDiario" />
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Espacio Seleccionado
            </h3>
            <button type="button" @click="router.push('/camping/paso2')" class="text-sm font-black text-brand-accent hover:underline flex items-center gap-1">
              <Pencil class="w-3.5 h-3.5" /> Editar
            </button>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm font-black text-brand-dark">{{ selectedCampingSite?.name }}</span>
            <span class="text-sm font-extrabold text-gray-600">{{ store.guestsCount }} personas</span>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <h3 class="text-sm font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Datos del Titular
            </h3>
            <button type="button" @click="router.push('/camping/paso3')" class="text-sm font-black text-brand-accent hover:underline flex items-center gap-1">
              <Pencil class="w-3.5 h-3.5" /> Editar
            </button>
          </div>
          <div class="text-sm font-bold text-gray-700 space-y-1">
            <p class="text-sm font-black text-brand-dark">{{ store.clientName }}</p>
            <p class="flex items-center gap-1"><Phone class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" /> {{ store.clientPhone }}</p>
            <p v-if="store.clientEmail" class="text-gray-500">{{ store.clientEmail }}</p>
          </div>
        </div>

        <div v-if="store.comments" class="space-y-1 bg-amber-50 p-3 rounded-2xl border border-amber-200">
          <span class="text-sm font-black text-amber-900 uppercase tracking-wider block">Comentarios Adicionales:</span>
          <p class="text-sm font-semibold text-amber-950 italic">"{{ store.comments }}"</p>
        </div>

      </div>

      <div class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-3">
        <div class="flex items-center gap-1.5 border-b border-gray-100 pb-2">
          <Receipt class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <h3 class="text-sm font-extrabold text-gray-500 uppercase tracking-wider">Desglose de Tarifas</h3>
        </div>

        <div class="space-y-2 text-sm font-bold text-gray-600">
          <div class="flex justify-between">
            <span>{{ store.guestsCount }} personas x {{ isDiario ? '1 día' : nightsCount + ' noche/s' }}:</span>
            <span>{{ formatCLP(subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span>IVA (19%):</span>
            <span>{{ formatCLP(ivaAmount) }}</span>
          </div>
          <div class="flex justify-between text-base font-black text-brand-dark border-t border-gray-200/60 pt-2">
            <span>Total Estimado:</span>
            <span>{{ formatCLP(totalWithIva) }}</span>
          </div>
        </div>
      </div>

      <DepositInfoCard :total-amount="totalWithIva" :deposit-amount="depositAmount" />

      <CasilleroEventoEspecial v-if="store.isAdminMode" />

      <AvisoEnvio
        :sin-conexion="sinConexion"
        :error="errorEnvio"
        :enviando="isSubmitting"
        @reintentar="handleSendRequest"
      />

      <BarraAccionInferior enviar :loading="isSubmitting || sinConexion" :disabled="sinConexion" @click="handleSendRequest">{{ sinConexion ? 'Esperando conexión…' : isSubmitting ? 'Enviando…' : 'Enviar Solicitud' }}</BarraAccionInferior>
    </div>

    <!-- El administrador ve su propia confirmación, sin el texto dirigido al cliente -->
    <ConfirmacionReservaAdmin
      v-else-if="store.isAdminMode"
      :codigo="reservationCode"
      :servicio="String(selectedCampingSite?.name ?? '')"
      :fechas="String(formattedScheduleDisplay)"
      :total="totalWithIva"
    />

    <div v-else class="bg-white p-6 sm:p-7 rounded-3xl border-2 border-brand-border shadow-md space-y-6 text-center">
      <div class="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-xs border-2 border-emerald-300">
        <CheckCircle2 class="w-10 h-10 stroke-[2.5]" />
      </div>

      <div class="space-y-2.5">
        <div class="inline-flex items-center gap-1.5 bg-brand-light border border-brand-border px-3.5 py-1 rounded-full text-sm font-black text-brand-dark shadow-2xs">
          <FileCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <span>Código: {{ reservationCode }}</span>
        </div>

        <h2 class="text-2xl font-black text-brand-dark tracking-tight">
          ¡Solicitud de Camping Registrada!
        </h2>

        <p class="text-sm sm:text-sm font-semibold text-gray-600 leading-relaxed max-w-xs mx-auto">
          Registramos tu solicitud de camping para tu grupo de <strong class="text-brand-dark font-black">{{ store.guestsCount }} personas</strong>. Te contactaremos al <strong class="text-brand-dark font-black">{{ store.clientPhone }}</strong>. <span class="block mt-2 text-brand-dark font-black">Tu solicitud queda pendiente. La fecha se asegura al confirmar y abonar.</span>
        </p>
      </div>

      <div class="bg-brand-light p-4 rounded-2xl border border-brand-border text-left space-y-2 text-sm font-bold text-gray-700">
        <div class="flex justify-between items-center">
          <span class="text-gray-500">Servicio:</span>
          <span class="text-brand-dark font-black">{{ selectedCampingSite?.name }}</span>
        </div>
        <div class="flex justify-between items-start gap-2">
          <span class="text-gray-500 shrink-0">Fechas y Modalidad:</span>
          <span class="text-brand-dark font-black text-right">{{ formattedScheduleDisplay }}</span>
        </div>
        <div class="flex justify-between items-center border-t border-gray-200/60 pt-2 mt-1">
          <span class="text-gray-500">Total Estimado:</span>
          <span class="text-sm font-black text-brand-dark">{{ formatCLP(totalWithIva) }}</span>
        </div>
      </div>

      <div class="bg-amber-50/90 border-2 border-amber-200 p-4 rounded-2xl text-left space-y-3">
        <div class="flex items-center gap-2 text-amber-950 font-black text-sm">
          <Home class="w-5 h-5 text-amber-700 shrink-0 stroke-[2.5]" />
          <span>¿Quieres agregar comida o alojamiento en cabaña?</span>
        </div>

        <p class="text-sm font-semibold text-amber-900 leading-relaxed">
          Conservamos las fechas y tu grupo de <strong class="text-amber-950 font-black">{{ store.guestsCount }} personas</strong> para que selecciones tus servicios adicionales sin volver a llenar datos.
        </p>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            @click="handleGoToRestaurant"
            class="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-sm py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs touch-target active:scale-95 transition-transform"
          >
            <Utensils class="w-4 h-4 stroke-[2.5]" />
            <span>Restaurante</span>
          </button>

          <button
            type="button"
            @click="handleGoToCabana"
            class="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-sm py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-xs touch-target active:scale-95 transition-transform"
          >
            <Home class="w-4 h-4 stroke-[2.5]" />
            <span>Cabaña</span>
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