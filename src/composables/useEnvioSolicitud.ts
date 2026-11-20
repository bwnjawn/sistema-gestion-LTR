import { computed, ref } from 'vue'
import { useReservationStore } from '../stores/reservationStore'
import { useSettingsStore } from '../stores/settingsStore'

/**
 * Estado del envío de una solicitud del cliente: bloquea el doble toque, guarda el
 * motivo si falla y avisa cuando no hay conexión. Sin señal el cliente SÍ puede enviar: la solicitud queda
 * guardada en su teléfono y se manda sola al volver la conexión (SCRUM-250). Solo el administrador espera.
 */
export function useEnvioSolicitud() {
  const settingsStore = useSettingsStore()
  const reservationStore = useReservationStore()
  const isSubmitting = ref(false)
  const errorEnvio = ref('')
  const sinConexion = computed(() => !settingsStore.isConnected)
  /** Sin señal, la solicitud del cliente se guarda para enviarla después; la del administrador espera la conexión. */
  const seGuardaParaDespues = computed(() => sinConexion.value && !reservationStore.isAdminMode)
  const bloqueado = computed(() => sinConexion.value && reservationStore.isAdminMode)

  async function enviar(accion: () => Promise<void>) {
    if (isSubmitting.value || bloqueado.value) return
    isSubmitting.value = true
    errorEnvio.value = ''
    try {
      await accion()
    } catch (error) {
      console.error('Error al enviar la solicitud:', error)
      errorEnvio.value = error instanceof Error && error.message
        ? error.message
        : 'No pudimos enviar tu solicitud.'
    } finally {
      isSubmitting.value = false
    }
  }

  return { isSubmitting, errorEnvio, sinConexion, seGuardaParaDespues, bloqueado, enviar }
}
