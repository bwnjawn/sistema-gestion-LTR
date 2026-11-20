<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePantallaAncha } from '../../composables/usePantallaAncha'
import { useRoute } from 'vue-router'
import { FileSpreadsheet, Inbox, Search, Layers, Home, Tent, Utensils, Waves } from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import AdminExportarExcelDialog from '../../components/admin/AdminExportarExcelDialog.vue'
import AdminRequestCard from '../../components/admin/AdminRequestCard.vue'
import AdminRequestFila from '../../components/admin/AdminRequestFila.vue'
import CargaDatosAdmin from '../../components/admin/CargaDatosAdmin.vue'
import EsqueletoSolicitudes from '../../components/admin/EsqueletoSolicitudes.vue'
import AdminRequestDetailModal from '../../components/admin/AdminRequestDetailModal.vue'
import AdminMoverFechaDialog from '../../components/admin/AdminMoverFechaDialog.vue'
import AdminConfirmarRechazoDialog from '../../components/admin/AdminConfirmarRechazoDialog.vue'
import AdminConfirmarSinAbonoDialog from '../../components/admin/AdminConfirmarSinAbonoDialog.vue'
import { getPaymentSummary } from '../../services/payments'
import { useRequestsStore } from '../../stores/requestsStore'
import { describirBloqueo } from '../../services/cruces'
import { ordenarSolicitudes } from '../../services/resumenSolicitud'
import { countByFilter, filterRequests, parseStatusFilter, type FiltroEstado } from '../../services/requestFilters'
import type { ServiceType } from '../../types/domain'

const route = useRoute()
const requestsStore = useRequestsStore()
// En PC: lista a la izquierda y detalle a la derecha; en teléfono: tarjetas y detalle en una hoja
const { esAncha } = usePantallaAncha()
const seleccionadaId = ref<string | null>(null)

// Filtros. Se abre en "Pendientes", o en el estado que pida la URL (?estado=confirmed, desde Inicio).
const filterStatus = ref<FiltroEstado | null>(parseStatusFilter(route.query.estado) ?? 'pending')
const filterType = ref<ServiceType | 'all'>('all')
const searchQuery = ref('')
// Hoja para exportar a Excel (SCRUM-275)
const exportando = ref(false)

const openedRequestId = ref<string | null>(null)
// "Mover fecha" abre su propia hoja (solo calendario y contacto); "Rechazar" pregunta directo, sin abrir el detalle
const moverId = ref<string | null>(null)
const rechazoId = ref<string | null>(null)

function abrirDetalle(id: string | null) {
  openedRequestId.value = id
}

// Pendientes cuya fecha ya ocupa una confirmada (no se aprueban, solo se mueven): id -> quién la ocupa
const bloqueos = computed(() =>
  Object.fromEntries(Object.entries(requestsStore.porMoverPorId).map(([id, lista]) => [id, describirBloqueo(lista)]))
)
const soloPorMover = ref(false)
const cantidadPorMover = computed(() => Object.keys(requestsStore.porMoverPorId).length)

// Aprobar desde la tarjeta (SCRUM-262, SCRUM-287)
// Si falta abono, primero se avisa (SCRUM-264); el admin decide si confirma igual
const sinAbonoId = ref<string | null>(null)

function aprobar(id: string) {
  // Una pendiente sobre una fecha confirmada nunca se aprueba: se mueve
  if (requestsStore.porMoverPorId[id]) {
    moverId.value = id
    return
  }
  // Si se cruza con otras, se aprueba desde el detalle: ahí se ve con qué se topa antes de decidir (SCRUM-287)
  if (requestsStore.crossedRequestsFor(id).length > 0) {
    abrirDetalle(id)
    return
  }
  const req = requestsStore.requests.find(r => r.id === id)
  if (req && getPaymentSummary(req).depositPending > 0) {
    sinAbonoId.value = id
    return
  }
  continuarAprobacion(id)
}

async function continuarAprobacion(id: string) {
  sinAbonoId.value = null
  await requestsStore.confirmRequest(id)
}

// Cuántas otras solicitudes se topan con la indicada (SCRUM-60)
function countConflictingRequests(id: string): number {
  const others = new Set<string>()
  for (const conflict of requestsStore.conflictsByRequestId[id] ?? []) {
    conflict.solicitudIds.filter(other => other !== id).forEach(other => others.add(other))
  }
  return others.size
}

const filteredRequests = computed(() => {
  const filtradas = filterRequests(requestsStore.requests, {
    status: filterStatus.value,
    type: filterType.value,
    query: searchQuery.value
  })
  const lista = soloPorMover.value ? filtradas.filter(r => !!requestsStore.porMoverPorId[r.id]) : filtradas
  // Primero lo que pide una decisión (fecha ocupada o cruces), después lo que llega antes
  const urgentes = new Set(lista.filter(r => requestsStore.porMoverPorId[r.id] || countConflictingRequests(r.id) > 0).map(r => r.id))
  return ordenarSolicitudes(lista, urgentes)
})

