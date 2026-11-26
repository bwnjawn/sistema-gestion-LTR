<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ClientHeader from '../components/ui/ClientHeader.vue'
import MarcoApp from '../components/ui/MarcoApp.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import FranjaModoAdmin from '../components/ui/FranjaModoAdmin.vue'
import ModalAyuda from '../components/ui/ModalAyuda.vue'
import ResumenReservaLateral from '../components/ui/ResumenReservaLateral.vue'
import { ayudaDelPaso } from '../components/ui/ayudasCliente'
import { useSalidaReserva } from '../composables/useSalidaReserva'
import { useReservationStore } from '../stores/reservationStore'
import HojaModal from '../components/ui/HojaModal.vue'
import { WIZARD_STEPS } from '../services/wizard'
import type { ServiceType } from '../types/domain'

// Marco común de los pasos de reserva: encabezado con atrás, servicio, paso y salir.
const route = useRoute()
const router = useRouter()
const store = useReservationStore()

const NOMBRE_SERVICIO: Record<ServiceType, string> = {
  cabana: 'Cabaña',
  camping: 'Camping',
  restaurante: 'Restaurante',
  piscina: 'Piscina'
}
// Prefijo del nombre de ruta de cada flujo (cabana-step2, restaurant-step2...)
const PREFIJO_RUTA: Record<ServiceType, string> = {
  cabana: 'cabana-step',
  camping: 'camping-step',
  restaurante: 'restaurant-step',
  piscina: 'piscina-step'
}

const servicio = computed(() => (route.meta.servicio as ServiceType | undefined) ?? 'cabana')
const paso = computed(() => (route.meta.paso as number | undefined) ?? 1)
const pasos = computed(() => WIZARD_STEPS[servicio.value])

// El último paso ya es el resumen completo: ahí no va el panel lateral
const sinResumen = computed(() => store.solicitudEnviada || paso.value >= pasos.value.length)

const titulo = computed(() => (store.solicitudEnviada ? 'Solicitud enviada' : NOMBRE_SERVICIO[servicio.value]))
const subtitulo = computed(() => {
  if (store.solicitudEnviada) return undefined
  const actual = pasos.value.find(p => p.id === paso.value)
  return `Paso ${paso.value} de ${pasos.value.length}${actual ? ' · ' + actual.label : ''}`
})

function volver() {
  if (paso.value <= 1) {
    // El administrador no deja borrador: se pregunta o se sale directo
    if (store.isAdminMode) {
      cerrar()
      return
    }
    // Desde el primer paso se vuelve al inicio y el borrador se conserva
    router.push('/')
    return
  }
  store.prevStep()
  router.push({ name: PREFIJO_RUTA[servicio.value] + (paso.value - 1) })
}

// Ayuda del paso actual (ver `ayudasCliente.ts`). El administrador no ve las ayudas del cliente.
const ayudaAbierta = ref(false)
const ayuda = computed(() =>
  store.isAdminMode || store.solicitudEnviada ? null : ayudaDelPaso(servicio.value, paso.value, pasos.value.length)
)
const conAyuda = computed(() => ayuda.value !== null)

// Salir: si ya hay datos se pregunta si guardarlos o borrarlos
const confirmando = ref(false)

const { terminar: salirAlPanel } = useSalidaReserva()

function cerrar() {
  if (store.isAdminMode && !store.tieneBorrador) {
    salirAlPanel()
  } else if (store.tieneBorrador) {
    confirmando.value = true
  } else {
    router.push('/')
  }
}

function salirGuardando() {
  confirmando.value = false
  router.push('/')
}

function salirBorrando() {
  confirmando.value = false
  if (store.isAdminMode) {
    salirAlPanel()
    return
  }
  store.resetStore()
  router.push('/')
}
</script>

<template>
  <MarcoApp class="bg-brand-light">
    <template #encabezado>
      <ClientHeader
        :titulo="titulo"
        :subtitulo="subtitulo"
        :con-volver="!store.solicitudEnviada"
        :con-cerrar="!store.solicitudEnviada"
        :con-ayuda="conAyuda"
        @ayuda="ayudaAbierta = true"
        @volver="volver"
        @cerrar="cerrar"
      />

      <FranjaModoAdmin v-if="store.isAdminMode && !store.solicitudEnviada" />
    </template>

    <!-- En PC, el resumen de la reserva va fijo a la derecha del paso -->
    <main class="px-4 lg:px-8 pt-4 lg:pt-8">
      <div :class="['lg:max-w-5xl lg:mx-auto', sinResumen ? '' : 'lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-8 lg:items-start']">
        <RouterView />
        <ResumenReservaLateral v-if="!sinResumen" />
      </div>
    </main>

    <ModalAyuda v-if="ayuda" :abierto="ayudaAbierta" :titulo="ayuda.titulo" @cerrar="ayudaAbierta = false">
      <component :is="ayuda.contenido" />
    </ModalAyuda>

    <!-- Confirmación al salir con datos escritos -->
    <HojaModal :abierto="confirmando" titulo="¿Salir de la reserva?" ocultar-cierre @cerrar="confirmando = false">
      <p class="text-base text-gray-700">
        {{ store.isAdminMode
          ? 'Ya cargaste algunos datos. Si sales, se borran.'
          : 'Ya elegiste algunos datos. Puedes guardarlos para seguir después o borrarlos.' }}
      </p>
      <template #pie>
        <div class="space-y-2.5">
          <BaseButton variant="primary" size="lg" full-width @click="confirmando = false">
            Seguir reservando
          </BaseButton>
          <BaseButton v-if="!store.isAdminMode" variant="outline" size="lg" full-width @click="salirGuardando">
            Salir y guardar
          </BaseButton>
          <BaseButton variant="danger" size="lg" full-width @click="salirBorrando">
            Salir y borrar
          </BaseButton>
        </div>
      </template>
    </HojaModal>
  </MarcoApp>
</template>
