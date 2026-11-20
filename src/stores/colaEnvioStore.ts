// src/stores/colaEnvioStore.ts
// Solicitudes del cliente que esperan señal para enviarse (SCRUM-250). Se guardan en el dispositivo y se reenvían
// solas: al abrir la app, al volver la conexión o la pantalla, y cada pocos segundos mientras haya algo pendiente.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ReservationRequest } from '../types/domain'
import { conTiempoLimite } from '../lib/conTiempoLimite'
import { marcarServidorActivo, marcarServidorCaido, servidorInalcanzable } from '../lib/estadoDeRed'
import { repositorios } from '../lib/repositories'
import {
  agregarACola,
  aplicarResultado,
  clasificarFalloDeEnvio,
  crearEntradaDeCola,
  pendientesDeEnvio,
  quitarDeCola,
  rechazadasEnCola,
  type ResultadoDeEnvio,
  type SolicitudEnCola
} from '../services/colaEnvio'
import { useActualizacionStore } from './actualizacionStore'
import { useDisponibilidadStore } from './disponibilidadStore'

/** Una solicitud que no recibe respuesta en este tiempo se trata como "sin señal" y se reintenta después. */
export const TIEMPO_ENVIO_MS = 20000
/** Cada cuánto se reintenta mientras haya solicitudes pendientes o se sepa que no hay servidor. */
export const INTERVALO_REINTENTO_MS = 15000

export const useColaEnvioStore = defineStore('colaEnvio', () => {
  const entradas = ref<SolicitudEnCola[]>([])
  const sincronizando = ref(false)
  const cargada = ref(false)

  const pendientes = computed(() => pendientesDeEnvio(entradas.value))
  const rechazadas = computed(() => rechazadasEnCola(entradas.value))

  let reloj: ReturnType<typeof setInterval> | null = null
  let quitarOyentes: (() => void) | null = null

  async function persistir(nueva: SolicitudEnCola[]): Promise<void> {
    await repositorios().colaEnvio.guardar(nueva)
    entradas.value = nueva
  }

  /** Lee del dispositivo lo que quedó pendiente de otras veces. */
  async function init(): Promise<void> {
    try {
      entradas.value = await repositorios().colaEnvio.listar()
    } catch (e) {
      console.warn('[ColaEnvío] No se pudo leer la cola guardada:', e)
    }
    cargada.value = true
  }

  /** ¿Esa solicitud quedó esperando señal? */
  function estaEnCola(id: string): boolean {
    return entradas.value.some(e => e.id === id)
  }

  /**
   * Guarda la solicitud para enviarla después. Lanza si no se pudo guardar en el dispositivo: en ese caso quien
   * llama no debe decirle al cliente que quedó guardada.
   */
  async function encolar(solicitud: ReservationRequest): Promise<void> {
    await persistir(agregarACola(entradas.value, crearEntradaDeCola(solicitud)))
    iniciarReintentos()
  }

  /** Intenta enviar las pendientes, una a una y en orden. Se detiene al primer fallo por falta de señal. */
  async function sincronizar(): Promise<{ enviadas: number }> {
    if (sincronizando.value || pendientes.value.length === 0) return { enviadas: 0 }
    sincronizando.value = true
    let enviadas = 0
    try {
      for (const entrada of [...pendientes.value]) {
        let resultado: ResultadoDeEnvio
        try {
          await conTiempoLimite(repositorios().requests.create(entrada.solicitud), TIEMPO_ENVIO_MS)
          resultado = { tipo: 'enviada' }
          marcarServidorActivo()
          enviadas++
        } catch (e) {
          resultado = clasificarFalloDeEnvio(e)
          if (resultado.tipo === 'sin-red') marcarServidorCaido()
          else marcarServidorActivo() // el servidor respondió: rechazó la solicitud, pero hay conexión
        }
        await persistir(aplicarResultado(entradas.value, entrada.id, resultado))
        if (resultado.tipo === 'sin-red') break
      }
    } finally {
      sincronizando.value = false
    }
    if (enviadas > 0) void useDisponibilidadStore().refrescar()
    if (pendientes.value.length === 0) detenerReintentos()
    return { enviadas }
  }

  /** El cliente descarta una solicitud (rechazada, o una que ya no quiere enviar). */
  async function descartar(id: string): Promise<void> {
    await persistir(quitarDeCola(entradas.value, id))
    if (pendientes.value.length === 0) detenerReintentos()
  }

  async function reintentar(): Promise<void> {
    try {
      await sincronizar()
    } catch (e) {
      console.warn('[ColaEnvío] No se pudo sincronizar:', e)
    }
  }

  /** Mientras haya algo pendiente o el servidor no responda, vuelve a intentar cada pocos segundos. */
  function iniciarReintentos(): void {
    if (reloj || typeof setInterval === 'undefined') return
    reloj = setInterval(() => {
      if (pendientes.value.length > 0) void reintentar()
      else if (servidorInalcanzable.value) void useActualizacionStore().refrescarTodo()
      else detenerReintentos()
    }, INTERVALO_REINTENTO_MS)
  }

  function detenerReintentos(): void {
    if (reloj) clearInterval(reloj)
    reloj = null
  }

  /** Al arrancar la app: carga la cola, intenta enviar y queda atenta a la conexión. Se llama una sola vez. */
  async function iniciar(): Promise<void> {
    await init()
    if (typeof window !== 'undefined' && !quitarOyentes) {
      const alVolver = () => {
        if (typeof document === 'undefined' || document.visibilityState === 'visible') void reintentar()
      }
      window.addEventListener('online', alVolver)
      document.addEventListener('visibilitychange', alVolver)
      quitarOyentes = () => {
        window.removeEventListener('online', alVolver)
        document.removeEventListener('visibilitychange', alVolver)
        quitarOyentes = null
      }
    }
    if (pendientes.value.length > 0) {
      iniciarReintentos()
      void reintentar()
    }
  }

  function detener(): void {
    detenerReintentos()
    quitarOyentes?.()
  }

  return {
    entradas,
    pendientes,
    rechazadas,
    sincronizando,
    cargada,
    init,
    iniciar,
    detener,
    estaEnCola,
    encolar,
    sincronizar,
    reintentar,
    descartar
  }
})