const counts = computed(() => countByFilter(requestsStore.requests))

// La solicitud del panel: la elegida si sigue en la lista; si no, la primera
const idEnPanel = computed(() =>
  filteredRequests.value.some(r => r.id === seleccionadaId.value) ? seleccionadaId.value : (filteredRequests.value[0]?.id ?? null)
)

// Pedida desde un aviso de cruce: se quitan los filtros para que aparezca en la lista
function abrirEnPanel(id: string) {
  filterStatus.value = null
  soloPorMover.value = false
  filterType.value = 'all'
  searchQuery.value = ''
  seleccionadaId.value = id
}

// Un toque filtra; volver a tocar el filtro activo lo quita y muestra todas.
function toggleStatus(status: FiltroEstado) {
  // Estado y "por mover" no se combinan: elegir uno quita el otro
  soloPorMover.value = false
  filterStatus.value = filterStatus.value === status ? null : status
}

const statusFilters: { id: FiltroEstado; label: string }[] = [
  { id: 'pending', label: 'Pendientes' },
  { id: 'confirmed', label: 'Confirmadas' },
  { id: 'discarded', label: 'Descartadas' }
]

// "Por mover" es un filtro más: al activarlo se quita el de estado, para que no se mezclen
function alternarPorMover() {
  soloPorMover.value = !soloPorMover.value
  if (soloPorMover.value) filterStatus.value = null
}

// Mismo orden y mismos íconos que el filtro del calendario
const typeFilters: { id: ServiceType | 'all'; label: string; icon: typeof Layers }[] = [
  { id: 'all', label: 'Todos', icon: Layers },
  { id: 'cabana', label: 'Cabañas', icon: Home },
  { id: 'camping', label: 'Camping', icon: Tent },
  { id: 'restaurante', label: 'Restaurante', icon: Utensils },
  { id: 'piscina', label: 'Piscina', icon: Waves }
]

// La búsqueda se muestra al tocar la lupa, o sola si ya hay un texto escrito
const buscando = ref(false)
const mostrarBusqueda = computed(() => buscando.value || searchQuery.value.trim() !== '')

const emptyMessage = computed(() => {
  if (requestsStore.requests.length === 0) return 'Todavía no hay solicitudes.'
  if (soloPorMover.value) return 'No hay solicitudes por mover.'
  if (filterStatus.value && !searchQuery.value.trim() && filterType.value === 'all') {
    const nombre = statusFilters.find(f => f.id === filterStatus.value)?.label ?? ''
    return `No hay solicitudes ${nombre.toLowerCase()}.`
  }
  return 'No se encontraron solicitudes con los filtros aplicados.'
})

function verTodas() {
  filterStatus.value = null
  soloPorMover.value = false
}
</script>

