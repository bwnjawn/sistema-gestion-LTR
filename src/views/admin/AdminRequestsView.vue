<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Inbox, Calendar, Users, Building2, Tent, Utensils, 
  Check, X, Search, Phone, Mail, Clock, 
  FileText, CheckCircle2, XCircle, AlertCircle
} from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseAlert from '../../components/ui/BaseAlert.vue'
import AdminBottomNav from '../../components/admin/AdminBottomNav.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { formatCLP } from '../../lib/format'

const router = useRouter()
const requestsStore = useRequestsStore()

// Filtros de Solicitudes
const filterStatus = ref<'all' | 'pending' | 'confirmed' | 'rejected'>('pending')
const filterType = ref<'all' | 'cabana' | 'camping' | 'restaurante'>('all')
const searchQuery = ref('')

// Modal de Detalle
const selectedRequest = ref<any | null>(null)
const isDetailModalOpen = ref(false)

// Solicitudes Filtradas
const filteredRequests = computed(() => {
  return requestsStore.requests.filter(req => {
    // 1. Filtro por Estado
    if (filterStatus.value !== 'all') {
      if (filterStatus.value === 'pending' && req.status !== 'pending') return false
      if (filterStatus.value === 'confirmed' && req.status !== 'confirmed') return false
      if (filterStatus.value === 'rejected' && req.status !== 'rejected') return false
    }

    // 2. Filtro por Tipo de Servicio
    if (filterType.value !== 'all') {
      const reqType = (req.type || '').toLowerCase()
      if (filterType.value === 'restaurante' && reqType !== 'restaurante' && reqType !== 'restaurant') return false
      if (filterType.value === 'cabana' && reqType !== 'cabana' && reqType !== 'cabaña') return false
      if (filterType.value === 'camping' && reqType !== 'camping') return false
    }

    // 3. Filtro por Búsqueda (Nombre, código, teléfono o recurso)
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim()
      const codeMatch = (req.requestCode || '').toLowerCase().includes(q)
      const nameMatch = (req.clientName || '').toLowerCase().includes(q)
      const phoneMatch = (req.clientPhone || '').toLowerCase().includes(q)
      const resourceMatch = (req.resourceName || '').toLowerCase().includes(q)
      return codeMatch || nameMatch || phoneMatch || resourceMatch
    }

    return true
  })
})

// Métricas Rápidas
const pendingCount = computed(() => requestsStore.requests.filter(r => r.status === 'pending').length)
const confirmedCount = computed(() => requestsStore.requests.filter(r => r.status === 'confirmed').length)
const rejectedCount = computed(() => requestsStore.requests.filter(r => r.status === 'rejected').length)

function openDetailModal(req: any) {
  selectedRequest.value = req
  isDetailModalOpen.value = true
}

function closeDetailModal() {
  isDetailModalOpen.value = false
  selectedRequest.value = null
}

function handleConfirm(id: string) {
  requestsStore.confirmRequest(id)
  if (selectedRequest.value && selectedRequest.value.id === id) {
    selectedRequest.value.status = 'confirmada'
  }
}

function handleReject(id: string) {
  requestsStore.rejectRequest(id)
  if (selectedRequest.value && selectedRequest.value.id === id) {
    selectedRequest.value.status = 'rechazada'
  }
}

function getServiceBadgeClass(type: string) {
  const t = (type || '').toLowerCase()
  if (t === 'cabana' || t === 'cabaña') return 'bg-amber-100 text-amber-950 border-amber-300'
  if (t === 'camping') return 'bg-emerald-100 text-emerald-950 border-emerald-300'
  return 'bg-sky-100 text-sky-950 border-sky-300'
}

function getServiceIcon(type: string) {
  const t = (type || '').toLowerCase()
  if (t === 'cabana' || t === 'cabaña') return Building2
  if (t === 'camping') return Tent
  return Utensils
}

