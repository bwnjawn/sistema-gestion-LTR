// src/stores/cambiosAdminStore.ts
// Cambios del administrador hechos sin conexión (SCRUM-250). Se guardan en el dispositivo, se ven al instante en
// pantalla (`requestsStore` los aplica sobre la lista del servidor) y se envían en orden al volver la señal: al
// abrir la app, al volver la conexión o la pantalla, y cada pocos segundos mientras haya algo pendiente.
// Solo trabaja con sesión de administrador: sin ella el servidor no aceptaría nada.

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { conTiempoLimite } from '../lib/conTiempoLimite'
import { generateUUID } from '../lib/id'
import { marcarServidorActivo, marcarServidorCaido, servidorInalcanzable } from '../lib/estadoDeRed'
import { avisarExito } from '../lib/avisos'
import { avisoSincronizacion } from '../services/mensajesAvisos'
import { repositorios } from '../lib/repositories'
import {
  aplicarResultadoDeCambio,
  cambiosPendientes,
  cambiosRechazados,
  clasificarFalloDeCambio,
  crearCambioEnCola,
  idsSinSincronizar,
  comoEnConflicto,
  type CambioAdmin,
  type CambioEnCola,
  type ResultadoDeCambio
} from '../services/cambiosAdmin'
import { useDisponibilidadStore } from './disponibilidadStore'
import { useRequestsStore } from './requestsStore'

export const TIEMPO_CAMBIO_MS = 20000
/** Si ya se sabe que no hay servidor, un cambio nuevo espera poco antes de quedar en la cola. */
export const TIEMPO_CAMBIO_SIN_SENAL_MS = 4000
export const INTERVALO_REINTENTO_CAMBIOS_MS = 15000

