// src/composables/useSalidaReserva.ts
// Adónde se vuelve al terminar o abandonar el flujo de reserva: el cliente va al
// inicio y el administrador, a la lista de solicitudes (SCRUM-56).

import { useRouter } from 'vue-router'
import { useReservationStore } from '../stores/reservationStore'

export function useSalidaReserva() {
  const router = useRouter()
  const store = useReservationStore()

  /** Al terminar: limpia el borrador y vuelve. */
  function terminar() {
    const esAdmin = store.isAdminMode
    store.resetStore()
    router.push(esAdmin ? { name: 'admin-solicitudes' } : '/')
  }

  return { terminar }
}
