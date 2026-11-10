<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Inbox, Search, Plus, Clock, CheckCircle2, XCircle } from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import AdminNewBookingModal from '../../components/admin/AdminNewBookingModal.vue'
import AdminRequestCard from '../../components/admin/AdminRequestCard.vue'
import AdminRequestDetailModal from '../../components/admin/AdminRequestDetailModal.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { STATUS_LABELS } from '../../services/requests'
import { countByStatus, filterRequests, parseStatusFilter } from '../../services/requestFilters'
import type { BookingStatus, ServiceType } from '../../types/domain'

const route = useRoute()
const requestsStore = useRequestsStore()

// Filtros. Se abre en "Pendientes", o en el estado que pida la URL (?estado=confirmed, desde Inicio).
const filterStatus = ref<BookingStatus | null>(parseStatusFilter(route.query.estado) ?? 'pending')
const filterType = ref<ServiceType | 'all'>('all')
const searchQuery = ref('')

const isNewBookingModalOpen = ref(false)
const openedRequestId = ref<string | null>(null)

// Cuántas otras solicitudes se topan con la indicada (SCRUM-60)
function countConflictingRequests(id: string): number {
  const others = new Set<string>()
  for (const conflict of requestsStore.conflictsByRequestId[id] ?? []) {
    conflict.solicitudIds.filter(other => other !== id).forEach(other => others.add(other))
  }
  return others.size
}

const filteredRequests = computed(() =>
  filterRequests(requestsStore.requests, {
    status: filterStatus.value,
    type: filterType.value,
    query: searchQuery.value
  })
)

const counts = computed(() => countByStatus(requestsStore.requests))

// Un toque filtra; volver a tocar el filtro activo lo quita y muestra todas.
function toggleStatus(status: BookingStatus) {
  filterStatus.value = filterStatus.value === status ? null : status
}

const statusFilters = [
  { id: 'pending', label: 'Pendientes', icon: Clock, activeClass: 'bg-amber-200 text-amber-950 border-amber-600' },
  { id: 'confirmed', label: 'Confirmadas', icon: CheckCircle2, activeClass: 'bg-status-success text-white border-status-success' },
  { id: 'rejected', label: 'Rechazadas', icon: XCircle, activeClass: 'bg-status-danger text-white border-status-danger' }
] as const

const typeFilters: { id: ServiceType | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'cabana', label: 'Cabaña' },
  { id: 'camping', label: 'Camping' },
  { id: 'restaurante', label: 'Restaurante' }
]

const emptyMessage = computed(() => {
  if (requestsStore.requests.length === 0) return 'Todavía no hay solicitudes.'
  if (filterStatus.value && !searchQuery.value.trim() && filterType.value === 'all') {
    const nombre = statusFilters.find(f => f.id === filterStatus.value)?.label ?? STATUS_LABELS[filterStatus.value]
    return `No hay solicitudes ${nombre.toLowerCase()}.`
  }
  return 'No se encontraron solicitudes con los filtros aplicados.'
})
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    <BaseButton variant="primary" size="md" fullWidth @click="isNewBookingModalOpen = true">
      <Plus class="w-5 h-5 mr-1.5 stroke-[3]" aria-hidden="true" /> Nueva reserva directa
    </BaseButton>

    <!-- Filtros por estado, en una sola línea. Tocar el activo otra vez muestra todas. -->
    <div class="grid grid-cols-3 gap-2" role="group" aria-label="Filtrar por estado">
      <button
        v-for="f in statusFilters"
        :key="f.id"
        type="button"
        @click="toggleStatus(f.id)"
        :aria-pressed="filterStatus === f.id"
        :class="[
          'px-1.5 py-2.5 rounded-2xl border-2 text-center transition-all touch-target shadow-sm min-w-0',
          filterStatus === f.id ? f.activeClass : 'bg-white text-gray-800 border-gray-500 hover:bg-gray-50'
        ]"
      >
        <span class="flex items-center justify-center gap-1.5">
          <component :is="f.icon" class="w-5 h-5 stroke-[2.5] shrink-0" aria-hidden="true" />
          <span class="text-2xl font-black leading-none">{{ counts[f.id] }}</span>
        </span>
        <span class="text-sm font-black block mt-1 whitespace-nowrap">{{ f.label }}</span>
      </button>
    </div>

    <div class="bg-white p-4 rounded-2xl border border-gray-500 shadow-md space-y-3">
      <div class="relative">
        <Search class="w-4 h-4 text-gray-700 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Buscar por código, cliente o teléfono"
          aria-label="Buscar solicitudes"
          class="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-gray-500 bg-white font-bold text-base focus:border-brand-dark focus:outline-none"
        />
      </div>

      <div class="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl border border-gray-400 text-sm font-black">
        <button
          v-for="t in typeFilters"
          :key="t.id"
          type="button"
          @click="filterType = t.id"
          :aria-pressed="filterType === t.id"
          :class="['py-2.5 rounded-lg transition-all border-2', filterType === t.id ? 'bg-brand-dark text-white border-brand-dark' : 'bg-white text-gray-800 border-transparent']"
        >
          {{ t.label }}
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <AdminRequestCard
        v-for="req in filteredRequests"
        :key="req.id"
        :request="req"
        :conflict-count="countConflictingRequests(req.id)"
        @open="openedRequestId = $event"
        @approve="requestsStore.confirmRequest($event)"
        @reject="openedRequestId = $event"
      />

      <div v-if="filteredRequests.length === 0" class="bg-white p-8 rounded-2xl border border-gray-500 shadow-md text-center space-y-3">
        <Inbox class="w-8 h-8 text-gray-600 mx-auto stroke-[2]" aria-hidden="true" />
        <p class="text-base font-black text-gray-800">{{ emptyMessage }}</p>
        <BaseButton
          v-if="filterStatus && requestsStore.requests.length > 0"
          variant="outline"
          size="md"
          @click="filterStatus = null"
        >
          Ver todas las solicitudes
        </BaseButton>
      </div>
    </div>

    <AdminRequestDetailModal :request-id="openedRequestId" @close="openedRequestId = null" @open-request="openedRequestId = $event" />

    <AdminNewBookingModal
      :is-open="isNewBookingModalOpen"
      @close="isNewBookingModalOpen = false"
      @created="filterStatus = null"
    />
  </div>
</template>