<template>
  <CargaDatosAdmin>
    <template #esqueleto><EsqueletoSolicitudes /></template>
  <div v-if="!esAncha" class="space-y-3 max-w-md mx-auto w-full pb-28">
    <!-- Filtros: mismo estilo que el calendario. Tocar el estado activo otra vez muestra todas. -->
    <div class="bg-white p-3 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="grid grid-cols-3 gap-1.5" role="group" aria-label="Filtrar por estado">
        <button
          v-for="f in statusFilters"
          :key="f.id"
          type="button"
          @click="toggleStatus(f.id)"
          :aria-pressed="filterStatus === f.id"
          :class="[
            'px-1.5 py-2 rounded-2xl border text-sm font-bold flex flex-col items-center justify-center gap-0.5 min-w-0 active:scale-95 transition-all touch-target shadow-2xs',
            filterStatus === f.id ? 'bg-[#c5d7be] text-brand-dark border-brand-border' : 'bg-white text-gray-700 border-gray-400'
          ]"
        >
          <span class="leading-tight">{{ f.label }}</span>
          <span :class="['shrink-0 min-w-6 px-2 rounded-full text-sm font-bold leading-6 text-center', filterStatus === f.id ? 'bg-brand-dark text-white' : 'bg-gray-200 text-gray-800']">{{ counts[f.id] }}</span>
        </button>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-2 pt-3 border-t-2 border-brand-border/40">
        <button
          v-for="t in typeFilters"
          :key="t.id"
          type="button"
          @click="filterType = t.id"
          :title="t.label"
          :aria-label="t.label"
          :aria-pressed="filterType === t.id"
          :class="[
            'rounded-2xl border active:scale-95 transition-all flex items-center justify-center gap-1.5 touch-target shadow-2xs',
            t.id === 'all' ? 'px-3 py-2 text-sm font-bold' : 'p-2',
            filterType === t.id
              ? t.id === 'all' ? 'bg-brand-dark text-white border-brand-dark' : 'bg-[#c5d7be] text-brand-dark border-brand-border'
              : 'bg-white text-gray-700 border-gray-400'
          ]"
        >
          <component :is="t.icon" class="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          <span v-if="t.id === 'all'">Todo</span>
        </button>
        <button
          type="button"
          @click="buscando = !buscando"
          aria-label="Buscar solicitudes"
          :aria-pressed="mostrarBusqueda"
          :class="[
            'p-2 rounded-2xl border active:scale-95 transition-all touch-target shadow-2xs',
            mostrarBusqueda ? 'bg-[#c5d7be] text-brand-dark border-brand-border' : 'bg-white text-gray-700 border-gray-400'
          ]"
        >
          <Search class="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>

      <div v-if="mostrarBusqueda" class="relative">
        <Search class="w-5 h-5 text-gray-700 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" aria-hidden="true" />
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Código, cliente o teléfono"
          aria-label="Buscar solicitudes"
          class="w-full pl-10 pr-3.5 py-3 rounded-2xl border-2 border-brand-border bg-brand-light text-base focus:border-brand-dark focus:outline-none"
        />
      </div>
    </div>

    <!-- Cuántas se ven y exportar a Excel (SCRUM-275) -->
    <div class="flex items-center justify-between gap-2 px-1">
      <span class="text-base text-gray-600">{{ filteredRequests.length }} {{ filteredRequests.length === 1 ? 'solicitud' : 'solicitudes' }}</span>
      <button
        type="button"
        @click="exportando = true"
        class="px-3 py-2 rounded-2xl border border-gray-400 bg-white text-base font-bold text-gray-800 flex items-center gap-1.5 active:scale-95 transition-all touch-target shadow-2xs"
      >
        <FileSpreadsheet class="w-5 h-5 stroke-[2.5]" aria-hidden="true" /> Exportar a Excel
      </button>
    </div>

    <!-- Por mover: pendientes cuya fecha ya ocupa una confirmada. Solo aparece si hay alguna. -->
    <button
      v-if="cantidadPorMover > 0 || soloPorMover"
      type="button"
      @click="alternarPorMover"
      :aria-pressed="soloPorMover"
      :class="[
        'w-full px-4 py-2.5 rounded-2xl border text-left text-base font-bold flex items-center justify-between gap-2 touch-target active:scale-[0.99] transition-all',
        soloPorMover ? 'bg-status-danger text-white border-status-danger' : 'bg-rose-50 text-rose-950 border-status-danger'
      ]"
    >
      <span>{{ cantidadPorMover }} {{ cantidadPorMover === 1 ? 'pendiente por mover' : 'pendientes por mover' }} de fecha</span>
      <span class="text-sm font-normal shrink-0">{{ soloPorMover ? 'Ver todas' : 'Ver solo estas' }}</span>
    </button>

    <div class="space-y-3">
      <AdminRequestCard
        v-for="req in filteredRequests"
        :key="req.id"
        :request="req"
        :conflict-count="countConflictingRequests(req.id)"
        :bloqueo="bloqueos[req.id]"
        @open="abrirDetalle($event)"
        @approve="aprobar($event)"
        @move="moverId = $event"
        @reject="rechazoId = $event"
      />

      <div v-if="filteredRequests.length === 0" class="bg-white p-8 rounded-3xl border-2 border-brand-border shadow-xs text-center space-y-3">
        <Inbox class="w-8 h-8 text-gray-600 mx-auto stroke-[2]" aria-hidden="true" />
        <p class="text-base text-gray-700">{{ emptyMessage }}</p>
        <BaseButton
          v-if="(filterStatus || soloPorMover) && requestsStore.requests.length > 0"
          variant="outline"
          size="md"
          @click="verTodas"
        >
          Ver todas las solicitudes
        </BaseButton>
      </div>
    </div>
  </div>

  <div v-else class="flex flex-col gap-4 h-[calc(100vh-8.5rem)] min-h-[32rem]">
    <!-- Filtros en una sola barra -->
    <div class="flex flex-wrap items-center gap-2 shrink-0" role="group" aria-label="Filtros de solicitudes">
      <button
        v-for="f in statusFilters"
        :key="f.id"
        type="button"
        :aria-pressed="filterStatus === f.id"
        :class="[
          'px-4 py-2 rounded-full border text-base flex items-center gap-2 transition-colors',
          filterStatus === f.id ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        ]"
        @click="toggleStatus(f.id)"
      >
        {{ f.label }}
        <span :class="['min-w-6 px-2 rounded-full text-sm font-bold leading-6 text-center', filterStatus === f.id ? 'bg-white/25 text-white' : 'bg-gray-100 text-gray-800']">{{ counts[f.id] }}</span>
      </button>
      <button
        v-if="cantidadPorMover > 0 || soloPorMover"
        type="button"
        :aria-pressed="soloPorMover"
        :class="[
          'px-4 py-2 rounded-full border text-base flex items-center gap-2 transition-colors',
          soloPorMover ? 'bg-status-danger text-white border-status-danger' : 'bg-rose-50 text-rose-950 border-status-danger'
        ]"
        @click="alternarPorMover"
      >
        Por mover
        <span :class="['min-w-6 px-2 rounded-full text-sm font-bold leading-6 text-center', soloPorMover ? 'bg-white/25 text-white' : 'bg-white text-rose-950']">{{ cantidadPorMover }}</span>
      </button>

      <span class="w-px h-7 bg-gray-300 mx-1" aria-hidden="true"></span>

      <button
        v-for="t in typeFilters"
        :key="t.id"
        type="button"
        :title="t.label"
        :aria-label="t.label"
        :aria-pressed="filterType === t.id"
        :class="[
          'h-10 rounded-xl border flex items-center justify-center gap-1.5 transition-colors',
          t.id === 'all' ? 'px-3 text-base' : 'w-10',
          filterType === t.id ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
        ]"
        @click="filterType = t.id"
      >
        <component :is="t.icon" class="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
        <span v-if="t.id === 'all'">Todo</span>
      </button>

      <div class="ml-auto flex items-center gap-2">
        <div class="relative">
          <Search class="w-5 h-5 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Código, cliente o teléfono"
            aria-label="Buscar solicitudes"
            class="w-60 pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 bg-white text-base focus:border-brand-dark focus:outline-none"
          />
        </div>
        <button
          type="button"
          class="h-10 px-4 rounded-xl border border-gray-300 bg-white text-base font-bold text-gray-800 flex items-center gap-2 hover:bg-gray-50"
          @click="exportando = true"
        >
          <FileSpreadsheet class="w-5 h-5 stroke-[2.5]" aria-hidden="true" /> Exportar a Excel
        </button>
      </div>
    </div>

    <div class="grid grid-cols-[26rem_minmax(0,1fr)] gap-5 grow min-h-0">
      <!-- Lista -->
      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-y-auto p-2 space-y-1">
        <p class="px-3 pt-2 pb-1 text-sm text-gray-600">{{ filteredRequests.length }} {{ filteredRequests.length === 1 ? 'solicitud' : 'solicitudes' }}</p>
        <AdminRequestFila
          v-for="req in filteredRequests"
          :key="req.id"
          :request="req"
          :seleccionada="req.id === idEnPanel"
          :conflict-count="countConflictingRequests(req.id)"
          :bloqueo="bloqueos[req.id]"
          @select="seleccionadaId = $event"
        />
        <div v-if="filteredRequests.length === 0" class="p-6 text-center space-y-3">
          <Inbox class="w-8 h-8 text-gray-600 mx-auto stroke-[2]" aria-hidden="true" />
          <p class="text-base text-gray-700">{{ emptyMessage }}</p>
          <BaseButton v-if="(filterStatus || soloPorMover) && requestsStore.requests.length > 0" variant="outline" size="md" @click="verTodas">
            Ver todas las solicitudes
          </BaseButton>
        </div>
      </div>

      <!-- Detalle de la solicitud elegida -->
      <AdminRequestDetailModal
        v-if="idEnPanel"
        en-panel
        :request-id="idEnPanel"
        @close="seleccionadaId = null"
        @open-request="abrirEnPanel($event)"
      />
      <div v-else class="bg-white rounded-2xl border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 text-base">
        Elige una solicitud de la lista para ver su detalle.
      </div>
    </div>
  </div>

  <!-- Compartido por teléfono y PC -->
  <AdminRequestDetailModal v-if="!esAncha" :request-id="openedRequestId" @close="abrirDetalle(null)" @open-request="abrirDetalle($event)" />
  <AdminConfirmarSinAbonoDialog :request-id="sinAbonoId" @confirm="continuarAprobacion" @close="sinAbonoId = null" />
  <AdminMoverFechaDialog :request-id="moverId" @close="moverId = null" />
  <AdminExportarExcelDialog :abierto="exportando" :visibles="filteredRequests" @close="exportando = false" />
  <AdminConfirmarRechazoDialog :request-id="rechazoId" @close="rechazoId = null" />
  </CargaDatosAdmin>
</template>
