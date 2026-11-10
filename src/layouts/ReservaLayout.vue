<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ClientHeader from '../components/ui/ClientHeader.vue'
import BaseButton from '../components/ui/BaseButton.vue'
import FranjaModoAdmin from '../components/ui/FranjaModoAdmin.vue'
import { useSalidaReserva } from '../composables/useSalidaReserva'
import { useReservationStore } from '../stores/reservationStore'
import { useBloqueoScroll } from '../composables/useBloqueoScroll'
import { WIZARD_STEPS } from '../services/wizard'
import type { ServiceType } from '../types/domain'

// Marco común de los pasos de reserva: encabezado con atrás, servicio, paso y salir.
const route = useRoute()
const router = useRouter()
const store = useReservationStore()

const NOMBRE_SERVICIO: Record<ServiceType, string> = {
  cabana: 'Cabaña',
  camping: 'Camping',
  restaurante: 'Restaurante'
}
// Prefijo del nombre de ruta de cada flujo (cabana-step2, restaurant-step2...)
const PREFIJO_RUTA: Record<ServiceType, string> = {
  cabana: 'cabana-step',
  camping: 'camping-step',
  restaurante: 'restaurant-step'
}

const servicio = computed(() => (route.meta.servicio as ServiceType | undefined) ?? 'cabana')
const paso = computed(() => (route.meta.paso as number | undefined) ?? 1)
const pasos = computed(() => WIZARD_STEPS[servicio.value])

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

// Salir: si ya hay datos se pregunta si guardarlos o borrarlos
const confirmando = ref(false)
useBloqueoScroll(confirmando)

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
  <div class="min-h-screen bg-brand-light">
    <ClientHeader
      :titulo="titulo"
      :subtitulo="subtitulo"
      :con-volver="!store.solicitudEnviada"
      :con-cerrar="!store.solicitudEnviada"
      @volver="volver"
      @cerrar="cerrar"
    />

    <FranjaModoAdmin v-if="store.isAdminMode && !store.solicitudEnviada" />

    <main class="px-4 pt-4">
      <RouterView />
    </main>

    <!-- Confirmación al salir con datos escritos -->
    <div
      v-if="confirmando"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="confirmando = false"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-salir"
        class="bg-white w-full max-w-sm rounded-3xl border-2 border-brand-border shadow-2xl p-5 space-y-4 max-h-[90dvh] overflow-y-auto"
      >
        <div class="space-y-1">
          <h2 id="titulo-salir" class="text-xl font-black text-brand-dark">¿Salir de la reserva?</h2>
          <p class="text-base font-bold text-gray-700">
            {{ store.isAdminMode
              ? 'Ya cargaste algunos datos. Si sales, se borran.'
              : 'Ya elegiste algunos datos. Puedes guardarlos para seguir después o borrarlos.' }}
          </p>
        </div>
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
      </div>
    </div>
  </div>
</template>
