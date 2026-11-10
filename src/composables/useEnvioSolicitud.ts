import { computed, ref } from 'vue'
import { useSettingsStore } from '../stores/settingsStore'

/**
 * Estado del envío de una solicitud del cliente: bloquea el doble toque, guarda el
 * motivo si falla y avisa cuando no hay conexión.
 */
export function useEnvioSolicitud() {
  const settingsStore = useSettingsStore()
  const isSubmitting = ref(false)
  const errorEnvio = ref('')
  const sinConexion = computed(() => !settingsStore.isConnected)

  async function enviar(accion: () => Promise<void>) {
    if (isSubmitting.value || sinConexion.value) return
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

  return { isSubmitting, errorEnvio, sinConexion, enviar }
}
