<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Inbox, Building2, Tent, Utensils, 
  Check, X, Search, Phone, Mail, Plus, DollarSign, CreditCard, AlertTriangle
} from 'lucide-vue-next'
import BaseButton from '../../components/ui/BaseButton.vue'
import AdminBottomNav from '../../components/admin/AdminBottomNav.vue'
import AdminNewBookingModal from '../../components/admin/AdminNewBookingModal.vue'
import { useRequestsStore } from '../../stores/requestsStore'
import { formatCLP } from '../../lib/format'
import type { ReservationRequest } from '../../types/domain'

const requestsStore = useRequestsStore()

// Modales y Filtros
const filterStatus = ref<'all' | 'pending' | 'confirmed' | 'rejected'>('pending')
const filterType = ref<'all' | 'cabana' | 'camping' | 'restaurante'>('all')
const searchQuery = ref('')

const isNewBookingModalOpen = ref(false)
const selectedRequest = ref<ReservationRequest | null>(null)
const isDetailModalOpen = ref(false)

// Formulario para Registrar Nuevo Pago
const newPaymentAmount = ref<number | null>(null)
const newPaymentMethod = ref('Transferencia')

// Solicitudes Filtradas
const filteredRequests = computed(() => {
  return requestsStore.requests.filter(req => {
    // 1. Filtro por Estado
    if (filterStatus.value !== 'all') {
      const isPend = req.status === 'pending' || (req.status as string) === 'pendiente'
      const isConf = req.status === 'confirmed' || (req.status as string) === 'confirmada'
      const isRej = req.status === 'rejected' || (req.status as string) === 'rechazada'

      if (filterStatus.value === 'pending' && !isPend) return false
      if (filterStatus.value === 'confirmed' && !isConf) return false
      if (filterStatus.value === 'rejected' && !isRej) return false
    }

    // 2. Filtro por Tipo de Servicio
    if (filterType.value !== 'all') {
      const rawType = (req.type || '').toLowerCase()
      if (filterType.value === 'restaurante' && rawType !== 'restaurante' && rawType !== 'restaurant') return false
      if (filterType.value === 'cabana' && rawType !== 'cabana' && rawType !== 'cabaña') return false
      if (filterType.value === 'camping' && rawType !== 'camping') return false
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
const pendingCount = computed(() => requestsStore.requests.filter(r => r.status === 'pending' || (r.status as string) === 'pendiente').length)
const confirmedCount = computed(() => requestsStore.requests.filter(r => r.status === 'confirmed' || (r.status as string) === 'confirmada').length)
const rejectedCount = computed(() => requestsStore.requests.filter(r => r.status === 'rejected' || (r.status as string) === 'rechazada').length)

function openDetailModal(req: ReservationRequest) {
  selectedRequest.value = req
  newPaymentAmount.value = null
  isDetailModalOpen.value = true
}

function closeDetailModal() {
  isDetailModalOpen.value = false
  selectedRequest.value = null
  newPaymentAmount.value = null
}

function handleConfirm(id: string) {
  requestsStore.confirmRequest(id)
  if (selectedRequest.value && selectedRequest.value.id === id) {
    selectedRequest.value.status = 'confirmed'
  }
}

function handleReject(id: string) {
  requestsStore.rejectRequest(id)
  if (selectedRequest.value && selectedRequest.value.id === id) {
    selectedRequest.value.status = 'rejected'
  }
}

// Evalúa si una solicitud pendiente supera las 24 horas sin atención
function isOldPending(req: ReservationRequest): boolean {
  const isPending = req.status === 'pending' || (req.status as string) === 'pendiente'
  if (!isPending) return false
  if (!req.createdAt) return false
  const createdTime = new Date(req.createdAt).getTime()
  const now = new Date().getTime()
  const diffHours = (now - createdTime) / (1000 * 3600)
  return diffHours >= 24
}

// Cálculo dinámico de saldo y estado de pago
function calculatePaymentState(req: ReservationRequest) {
  const total = req.totalAmount || 0
  const deposit = req.depositAmount || 0
  const extra = req.details?.extraPaid || 0
  const totalPaid = deposit + extra
  const balance = Math.max(0, total - totalPaid)

  let statusLabel = 'Sin Abono'
  let statusClass = 'bg-rose-100 text-rose-800 border-rose-300'

  if (balance === 0 && total > 0) {
    statusLabel = 'Pagado Total'
    statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-300'
  } else if (totalPaid > 0) {
    statusLabel = 'Abonado (Parcial)'
    statusClass = 'bg-amber-100 text-amber-800 border-amber-300'
  }

  return { total, deposit, extra, totalPaid, balance, statusLabel, statusClass }
}

function registerExtraPayment() {
  if (!selectedRequest.value || !newPaymentAmount.value || newPaymentAmount.value <= 0) return

  const currentExtra = selectedRequest.value.details?.extraPaid || 0
  const updatedExtra = currentExtra + newPaymentAmount.value

  selectedRequest.value.details = {
    ...selectedRequest.value.details,
    extraPaid: updatedExtra
  }

  newPaymentAmount.value = null
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
  if (status === 'confirmed' || status === 'confirmada') return 'bg-emerald-500 text-white font-black'
  if (status === 'rejected' || status === 'rechazada') return 'bg-rose-500 text-white font-black'
  return 'bg-amber-400 text-amber-950 font-black'
}

function formatStatusText(status: string): string {
  if (status === 'confirmed' || status === 'confirmada') return 'Confirmada'
  if (status === 'rejected' || status === 'rechazada') return 'Rechazada'
  return 'Pendiente'
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
    
    <div class="bg-brand-dark text-white p-5 rounded-3xl border-2 border-brand-border shadow-sm flex items-center justify-between">
      <div>
        <span class="text-[10px] font-black text-emerald-300 uppercase tracking-wider block">
          Administración Los Troncos de Repil
        </span>
        <h1 class="text-xl font-black tracking-tight">Gestión de Solicitudes</h1>
      </div>
      <button 
        type="button" 
        @click="isNewBookingModalOpen = true"
        class="py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs flex items-center gap-1 shadow-md active:scale-95 transition-transform"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" /> Nueva
      </button>
    </div>

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

    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="relative">
        <Search class="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
        <input 
          type="text"
          v-model="searchQuery"
          placeholder="Buscar por código, cliente o teléfono..."
          class="w-full pl-10 pr-3.5 py-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs focus:bg-white focus:border-brand-dark focus:outline-none"
        />
      </div>

      <div class="grid grid-cols-4 gap-1.5 p-1 bg-brand-light rounded-xl border border-brand-border text-[11px] font-black">
        <button
          type="button"
          @click="filterType = 'all'"
          :class="['py-1.5 rounded-lg transition-all', filterType === 'all' ? 'bg-white text-brand-dark shadow-2xs' : 'text-gray-500']"
        >
          Todos
        </button>
        <button
          type="button"
          @click="filterType = 'cabana'"
          :class="['py-1.5 rounded-lg transition-all', filterType === 'cabana' ? 'bg-white text-brand-dark shadow-2xs' : 'text-gray-500']"
        >
          Cabaña
        </button>
        <button
          type="button"
          @click="filterType = 'camping'"
          :class="['py-1.5 rounded-lg transition-all', filterType === 'camping' ? 'bg-white text-brand-dark shadow-2xs' : 'text-gray-500']"
        >
          Camping
        </button>
        <button
          type="button"
          @click="filterType = 'restaurante'"
          :class="['py-1.5 rounded-lg transition-all', filterType === 'restaurante' ? 'bg-white text-brand-dark shadow-2xs' : 'text-gray-500']"
        >
          Restorán
        </button>
      </div>
    </div>

    <!-- Lista de Solicitudes -->
    <div class="space-y-3">
      <div 
        v-for="req in filteredRequests" 
        :key="req.id"
        :class="[
          'bg-white p-4 rounded-3xl border-2 transition-all space-y-3 shadow-xs',
          isOldPending(req) ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-300/60' : 'border-brand-border'
        ]"
      >
        <div v-if="isOldPending(req)" class="bg-amber-100 border border-amber-300 text-amber-950 px-3 py-1 rounded-xl text-[10px] font-black flex items-center gap-1.5">
          <AlertTriangle class="w-3.5 h-3.5 text-amber-700 stroke-[2.5]" />
          <span>Pendiente con más de 24h sin gestionar</span>
        </div>

        <div class="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div class="flex items-center gap-2">
            <span :class="['p-2 rounded-xl border', getServiceBadgeClass(req.type)]">
              <component :is="getServiceIcon(req.type)" class="w-4 h-4 stroke-[2.5]" />
            </span>
            <div>
              <span class="text-[10px] font-black uppercase text-gray-400 block leading-none">{{ req.requestCode }}</span>
              <span class="text-sm font-black text-brand-dark">{{ req.clientName }}</span>
            </div>
          </div>
          <span :class="['px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wider', getStatusBadgeClass(req.status)]">
            {{ formatStatusText(req.status) }}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-2 text-xs font-bold text-gray-700">
          <div class="flex items-center gap-1.5">
            <Phone class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            <span>{{ req.clientPhone }}</span>
          </div>
          <div class="flex items-center gap-1.5 justify-end">
            <span class="text-brand-dark font-black">{{ req.resourceName }}</span>
          </div>
        </div>

        <div class="flex items-center justify-between bg-brand-light p-2.5 rounded-2xl border border-brand-border text-xs font-black">
          <span class="text-gray-500">Total: {{ formatCLP(req.totalAmount) }}</span>
          <span class="text-emerald-800">Abono: {{ formatCLP(req.depositAmount) }}</span>
        </div>

        <div class="flex gap-2 pt-1">
          <button
            type="button"
            @click="openDetailModal(req)"
            class="flex-1 py-2 bg-brand-light border border-brand-border text-brand-dark rounded-xl font-black text-xs hover:bg-gray-100 active:scale-95 transition-transform"
          >
            Ver Detalle &amp; Pagos
          </button>
          
          <button
            v-if="req.status === 'pending' || (req.status as string) === 'pendiente'"
            type="button"
            @click="handleConfirm(req.id)"
            class="py-2 px-3 bg-emerald-500 text-white rounded-xl font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-transform"
          >
            <Check class="w-4 h-4 stroke-[2.5]" /> Aprobar
          </button>

          <button
            v-if="req.status === 'pending' || (req.status as string) === 'pendiente'"
            type="button"
            @click="handleReject(req.id)"
            class="py-2 px-3 bg-rose-500 text-white rounded-xl font-black text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-transform"
          >
            <X class="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>

      <div v-if="filteredRequests.length === 0" class="bg-white p-8 rounded-3xl border-2 border-brand-border text-center space-y-2">
        <Inbox class="w-8 h-8 text-gray-400 mx-auto stroke-[2]" />
        <p class="text-xs font-extrabold text-gray-500">No se encontraron solicitudes con los filtros aplicados.</p>
      </div>
    </div>

    <!-- Modal Detalle de Solicitud y Registro de Pagos -->
    <div 
      v-if="isDetailModalOpen && selectedRequest" 
      class="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl p-5 max-w-sm w-full border-2 border-brand-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <span class="text-[10px] font-black text-brand-accent uppercase block">Ficha de Reserva</span>
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
        </div>

        <!-- Sección Estado Financiero y Pagos -->
        <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border space-y-2 text-xs font-bold">
          <div class="flex items-center justify-between border-b border-gray-100 pb-2">
            <span class="flex items-center gap-1 text-brand-dark font-black">
              <DollarSign class="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              Estado de Pago
            </span>
            <span :class="['px-2 py-0.5 rounded-full text-[10px] font-black border', calculatePaymentState(selectedRequest).statusClass]">
              {{ calculatePaymentState(selectedRequest).statusLabel }}
            </span>
          </div>

          <div class="space-y-1 text-gray-700 pt-1">
            <div class="flex justify-between">
              <span>Monto Total (con IVA):</span>
              <span class="font-black text-brand-dark">{{ formatCLP(calculatePaymentState(selectedRequest).total) }}</span>
            </div>
            <div class="flex justify-between text-emerald-800">
              <span>Abono Registrado:</span>
              <span class="font-black">{{ formatCLP(calculatePaymentState(selectedRequest).deposit) }}</span>
            </div>
            <div v-if="calculatePaymentState(selectedRequest).extra > 0" class="flex justify-between text-emerald-800">
              <span>Pagos Adicionales:</span>
              <span class="font-black">{{ formatCLP(calculatePaymentState(selectedRequest).extra) }}</span>
            </div>
            <div class="flex justify-between border-t border-gray-200/80 pt-1.5 text-brand-dark font-black text-sm">
              <span>Saldo Pendiente:</span>
              <span :class="calculatePaymentState(selectedRequest).balance > 0 ? 'text-amber-700' : 'text-emerald-700'">
                {{ formatCLP(calculatePaymentState(selectedRequest).balance) }}
              </span>
            </div>
          </div>

          <!-- Registrar Abono/Pago Adicional -->
          <div v-if="calculatePaymentState(selectedRequest).balance > 0" class="pt-2 border-t border-gray-100 space-y-2">
            <span class="text-[10px] font-black text-gray-500 uppercase block">Registrar Nuevo Abono / Pago</span>
            <div class="flex gap-2">
              <input 
                type="number" 
                v-model.number="newPaymentAmount" 
                placeholder="Monto \$" 
                class="w-1/2 p-2 rounded-xl border border-brand-border bg-brand-light font-black text-xs"
              />
              <select v-model="newPaymentMethod" class="w-1/2 p-2 rounded-xl border border-brand-border bg-brand-light font-black text-xs">
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Débito">Débito</option>
              </select>
            </div>
            <button 
              type="button" 
              @click="registerExtraPayment" 
              :disabled="!newPaymentAmount || newPaymentAmount <= 0"
              class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1 shadow-2xs"
            >
              <CreditCard class="w-3.5 h-3.5 stroke-[2.5]" /> Agregar Pago
            </button>
          </div>
        </div>

        <div v-if="selectedRequest.details?.comments" class="space-y-1">
          <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Comentarios</span>
          <p class="text-xs font-bold italic bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-950">
            "{{ selectedRequest.details.comments }}"
          </p>
        </div>

        <div class="space-y-2 pt-2">
          <div v-if="selectedRequest.status === 'pending' || (selectedRequest.status as string) === 'pendiente'" class="flex gap-2">
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

    <!-- Modal Nueva Reserva Directa -->
    <AdminNewBookingModal 
      :is-open="isNewBookingModalOpen" 
      @close="isNewBookingModalOpen = false" 
      @created="filterStatus = 'all'"
    />

    <AdminBottomNav />
  </div>
</template>