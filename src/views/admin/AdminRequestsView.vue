<script setup lang="ts">
import { ref, computed } from 'vue'
import { Inbox, Search, Plus } from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import AdminPageTitle from '../../components/admin/AdminPageTitle.vue'
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
  { id: 'pending', label: 'Pendientes', activeClass: 'bg-amber-200 text-amber-950 border-amber-600' },
  { id: 'confirmed', label: 'Confirmadas', activeClass: 'bg-status-success text-white border-status-success' },
  { id: 'rejected', label: 'Rechazadas', activeClass: 'bg-status-danger text-white border-status-danger' }
]

const typeFilters: { id: ServiceType | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'cabana', label: 'Cabaña' },
  { id: 'camping', label: 'Camping' },
  { id: 'restaurante', label: 'Restaurante' }
]
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    <AdminPageTitle
      title="Solicitudes"
      subtitle="Revisa, aprueba y registra los pagos de cada solicitud."
      :icon="Inbox"
    />

    <BaseButton variant="primary" size="md" fullWidth @click="isNewBookingModalOpen = true">
      <Plus class="w-5 h-5 mr-1.5 stroke-[3]" aria-hidden="true" /> Nueva reserva directa
    </BaseButton>

    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="f in statusFilters"
        :key="f.id"
        type="button"
        @click="filterStatus = f.id"
        :class="[
          'p-3 rounded-2xl border-2 text-center transition-all touch-target shadow-sm',
          filterStatus === f.id ? f.activeClass : 'bg-white text-gray-800 border-gray-500 hover:bg-gray-50'
        ]"
      >
        <span class="block text-2xl font-black">{{ countByStatus(f.id) }}</span>
        <span class="text-sm font-black block">{{ f.label }}</span>
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
        @open="openedRequestId = $event"
        @approve="requestsStore.confirmRequest($event)"
        @reject="openedRequestId = $event"
      />

      <div v-if="filteredRequests.length === 0" class="bg-white p-8 rounded-2xl border border-gray-500 shadow-md text-center space-y-2">
        <Inbox class="w-8 h-8 text-gray-600 mx-auto stroke-[2]" />
        <p class="text-base font-black text-gray-800">No se encontraron solicitudes con los filtros aplicados.</p>
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
