// src/stores/avisosPushStore.ts
// Avisos push de solicitudes nuevas en ESTE dispositivo del administrador (SCRUM-68). La vista solo llama a
// `activar` y `desactivar`; el navegador lo maneja `lib/avisosPush.ts` y la base, el repositorio.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { repositorios } from '../lib/repositories'
import { avisarError, avisarExito } from '../lib/avisos'
import { mensajeDeError } from '../lib/errores'
import {
  cancelarSuscripcionDelDispositivo,
  endpointDelDispositivo,
  leerCapacidadesDeAvisos,
  suscribirDispositivo
} from '../lib/avisosPush'
import { resolverEstadoAvisos, TEXTO_ESTADO_AVISOS, type EstadoAvisos } from '../services/avisosPush'

export const useAvisosPushStore = defineStore('avisosPush', () => {
  const estado = ref<EstadoAvisos>('desactivado')
  const cargando = ref(true)
  const trabajando = ref(false)

  const texto = computed(() => TEXTO_ESTADO_AVISOS[estado.value])

  /** Vuelve a mirar el navegador (permiso, suscripción, si la app está instalada). */
  async function actualizar(): Promise<void> {
    if (!repositorios().avisosPush.disponible) {
      estado.value = 'no-disponible'
      cargando.value = false
      return
    }
    try {
      estado.value = resolverEstadoAvisos(await leerCapacidadesDeAvisos())
    } catch (e) {
      console.warn('[AvisosPush] No se pudo leer el estado:', e)
      estado.value = 'no-disponible'
    } finally {
      cargando.value = false
    }
  }

  async function activar(): Promise<void> {
    if (trabajando.value) return
    trabajando.value = true
    try {
      const suscripcion = await suscribirDispositivo()
      if (!suscripcion) {
        // La persona no dio el permiso (o lo cerró): se muestra el estado real, sin tratarlo como error
        await actualizar()
        return
      }
      await repositorios().avisosPush.guardar(suscripcion, navigator.userAgent)
      await actualizar()
      avisarExito('Avisos activados', 'Este dispositivo recibirá una notificación por cada solicitud nueva.')
    } catch (e) {
      avisarError(mensajeDeError(e, 'No se pudieron activar los avisos.'))
      await actualizar()
    } finally {
      trabajando.value = false
    }
  }

  async function desactivar(): Promise<void> {
    if (trabajando.value) return
    trabajando.value = true
    try {
      const endpoint = (await endpointDelDispositivo()) ?? null
      // Primero la base: si falla, la suscripción del navegador queda y el estado sigue siendo "activado"
      if (endpoint) await repositorios().avisosPush.quitar(endpoint)
      await cancelarSuscripcionDelDispositivo()
      await actualizar()
      avisarExito('Avisos desactivados', 'Este dispositivo ya no recibirá avisos de solicitudes.', 'descartado')
    } catch (e) {
      avisarError(mensajeDeError(e, 'No se pudieron desactivar los avisos.'))
      await actualizar()
    } finally {
      trabajando.value = false
    }
  }

  return { estado, cargando, trabajando, texto, actualizar, activar, desactivar }
})
