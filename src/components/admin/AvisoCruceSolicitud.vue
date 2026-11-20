<script setup lang="ts">
// Bloque del detalle de una solicitud que explica con qué se topa y qué conviene hacer (SCRUM-287).
// Plegable: la franja de arriba resume y, al abrirla, se ve la comparación para decidir.
// Distinción de filas: la solicitud actual lleva etiqueta oscura; la confirmada, barra verde; la pendiente, ninguna marca.
import { computed, ref } from 'vue'
import { ArrowLeftRight, ChevronDown, ChevronRight, TriangleAlert } from 'lucide-vue-next'
import EstadoSolicitud from './EstadoSolicitud.vue'
import { unirNombres, type FilaCruce, type ResumenCruce } from '../../services/resumenCruce'

const props = defineProps<{ resumen: ResumenCruce }>()

const emit = defineEmits<{
  (e: 'open-request', id: string): void
}>()

// Las demás solicitudes que se muestran sin pedir "ver más"
const MAX_FILAS = 4

const duro = computed(() => props.resumen.nivel === 'bloqueo' || props.resumen.nivel === 'sin-conexion')
// Con pocas solicitudes el bloque viene abierto; con muchas, plegado para no empujar el resto del detalle
const abierto = ref(props.resumen.otras.length <= MAX_FILAS)
const verTodas = ref(false)

const visibles = computed(() => (verTodas.value ? props.resumen.otras : props.resumen.otras.slice(0, MAX_FILAS)))
const ocultas = computed(() => props.resumen.otras.length - visibles.value.length)
const personasOcultas = computed(() => props.resumen.otras.slice(MAX_FILAS).reduce((total, f) => total + f.personas, 0))

function textoAbono(fila: FilaCruce): string {
  if (fila.abono === 'pagado') return 'abono pagado'
  return fila.abono === 'no-exige' ? 'no exige abono' : 'abono pendiente'
}

function textoPisan(fila: FilaCruce): string {
  if (fila.nochesQueSePisan <= 0) return ''
  return ` · se pisan ${fila.nochesQueSePisan} ${fila.nochesQueSePisan === 1 ? 'noche' : 'noches'}`
}

function marcaDeFila(fila: FilaCruce): string {
  if (fila.esLaPropia) return 'border-gray-800 bg-gray-100'
  return fila.estado === 'confirmed' ? 'border-status-success bg-emerald-50' : 'border-transparent bg-white'
}

const sinLugar = computed(() => unirNombres(props.resumen.siApruebas?.sinLugar ?? []))
const siguenCabiendo = computed(() => unirNombres(props.resumen.siApruebas?.siguenCabiendo ?? []))
</script>

