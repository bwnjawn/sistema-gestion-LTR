<script setup lang="ts">
import { ref, computed } from 'vue'
import { Inbox, Search, Plus } from 'lucide-vue-next'
import AdminNewBookingModal from '../../components/admin/AdminNewBookingModal.vue'
import AdminRequestCard from '../../components/admin/AdminRequestCard.vue'
import AdminRequestDetailModal from '../../components/admin/AdminRequestDetailModal.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import type { BookingStatus, ServiceType } from '../../types/domain'

const requestsStore = useRequestsStore()

// Filtros
const filterStatus = ref<BookingStatus | 'all'>('pending')
const filterType = ref<ServiceType | 'all'>('all')
const searchQuery = ref('')

const isNewBookingModalOpen = ref(false)
const openedRequestId = ref<string | null>(null)

const filteredRequests = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  return requestsStore.requests.filter(req => {
    if (filterStatus.value !== 'all' && req.status !== filterStatus.value) return false
    if (filterType.value !== 'all' && req.type !== filterType.value) return false
    if (!q) return true
    return [req.requestCode, req.clientName, req.clientPhone, req.resourceName]
      .some(field => (field || '').toLowerCase().includes(q))
  })
})

function countByStatus(status: BookingStatus): number {
  return requestsStore.requests.filter(r => r.status === status).length
}

const statusFilters: { id: BookingStatus; label: string; activeClass: string }[] = [
  { id: 'pending', label: 'Pendientes', activeClass: 'bg-amber-400 text-amber-950 border-amber-500' },
  { id: 'confirmed', label: 'Confirmadas', activeClass: 'bg-emerald-600 text-white border-emerald-700' },
  { id: 'rejected', label: 'Rechazadas', activeClass: 'bg-rose-600 text-white border-rose-700' }
]

const typeFilters: { id: ServiceType | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'cabana', label: 'Cabaña' },
  { id: 'camping', label: 'Camping' },
  { id: 'restaurante', label: 'Restorán' }
]
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    <div class="bg-brand-dark text-white p-5 rounded-3xl border-2 border-brand-border shadow-sm flex items-center justify-between">
      <div>
        <span class="text-xs font-black text-emerald-300 uppercase tracking-wider block">Administración Los Troncos de Repil</span>
        <h1 class="text-xl font-black tracking-tight">Gestión de Solicitudes</h1>
      </div>
      <button
        type="button"
        @click="isNewBookingModalOpen = true"
        class="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm flex items-center gap-1 shadow-md active:scale-95 transition-transform touch-target"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" /> Nueva
      </button>
    </div>

    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="f in statusFilters"
        :key="f.id"
        type="button"
        @click="filterStatus = f.id"
        :class="[
          'p-3 rounded-2xl border-2 text-center transition-all touch-target',
          filterStatus === f.id ? f.activeClass : 'bg-white text-gray-700 border-brand-border hover:bg-gray-50'
        ]"
      >
        <span class="block text-2xl font-black">{{ countByStatus(f.id) }}</span>
        <span class="text-xs font-extrabold uppercase tracking-tight block">{{ f.label }}</span>
      </button>
    </div>

    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-sm space-y-3">
      <div class="relative">
        <Search class="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Buscar por código, cliente o teléfono"
          aria-label="Buscar solicitudes"
          class="w-full pl-10 pr-3.5 py-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-sm focus:bg-white focus:border-brand-dark focus:outline-none"
        />
      </div>

      <div class="grid grid-cols-4 gap-1.5 p-1 bg-brand-light rounded-xl border border-brand-border text-xs font-black">
        <button
          v-for="t in typeFilters"
          :key="t.id"
          type="button"
          @click="filterType = t.id"
          :class="['py-2 rounded-lg transition-all', filterType === t.id ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-600']"
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
        @open="openedRequestId = $event"
        @approve="requestsStore.confirmRequest($event)"
        @reject="openedRequestId = $event"
      />

      <div v-if="filteredRequests.length === 0" class="bg-white p-8 rounded-3xl border-2 border-brand-border text-center space-y-2">
        <Inbox class="w-8 h-8 text-gray-400 mx-auto stroke-[2]" />
        <p class="text-sm font-extrabold text-gray-600">No se encontraron solicitudes con los filtros aplicados.</p>
      </div>
    </div>

    <AdminRequestDetailModal :request-id="openedRequestId" @close="openedRequestId = null" />

    <AdminNewBookingModal
      :is-open="isNewBookingModalOpen"
      @close="isNewBookingModalOpen = false"
      @created="filterStatus = 'all'"
    />
  </div>
</template>
