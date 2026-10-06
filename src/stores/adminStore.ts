import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAdminStore = defineStore('admin', () => {
  // Estado Dinámico
  const currentDate = ref('Miércoles 21 de Octubre')
  const isConnected = ref(true)
  
  // Conflictos de sincronización offline
  const conflicts = ref([
    {
      id: 'CONF-1',
      resource: 'Cabaña 6',
      date: 'Mié 21 oct',
      details: 'Dos reservas chocaron sin conexión',
      reservationA: { client: 'Familia Ojeda', phone: '+56 9 1234 5678', people: 5 },
      reservationB: { client: 'Grupo Silva', phone: '+56 9 8765 4321', people: 4 }
    }
  ])

  // Ocupación en tiempo real por recurso específico
  const resources = ref([
    { id: 'c6', name: 'Cabaña 6', type: 'cabin', occupied: 1, total: 1 },
    { id: 'c8', name: 'Cabaña 8', type: 'cabin', occupied: 0, total: 1 },
    { id: 'cmp', name: 'Camping', type: 'camping', occupied: 0, total: 5 },
    { id: 'rst', name: 'Restaurante', type: 'restaurant', occupied: 12, total: 200 },
  ])

  // Solicitudes recibidas
  const requests = ref([
    { id: 'R1', client: 'Familia Ojeda', service: 'Cabaña 6 + Restaurante', people: 5, totalAmount: 85000, status: 'pending' },
    { id: 'R2', client: 'Grupo Scout', service: 'Camping (15 personas)', people: 15, totalAmount: 150000, status: 'pending' },
    { id: 'R3', client: 'Empresa Forestal', service: 'Almuerzo 20p', people: 20, totalAmount: 240000, status: 'approved' },
    { id: 'R4', client: 'Juan Pérez', service: 'Cabaña 8', people: 2, totalAmount: 65000, status: 'pending' },
  ])

  // Propiedades Computadas (Calculadas dinámicamente)
  const pendingRequests = computed(() => requests.value.filter(r => r.status === 'pending'))
  const pendingCount = computed(() => pendingRequests.value.length)
  const hasConflicts = computed(() => conflicts.value.length > 0)

  // Acciones (Mutaciones de Estado)
  function approveRequest(id: string) {
    const req = requests.value.find(r => r.id === id)
    if (req) req.status = 'approved'
  }

  function rejectRequest(id: string) {
    const req = requests.value.find(r => r.id === id)
    if (req) req.status = 'rejected'
  }

  return {
    currentDate,
    isConnected,
    conflicts,
    resources,
    requests,
    pendingRequests,
    pendingCount,
    hasConflicts,
    approveRequest,
    rejectRequest
  }
})