<template>
  <section :class="['border-2 rounded-2xl bg-white', duro ? 'border-rose-300' : 'border-gray-300']">
    <!-- Franja: siempre visible -->
    <button
      type="button"
      :aria-expanded="abierto"
      :class="['w-full flex items-center gap-2.5 px-3 py-3 text-left touch-target', duro ? 'text-rose-950' : 'text-gray-900']"
      @click="abierto = !abierto"
    >
      <TriangleAlert v-if="duro" class="w-5 h-5 shrink-0 stroke-[2.5]" aria-hidden="true" />
      <ArrowLeftRight v-else class="w-5 h-5 shrink-0 stroke-[2.5]" aria-hidden="true" />
      <span class="flex-1 min-w-0">
        <span class="block text-base font-bold">{{ resumen.titulo }}</span>
        <span class="block text-sm text-gray-700 truncate">{{ resumen.subtitulo }}</span>
      </span>
      <span class="text-sm font-bold underline">{{ abierto ? 'Ocultar' : 'Ver' }}</span>
      <ChevronDown :class="['w-5 h-5 shrink-0 transition-transform', abierto ? 'rotate-180' : '']" aria-hidden="true" />
    </button>

    <div v-if="abierto" class="px-3 pb-3 pt-3 space-y-3 border-t border-gray-200">
      <p class="text-base text-gray-900">{{ resumen.frase }}</p>

      <!-- Cupo (restaurante y camping): lo que hay, lo ya confirmado y lo que queda -->
      <div v-if="resumen.cupo.length === 1" class="rounded-xl border border-gray-300 p-3">
        <p class="text-sm font-bold text-gray-900 mb-1.5">{{ resumen.cupo[0].cuando }}</p>
        <div class="grid grid-cols-3 text-center">
          <div><p class="text-xl font-bold text-gray-900">{{ resumen.cupo[0].limite }}</p><p class="text-sm text-gray-600">Cupo</p></div>
          <div><p class="text-xl font-bold text-gray-900">{{ resumen.cupo[0].confirmadas }}</p><p class="text-sm text-gray-600">Ya confirmadas</p></div>
          <div><p class="text-xl font-bold text-gray-900">{{ resumen.cupo[0].libres }}</p><p class="text-sm text-gray-600">Libres</p></div>
        </div>
      </div>
      <div v-else-if="resumen.cupo.length > 1" class="rounded-xl border border-gray-300 divide-y divide-gray-200">
        <div v-for="linea in resumen.cupo" :key="linea.cuando" class="px-3 py-2">
          <p class="text-base font-bold text-gray-900">{{ linea.cuando }}</p>
          <p class="text-sm text-gray-700">{{ linea.pedidas }} pedidas · cupo {{ linea.limite }} · confirmadas {{ linea.confirmadas }} · libres {{ linea.libres }}</p>
        </div>
      </div>

      <!-- Las solicitudes, con lo necesario para comparar -->
      <div class="rounded-xl border border-gray-300 overflow-hidden divide-y divide-gray-200 bg-white">
        <template v-for="fila in [resumen.propia, ...visibles]" :key="fila.id">
          <component
            :is="fila.esLaPropia ? 'div' : 'button'"
            :type="fila.esLaPropia ? undefined : 'button'"
            :class="['w-full text-left flex items-center gap-2 px-3 py-2.5 border-l-4', marcaDeFila(fila)]"
            @click="!fila.esLaPropia && emit('open-request', fila.id)"
          >
            <span class="min-w-0 flex-1">
              <span v-if="fila.esLaPropia" class="inline-block mb-0.5 rounded bg-gray-800 text-white text-xs font-bold px-1.5 py-0.5 uppercase tracking-wide">Esta solicitud</span>
              <span class="block text-base font-bold text-gray-900 truncate">{{ fila.nombre }}</span>
              <span class="block text-sm text-gray-800">{{ fila.fechas }} · {{ fila.personas }} personas</span>
              <span class="block text-sm text-gray-700">
                <span :class="fila.abono === 'pendiente' ? 'font-bold text-gray-900' : ''">{{ textoAbono(fila) }}</span>
                · llegó {{ fila.llegada }}{{ textoPisan(fila) }}
              </span>
            </span>
            <span class="shrink-0 flex items-center gap-1">
              <EstadoSolicitud :status="fila.estado" />
              <ChevronRight v-if="!fila.esLaPropia" class="w-4 h-4 text-gray-500" aria-hidden="true" />
            </span>
          </component>
        </template>
        <button v-if="ocultas > 0" type="button" class="w-full py-2.5 text-sm font-bold text-gray-900 underline" @click="verTodas = true">
          Ver las {{ ocultas }} restantes<template v-if="resumen.cupo.length > 0"> ({{ personasOcultas }} personas)</template>
        </button>
        <button v-else-if="verTodas && resumen.otras.length > MAX_FILAS" type="button" class="w-full py-2.5 text-sm font-bold text-gray-900 underline" @click="verTodas = false">
          Mostrar menos
        </button>
      </div>

      <!-- Qué pasa con las demás si se aprueba esta -->
      <div v-if="resumen.siApruebas && (sinLugar || siguenCabiendo)" class="rounded-xl bg-gray-50 border border-gray-200 p-3 space-y-1 text-base text-gray-900">
        <p class="font-bold">Si apruebas esta</p>
        <template v-if="resumen.siApruebas.porCupo">
          <p v-if="siguenCabiendo">Siguen cabiendo (de a una): <b>{{ siguenCabiendo }}</b>.</p>
          <p v-if="sinLugar">Se quedan sin lugar: <b>{{ sinLugar }}</b>.</p>
        </template>
        <p v-else>No se podrán aprobar: <b>{{ sinLugar }}</b>.</p>
        <p class="text-sm text-gray-700">Al aprobar, se abre una ventana para avisarles o cambiarles la fecha.</p>
      </div>

      <!-- Qué hacer ahora, cuando no se puede aprobar -->
      <div v-if="duro" class="rounded-xl bg-gray-50 border border-gray-200 p-3 space-y-1 text-base text-gray-900">
        <p class="font-bold">Qué hacer ahora</p>
        <p>Contacta al cliente y muévela de fecha, o recházala.</p>
        <p v-if="resumen.paraMover" class="text-gray-800">{{ resumen.paraMover }}</p>
      </div>

    </div>
  </section>
</template>
