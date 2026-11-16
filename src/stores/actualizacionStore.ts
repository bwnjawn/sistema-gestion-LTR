// src/stores/actualizacionStore.ts
// Mantiene al día lo que se ve en pantalla cuando otro dispositivo cambia algo (SCRUM-273). Tres formas:
//  1. Al volver a la app (pestaña visible otra vez, app instalada que vuelve al frente) y al recuperar internet:
//     se vuelven a pedir ajustes, catálogo, disponibilidad y, con sesión de administrador, las solicitudes.
//  2. En tiempo real, para el administrador: un aviso de la base dispara la actualización de las solicitudes.
//  3. A mano, con el botón "Actualizar" del encabezado del panel.
// Sin Supabase (almacenamiento local) no hay otros dispositivos y nada de esto hace falta.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { mensajeDeError } from '../lib/errores'
import { repositorios } from '../lib/repositories'
import { alCambiarLaRed, redCaida } from '../lib/red'
import { useAuthStore } from './authStore'
import { useCatalogStore } from './catalogStore'
import { useDisponibilidadStore } from './disponibilidadStore'
import { useRequestsStore } from './requestsStore'
import { useSettingsStore } from './settingsStore'

/** Al volver a la app no se actualiza si ya se hizo hace menos de esto (evita pedidos repetidos al cambiar de pestaña). */
export const SEGUNDOS_MINIMOS_AL_VOLVER = 20
/** Los avisos en tiempo real llegan en ráfagas (una reserva toca varias tablas): se juntan en una sola actualización. */
export const ESPERA_DE_AVISOS_MS = 400

export const useActualizacionStore = defineStore('actualizacion', () => {
  /** Instante (ms) de la última actualización completa, o null si aún no hubo. */
  const ultimaVez = ref<number | null>(null)
  const actualizando = ref(false)
  const error = ref<string | null>(null)
  const tiempoRealActivo = ref(false)

  let cancelarEscucha: (() => void) | null = null
  let temporizador: ReturnType<typeof setTimeout> | null = null
  let quitarOyentes: (() => void) | null = null

  const usaSupabase = () => repositorios().modo === 'supabase'
  /** Hay otros dispositivos con los que sincronizarse (solo con Supabase). Las vistas lo usan para mostrar el botón. */
  const disponible = computed(usaSupabase)

  /** Los datos acaban de cargarse (al arrancar o al iniciar sesión). */
  function marcarActualizado(): void {
    ultimaVez.value = Date.now()
    error.value = null
  }

  /**
   * Vuelve a pedir todo lo que se ve: ajustes, catálogo, disponibilidad y, con sesión, las solicitudes. Con
   * `minimoSegundos` no hace nada si se actualizó hace menos que eso. Un fallo no rompe la pantalla: deja el
   * motivo en `error` y conserva lo que ya estaba cargado.
   */
  async function refrescarTodo(opciones: { minimoSegundos?: number } = {}): Promise<void> {
    // Con la red caída no hay nada que pedir: se actualizará solo cuando se recupere (ver `iniciar`)
    if (!usaSupabase() || actualizando.value || redCaida()) return
    const minimo = (opciones.minimoSegundos ?? 0) * 1000
    if (minimo > 0 && ultimaVez.value !== null && Date.now() - ultimaVez.value < minimo) return

    actualizando.value = true
    error.value = null
    try {
      const tareas: Promise<unknown>[] = [
        useSettingsStore().refrescar(),
        useCatalogStore().refrescar(),
        useDisponibilidadStore().cargar()
      ]
      if (useAuthStore().isAuthenticated) tareas.push(useRequestsStore().refrescar())
      const resultados = await Promise.allSettled(tareas)
      const fallo = resultados.find((r): r is PromiseRejectedResult => r.status === 'rejected')
      if (fallo) {
        error.value = mensajeDeError(fallo.reason, 'No se pudo actualizar.')
        console.warn('[Actualización] No se pudo actualizar:', fallo.reason)
      } else {
        ultimaVez.value = Date.now()
      }
    } finally {
      actualizando.value = false
    }
  }

  /** Solo lo que cambia con las reservas: las solicitudes y la disponibilidad (lo que dispara un aviso en vivo). */
  async function refrescarReservas(): Promise<void> {
    try {
      await Promise.all([useRequestsStore().refrescar(), useDisponibilidadStore().cargar()])
      ultimaVez.value = Date.now()
      error.value = null
    } catch (e) {
      error.value = mensajeDeError(e, 'No se pudo actualizar.')
      console.warn('[Actualización] No se pudo actualizar las solicitudes:', e)
    }
  }

  function alRecibirAviso(): void {
    if (temporizador) clearTimeout(temporizador)
    temporizador = setTimeout(() => {
      temporizador = null
      void refrescarReservas()
    }, ESPERA_DE_AVISOS_MS)
  }

  /** Empieza a escuchar los cambios en vivo. Solo con Supabase y con sesión de administrador. */
  function empezarTiempoReal(): void {
    if (cancelarEscucha || !usaSupabase() || !useAuthStore().isAuthenticated) return
    cancelarEscucha = repositorios().requests.escucharCambios(alRecibirAviso)
    tiempoRealActivo.value = true
  }

  /** Deja de escuchar (al cerrar sesión). */
  function detenerTiempoReal(): void {
    if (temporizador) {
      clearTimeout(temporizador)
      temporizador = null
    }
    cancelarEscucha?.()
    cancelarEscucha = null
    tiempoRealActivo.value = false
  }

  /** Pone los oyentes de "volví a la app" y "volvió internet". Se llama una sola vez al montar la app. */
  function iniciar(): void {
    if (quitarOyentes || typeof document === 'undefined' || typeof window === 'undefined') return
    const alVolver = () => {
      if (document.visibilityState === 'visible') void refrescarTodo({ minimoSegundos: SEGUNDOS_MINIMOS_AL_VOLVER })
    }
    const alRecuperarInternet = () => void refrescarTodo()
    // Una página restaurada desde la memoria rápida del navegador (iPhone) no dispara `visibilitychange`
    const alMostrarPagina = (evento: Event) => {
      if ((evento as PageTransitionEvent).persisted) alVolver()
    }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('online', alRecuperarInternet)
    window.addEventListener('pageshow', alMostrarPagina)
    // La red también se recupera sin que el navegador avise (ver src/lib/red.ts): al volver, se actualiza
    const dejarDeVerLaRed = alCambiarLaRed(caida => {
      if (!caida) void refrescarTodo()
    })
    quitarOyentes = () => {
      dejarDeVerLaRed()
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('online', alRecuperarInternet)
      window.removeEventListener('pageshow', alMostrarPagina)
      quitarOyentes = null
    }
  }

  function detener(): void {
    detenerTiempoReal()
    quitarOyentes?.()
  }

  return {
    disponible,
    ultimaVez,
    actualizando,
    error,
    tiempoRealActivo,
    marcarActualizado,
    refrescarTodo,
    empezarTiempoReal,
    detenerTiempoReal,
    iniciar,
    detener
  }
})