export const useCambiosAdminStore = defineStore('cambiosAdmin', () => {
  const entradas = ref<CambioEnCola[]>([])
  const sincronizando = ref(false)
  const cargada = ref(false)
  /** Cuántas reservas quedaron "en conflicto" en la última sincronización (para avisar). */
  const conflictosNuevos = ref(0)

  const pendientes = computed(() => cambiosPendientes(entradas.value))
  const rechazados = computed(() => cambiosRechazados(entradas.value))
  const sinSincronizar = computed(() => idsSinSincronizar(entradas.value))

  let reloj: ReturnType<typeof setInterval> | null = null
  let quitarOyentes: (() => void) | null = null

  async function persistir(nueva: CambioEnCola[]): Promise<void> {
    await repositorios().colaCambios.guardar(nueva)
    entradas.value = nueva
  }

  async function init(): Promise<void> {
    try {
      entradas.value = await repositorios().colaCambios.listar()
    } catch (e) {
      console.warn('[CambiosAdmin] No se pudo leer la cola guardada:', e)
    }
    cargada.value = true
  }

  function estaSinSincronizar(solicitudId: string): boolean {
    return sinSincronizar.value.has(solicitudId)
  }

  /**
   * Guarda un cambio para enviarlo después. Lanza si no se pudo guardar en el dispositivo: en ese caso quien llama
   * no debe decirle al administrador que quedó guardado.
   */
  async function encolar(cambio: CambioAdmin, resumen: string): Promise<void> {
    await persistir([...entradas.value, crearCambioEnCola(cambio, resumen, generateUUID())])
    iniciarReintentos()
  }

  /** Ejecuta un cambio contra el servidor por el repositorio que corresponde. */
  async function ejecutar(cambio: CambioAdmin): Promise<void> {
    const repos = repositorios()
    if (cambio.tipo === 'guardar') {
      if (cambio.esNueva) await repos.requests.create(cambio.solicitud)
      else await repos.requests.update(cambio.solicitud.id, cambio.solicitud)
    } else if (cambio.tipo === 'pago-agregar') {
      await repos.payments.add(cambio.solicitudId, cambio.pago)
    } else {
      await repos.payments.remove(cambio.solicitudId, cambio.pagoId)
    }
  }

  async function intentar(cambio: CambioAdmin): Promise<ResultadoDeCambio> {
    try {
      await conTiempoLimite(ejecutar(cambio), TIEMPO_CAMBIO_MS)
      marcarServidorActivo()
      return { tipo: 'enviado' }
    } catch (e) {
      const resultado = clasificarFalloDeCambio(cambio, e)
      if (resultado.tipo === 'sin-red') marcarServidorCaido()
      else marcarServidorActivo() // el servidor respondió: hay conexión aunque rechazara el cambio
      return resultado
    }
  }

  /** Envía los cambios pendientes, uno a uno y en orden. Se detiene al primer fallo por falta de señal. */
  async function sincronizar(): Promise<{ enviados: number }> {
    if (sincronizando.value || pendientes.value.length === 0) return { enviados: 0 }
    sincronizando.value = true
    let enviados = 0
    let conflictosEstaVez = 0
    try {
      for (const entrada of [...pendientes.value]) {
        let resultado = await intentar(entrada.cambio)
        if (resultado.tipo === 'conflicto' && entrada.cambio.tipo === 'guardar') {
          // No se pierde ni se pisa: se guarda como pendiente y marcada "en conflicto". Primero se anota en la cola,
          // así se ve así aunque ahora se corte la señal.
          await persistir(aplicarResultadoDeCambio(entradas.value, entrada.id, resultado))
          const enConflicto: CambioAdmin = { ...entrada.cambio, solicitud: comoEnConflicto(entrada.cambio.solicitud) }
          resultado = await intentar(enConflicto)
          if (resultado.tipo === 'enviado') {
            conflictosNuevos.value++
            conflictosEstaVez++
          }
          // Una pendiente no puede chocar: si aun así lo rechaza, queda como cambio rechazado
          if (resultado.tipo === 'conflicto') resultado = { tipo: 'rechazado', motivo: 'Ya hay una reserva confirmada en esas fechas o cupos.' }
        }
        if (resultado.tipo === 'enviado') enviados++
        await persistir(aplicarResultadoDeCambio(entradas.value, entrada.id, resultado))
        if (resultado.tipo === 'sin-red') break
      }
    } finally {
      sincronizando.value = false
    }
    if (enviados > 0) {
      // Lo que quedó guardado en el teléfono ya llegó al servidor: el aviso azul de antes ahora es verde
      const aviso = avisoSincronizacion(enviados, conflictosEstaVez)
      avisarExito(aviso.titulo, aviso.detalle, aviso.tono)
    }
    if (enviados > 0 || (rechazados.value.length > 0 && !servidorInalcanzable.value)) {
      // Lo que ve el administrador pasa a ser lo que dice el servidor
      void useRequestsStore().refrescar().catch(e => console.warn('[CambiosAdmin] No se pudo actualizar:', e))
      void useDisponibilidadStore().refrescar()
    }
    if (pendientes.value.length === 0) detenerReintentos()
    return { enviados }
  }

  async function reintentar(): Promise<void> {
    try {
      await sincronizar()
    } catch (e) {
      console.warn('[CambiosAdmin] No se pudo sincronizar:', e)
    }
  }

  /** El administrador descarta un cambio rechazado: la reserva vuelve a verse como la tiene el servidor. */
  async function descartar(id: string): Promise<void> {
    await persistir(entradas.value.filter(c => c.id !== id))
    if (pendientes.value.length === 0) detenerReintentos()
    void useRequestsStore().refrescar().catch(e => console.warn('[CambiosAdmin] No se pudo actualizar:', e))
  }

  function iniciarReintentos(): void {
    if (reloj || typeof setInterval === 'undefined') return
    reloj = setInterval(() => {
      if (pendientes.value.length > 0) void reintentar()
      else detenerReintentos()
    }, INTERVALO_REINTENTO_CAMBIOS_MS)
  }

  function detenerReintentos(): void {
    if (reloj) clearInterval(reloj)
    reloj = null
  }

  /** Con sesión de administrador: carga la cola guardada, intenta enviar y queda atenta a la conexión. */
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

  /** Al cerrar sesión. */
  function detener(): void {
    detenerReintentos()
    quitarOyentes?.()
  }

  return {
    entradas,
    pendientes,
    rechazados,
    sinSincronizar,
    sincronizando,
    cargada,
    conflictosNuevos,
    init,
    iniciar,
    detener,
    estaSinSincronizar,
    encolar,
    sincronizar,
    reintentar,
    descartar
  }
})
