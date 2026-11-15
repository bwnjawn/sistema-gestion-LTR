// src/stores/disponibilidadStore.ts
// Fechas ocupadas confirmadas que usa el calendario del cliente (SCRUM-246). Es lo único que el cliente necesita
// saber de las reservas de otros: no lee solicitudes. Se carga al arrancar para una ventana de fechas y se
// vuelve a pedir cuando cambia algo que afecta la disponibilidad.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { addDays, todayISO } from '../lib/dates'
import { mensajeDeError } from '../lib/errores'
import { repositorios } from '../lib/repositories'
import { crearConsultaDisponibilidad } from '../services/disponibilidad'
import { SIN_FECHAS_OCUPADAS, type FechasOcupadas } from '../types/disponibilidad'

/** Cuántos días hacia adelante se piden las fechas ocupadas (unos dos años). Más allá se ve todo libre. */
export const DIAS_DE_DISPONIBILIDAD = 730

export const useDisponibilidadStore = defineStore('disponibilidad', () => {
  const ocupadas = ref<FechasOcupadas>({ ...SIN_FECHAS_OCUPADAS })
  /** Las consultas que usan las vistas; se rearman solas cuando cambian las fechas ocupadas. */
  const consulta = computed(() => crearConsultaDisponibilidad(ocupadas.value))

  const isLoading = ref(false)
  const isReady = ref(false)
  const error = ref<string | null>(null)

  /** Pide las fechas ocupadas al repositorio. Al arrancar la app falla en voz alta; al refrescar, en silencio. */
  async function cargar(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const desde = todayISO()
      ocupadas.value = await repositorios().availability.fechasOcupadas(desde, addDays(desde, DIAS_DE_DISPONIBILIDAD))
      isReady.value = true
    } catch (e) {
      error.value = mensajeDeError(e, 'No se pudo cargar la disponibilidad.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /** Se llama una vez al arrancar la app. */
  async function init(): Promise<void> {
    await cargar()
  }

  /**
   * Vuelve a pedir las fechas ocupadas (después de confirmar, cancelar o mover una reserva). Si falla no
   * rompe lo que el usuario estaba haciendo: se queda con lo último que cargó y deja el motivo en `error`.
   */
  async function refrescar(): Promise<void> {
    try {
      await cargar()
    } catch (e) {
      console.warn('[Disponibilidad] No se pudo actualizar:', e)
    }
  }

  return { ocupadas, consulta, isLoading, isReady, error, init, refrescar }
})