function getStatusBadgeClass(status: string) {
  if (status === 'confirmada') return 'bg-emerald-500 text-white font-black'
  if (status === 'rechazada') return 'bg-rose-500 text-white font-black'
  return 'bg-amber-400 text-amber-950 font-black'
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length < 3) return dateStr
  const [, m, d] = parts.map(Number)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${d} ${months[m - 1]}`
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    
    <!-- Encabezado del Dashboard Admin -->
    <div class="bg-brand-dark text-white p-5 rounded-3xl border-2 border-brand-border shadow-sm flex items-center justify-between">
      <div>
        <span class="text-[10px] font-black text-emerald-300 uppercase tracking-wider block">
          Administración Los Troncos de Repil
        </span>
        <h1 class="text-xl font-black tracking-tight">Gestión de Solicitudes</h1>
      </div>
      <div class="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
        <Inbox class="w-5 h-5 text-emerald-300 stroke-[2.5]" />
      </div>
    </div>

    <!-- Métricas Rápidas -->
    <div class="grid grid-cols-3 gap-2">
      <button 
        type="button"
        @click="filterStatus = 'pending'"
        :class="[
          'p-3 rounded-2xl border-2 text-center transition-all touch-target',
          filterStatus === 'pending'
            ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs'
            : 'bg-white text-gray-700 border-brand-border hover:bg-gray-50'
        ]"
      >
        <span class="block text-2xl font-black">{{ pendingCount }}</span>
        <span class="text-[10px] font-extrabold uppercase tracking-tight block">Pendientes</span>
      </button>

      <button 
        type="button"
        @click="filterStatus = 'confirmed'"
        :class="[
          'p-3 rounded-2xl border-2 text-center transition-all touch-target',
          filterStatus === 'confirmed'
            ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
            : 'bg-white text-gray-700 border-brand-border hover:bg-gray-50'
        ]"
      >
        <span class="block text-2xl font-black">{{ confirmedCount }}</span>
        <span class="text-[10px] font-extrabold uppercase tracking-tight block">Confirmadas</span>
      </button>

      <button 
        type="button"
        @click="filterStatus = 'rejected'"
        :class="[
          'p-3 rounded-2xl border-2 text-center transition-all touch-target',
          filterStatus === 'rejected'
            ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
            : 'bg-white text-gray-700 border-brand-border hover:bg-gray-50'
        ]"
      >
        <span class="block text-2xl font-black">{{ rejectedCount }}</span>
        <span class="text-[10px] font-extrabold uppercase tracking-tight block">Rechazadas</span>
      </button>
    </div>

    <!-- Barra de Búsqueda y Filtros de Tipo -->
    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <!-- Input Búsqueda -->
      <div class="relative">
        <Search class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
        <input 
          type="text"
          v-model="searchQuery"
          placeholder="Buscar por código, cliente o teléfono..."
          class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs focus:bg-white focus:border-brand-dark focus:outline-none"
        />
      </div>

      <!-- Pestañas Filtro por Servicio -->
      <div class="grid grid-cols-4 gap-1.5 p-1 bg-brand-light rounded-xl border border-brand-border text-[11px] font-black">
        <button 
          type="button"
          @click="filterType = 'all'"
          :class="[
            'py-1.5 rounded-lg transition-colors touch-target',
            filterType === 'all' ? 'bg-brand-dark text-white' : 'text-gray-600 hover:text-brand-dark'
          ]"
        >
          Todos
        </button>
        <button 
          type="button"
          @click="filterType = 'cabana'"
          :class="[
            'py-1.5 rounded-lg transition-colors touch-target',
            filterType === 'cabana' ? 'bg-brand-dark text-white' : 'text-gray-600 hover:text-brand-dark'
          ]"
        >
          Cabaña
        </button>
        <button 
          type="button"
          @click="filterType = 'camping'"
          :class="[
            'py-1.5 rounded-lg transition-colors touch-target',
            filterType === 'camping' ? 'bg-brand-dark text-white' : 'text-gray-600 hover:text-brand-dark'
          ]"
        >
          Camping
        </button>
        <button 
          type="button"
          @click="filterType = 'restaurante'"
          :class="[
            'py-1.5 rounded-lg transition-colors touch-target',
            filterType === 'restaurante' ? 'bg-brand-dark text-white' : 'text-gray-600 hover:text-brand-dark'
          ]"
        >
          Restorán
        </button>
      </div>
    </div>

    <!-- Lista de Solicitudes -->
    <div class="space-y-3">
      <div 
        v-if="filteredRequests.length === 0" 
        class="bg-white p-8 rounded-3xl border-2 border-brand-border text-center space-y-2 text-gray-500"
      >
        <AlertCircle class="w-8 h-8 text-gray-300 mx-auto stroke-[2.5]" />
        <p class="text-xs font-bold">No hay solicitudes que coincidan con el filtro actual.</p>
      </div>

      <div 
        v-for="req in filteredRequests" 
        :key="req.id"
        @click="openDetailModal(req)"
        class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs hover:border-brand-dark transition-all space-y-3 cursor-pointer touch-target"
      >
        <div class="flex items-center justify-between">
          <span :class="['px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border flex items-center gap-1', getServiceBadgeClass(req.type)]">
            <component :is="getServiceIcon(req.type)" class="w-3.5 h-3.5 stroke-[2.5]" />
            {{ req.type }}
          </span>

          <span :class="['px-2.5 py-0.5 rounded-full text-[10px] uppercase shadow-2xs', getStatusBadgeClass(req.status)]">
            {{ req.status }}
          </span>
        </div>

        <div class="space-y-1">
          <div class="flex justify-between items-start">
            <h3 class="text-base font-black text-brand-dark leading-tight">{{ req.clientName }}</h3>
            <span class="text-xs font-black text-brand-accent bg-brand-light px-2 py-0.5 rounded-md border border-brand-border">
              {{ req.requestCode }}
            </span>
          </div>

          <div class="flex items-center gap-3 text-xs font-bold text-gray-600">
            <span class="flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
              {{ formatDateShort(req.date) }}
            </span>
            <span class="flex items-center gap-1">
              <Users class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
              {{ req.guestsCount }} pers.
            </span>
            <span class="text-brand-dark font-black ml-auto">
              {{ formatCLP(req.totalAmount) }}
            </span>
          </div>
        </div>

        <!-- Acciones Rápidas (Aprobar / Rechazar) -->
        <div 
          v-if="req.status === 'pending'" 
          class="flex items-center gap-2 pt-2 border-t border-gray-100" 
          @click.stop
        >
          <button 
            type="button" 
            @click="handleConfirm(req.id)"
            class="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-xs touch-target active:scale-95 transition-transform"
          >
            <Check class="w-4 h-4 stroke-[2.5]" /> Aprobar
          </button>

          <button 
            type="button" 
            @click="handleReject(req.id)"
            class="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-xs touch-target active:scale-95 transition-transform"
          >
            <X class="w-4 h-4 stroke-[2.5]" /> Rechazar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Detalle de Solicitud -->
    <div 
      v-if="isDetailModalOpen && selectedRequest" 
      class="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl p-5 max-w-sm w-full border-2 border-brand-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <span class="text-[10px] font-black text-brand-accent uppercase block">Detalle de Solicitud</span>
            <h2 class="text-lg font-black text-brand-dark">{{ selectedRequest.requestCode }}</h2>
          </div>
          <button type="button" @click="closeDetailModal" class="p-1 rounded-full hover:bg-gray-100 text-gray-500">
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <div class="bg-brand-light p-3.5 rounded-2xl border border-brand-border space-y-2 text-xs font-bold text-gray-700">
          <div class="flex justify-between">
            <span>Cliente:</span>
            <span class="text-brand-dark font-black">{{ selectedRequest.clientName }}</span>
          </div>
          <div class="flex justify-between">
            <span>Teléfono:</span>
            <span class="text-brand-dark font-black flex items-center gap-1">
              <Phone class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
              {{ selectedRequest.clientPhone }}
            </span>
          </div>
          <div v-if="selectedRequest.clientEmail" class="flex justify-between">
            <span>Correo:</span>
            <span class="text-brand-dark font-black flex items-center gap-1">
              <Mail class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
              {{ selectedRequest.clientEmail }}
            </span>
          </div>
          <div class="flex justify-between">
            <span>Recurso:</span>
            <span class="text-brand-dark font-black">{{ selectedRequest.resourceName }}</span>
          </div>
          <div class="flex justify-between">
            <span>Fecha:</span>
            <span class="text-brand-dark font-black">{{ formatDateShort(selectedRequest.date) }}</span>
          </div>
          <div class="flex justify-between border-t border-gray-200/60 pt-2">
            <span>Total con IVA:</span>
            <span class="text-sm font-black text-brand-dark">{{ formatCLP(selectedRequest.totalAmount) }}</span>
          </div>
          <div class="flex justify-between text-emerald-800 font-extrabold">
            <span>Abono Requerido (30%):</span>
            <span>{{ formatCLP(selectedRequest.depositAmount) }}</span>
          </div>
        </div>

        <div v-if="selectedRequest.details?.comments" class="space-y-1">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Comentarios del Cliente</span>
          <p class="text-xs font-bold italic bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950">
            "{{ selectedRequest.details.comments }}"
          </p>
        </div>

        <div class="space-y-2 pt-2">
          <div v-if="selectedRequest.status === 'pendiente'" class="flex gap-2">
            <BaseButton variant="primary" class="flex-1" @click="handleConfirm(selectedRequest.id)">
              <Check class="w-4 h-4 mr-1 stroke-[2.5]" /> Aprobar
            </BaseButton>
            <BaseButton variant="outline" class="flex-1" @click="handleReject(selectedRequest.id)">
              <X class="w-4 h-4 mr-1 stroke-[2.5]" /> Rechazar
            </BaseButton>
          </div>

          <BaseButton variant="outline" fullWidth @click="closeDetailModal">
            Cerrar
          </BaseButton>
        </div>
      </div>
    </div>

    <!-- Navegación Inferior Fija de Administración -->
    <AdminBottomNav />
  </div>
</template>