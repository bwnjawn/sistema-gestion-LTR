// src/stores/requestsStore.ts

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ReservationRequest, BookingStatus } from '../types/domain'
import { generateUUID } from '../lib/id'
import { repositorios } from '../lib/repositories'
import { persistirConReversion } from '../lib/persistirConReversion'
import { mensajeDeError, esErrorDeRed } from '../lib/errores'
import { conTiempoLimite } from '../lib/conTiempoLimite'
import { marcarServidorCaido, servidorInalcanzable } from '../lib/estadoDeRed'
import { avisarGuardadoSinConexion } from '../lib/avisos'
import {
  avisoDeEdicion,
  avisoDeEstado,
  avisoDePago,
  avisoPlazoAmpliado,
  textoGuardadoSinConexion,
  type AvisoDeAccion
} from '../services/mensajesAvisos'
import { requestToBooking } from '../services/adaptadoresReserva'
import { applyRequestEdit, puedeCancelarse, type RequestEdit, type RequestEditContext } from '../services/requests'
import { compararCambio, type ResultadoDeComparacion } from '../services/comparacionCambio'
import { useCatalogStore } from './catalogStore'
import { TIEMPO_ENVIO_MS, useColaEnvioStore } from './colaEnvioStore'
import { TIEMPO_CAMBIO_MS, TIEMPO_CAMBIO_SIN_SENAL_MS, useCambiosAdminStore } from './cambiosAdminStore'
import { aplicarCambios, resumenDeGuardado, resumenDePago, type CambioAdmin } from '../services/cambiosAdmin'
import { useDisponibilidadStore } from './disponibilidadStore'
import { useSettingsStore } from './settingsStore'
import {
  buildPayment,
  calculateInitialDepositDueAt,
  validatePayment,
  type PaymentInput
} from '../services/payments'
import { findConflicts, groupConflictsByRequest } from '../services/availability'
import { getCrossedRequests, puedeConfirmarse, solicitudesPorMover, type SolicitudEnCruce } from '../services/cruces'

export type { ReservationRequest }

export const useRequestsStore = defineStore('requests', () => {
  // La solicitud más reciente va primero
  const requests = ref<ReservationRequest[]>([])

  const isLoading = ref(false)
  const isReady = ref(false)
  const error = ref<string | null>(null)

  // Cuántas escrituras del administrador hay en curso. Mientras haya alguna no se actualiza la lista desde el
  // servidor: el resultado podría ser anterior al cambio y pisarlo en pantalla (SCRUM-273).
  let escrituras = 0
  let refrescoPendiente = false

  // Solicitudes activas que no caben juntas (SCRUM-60); se recalcula solo al cambiar las solicitudes o los aforos
  const conflicts = computed(() => findConflicts(requests.value, useSettingsStore().limitesAforo))
  const conflictsByRequestId = computed(() => groupConflictsByRequest(conflicts.value))

  // Pendientes "por mover": su fecha ya la ocupa una confirmada, no se pueden aprobar. Id -> confirmadas que la bloquean.
  const porMoverPorId = computed(() => solicitudesPorMover(requests.value, useSettingsStore().limitesAforo))

  /** Códigos ya usados, para que una solicitud nueva no repita ninguno. */
  const requestCodes = computed(() => requests.value.map(r => r.requestCode))

  /** Carga las solicitudes desde el repositorio. Se llama una vez al arrancar la app. */
  async function init(): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      // Con cambios del administrador sin sincronizar, se ven encima de lo que dice el servidor (SCRUM-250)
      requests.value = aplicarCambios(await repositorios().requests.list(), useCambiosAdminStore().entradas)
      isReady.value = true
    } catch (e) {
      error.value = mensajeDeError(e, 'No se pudieron cargar las solicitudes.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /** Marca una escritura en curso; al terminar la última, hace la actualización que quedó pendiente. */
  async function conEscritura<T>(accion: () => Promise<T>): Promise<T> {
    escrituras++
    try {
      return await accion()
    } finally {
      escrituras--
      if (escrituras === 0 && refrescoPendiente) {
        refrescoPendiente = false
        void refrescar().catch(e => console.warn('[Solicitudes] No se pudo actualizar:', e))
      }
    }
  }

  /**
   * Vuelve a pedir las solicitudes al servidor (otro dispositivo pudo cambiarlas). No toca la pantalla si no cambió
   * nada, y se pospone mientras haya una escritura en curso. Devuelve si pidió y aplicó la lista. Si falla, lanza el
   * error: quien llama decide si avisa.
   */
  async function refrescar(): Promise<boolean> {
    // Mientras se envían los cambios guardados, la lista del servidor puede estar a medias
    if (escrituras > 0 || useCambiosAdminStore().sincronizando) {
      refrescoPendiente = true
      return false
    }
    const nuevas = aplicarCambios(await repositorios().requests.list(), useCambiosAdminStore().entradas)
    if (escrituras > 0 || useCambiosAdminStore().sincronizando) {
      // Se empezó a guardar mientras llegaba la respuesta: puede ser anterior al cambio
      refrescoPendiente = true
      return false
    }
    if (JSON.stringify(nuevas) !== JSON.stringify(requests.value)) requests.value = nuevas
    isReady.value = true
    return true
  }

  /**
   * Como `persistirConReversion`, pero sin señal el cambio del administrador no se revierte: queda guardado en el
   * dispositivo, se ve en pantalla con la marca "Sin sincronizar" y se envía al volver la conexión (SCRUM-250).
   * Detrás de cambios ya pendientes también se encola, para no enviarlos fuera de orden.
   */
  function persistirOEncolar<T>(o: {
    aplicar: () => void
    revertir: () => void
    persistir: () => Promise<T>
    mensaje: string
    cambio: CambioAdmin
    resumen: string
    /** Aviso de arriba: verde si se guardó, azul si quedó en la cola sin conexión (SCRUM-288). */
    aviso?: AvisoDeAccion
  }): Promise<T | undefined> {
    let enCola = false
    const avisarCola = () => {
      enCola = true
      if (o.aviso) avisarGuardadoSinConexion(textoGuardadoSinConexion(o.aviso))
    }
    return persistirConReversion<T | undefined>({
      aplicar: o.aplicar,
      revertir: o.revertir,
      mensaje: o.mensaje,
      // Si solo quedó en la cola ya avisó el azul: nunca se dice "listo" de lo que aún no llegó al servidor
      exito: () => (enCola || !o.aviso ? null : { titulo: o.aviso.titulo, detalle: o.aviso.detalle, tono: o.aviso.tono }),
      persistir: async () => {
        const cola = useCambiosAdminStore()
        if (cola.pendientes.length > 0) {
          await cola.encolar(o.cambio, o.resumen)
          void cola.reintentar()
          avisarCola()
          return undefined
        }
        try {
          return await conTiempoLimite(o.persistir(), servidorInalcanzable.value ? TIEMPO_CAMBIO_SIN_SENAL_MS : TIEMPO_CAMBIO_MS)
        } catch (e) {
          if (!esErrorDeRed(e)) throw e
          marcarServidorCaido()
          try {
            await cola.encolar(o.cambio, o.resumen)
          } catch (errorAlGuardar) {
            console.error('[Solicitudes] No se pudo guardar el cambio en el dispositivo:', errorAlGuardar)
            throw e
          }
          avisarCola()
          return undefined
        }
      }
    })
  }

  /** Reemplaza la solicitud `id` por `nueva` en pantalla, la guarda y, si falla, deja la anterior y lanza el error. */
  async function reemplazar(
    id: string,
    nueva: ReservationRequest,
    mensaje: string,
    crearAviso?: (previa: ReservationRequest, nueva: ReservationRequest) => AvisoDeAccion
  ): Promise<void> {
    const indice = requests.value.findIndex(r => r.id === id)
    if (indice === -1) return
    const previa = requests.value[indice]
    // Cualquier acción del administrador sobre la solicitud da por vista su marca "en conflicto"
    const { enConflicto: _resuelta, ...sinMarca } = nueva
    nueva = sinMarca
    await conEscritura(() => persistirOEncolar({
      cambio: { tipo: 'guardar', solicitud: nueva, esNueva: false },
      resumen: resumenDeGuardado(previa, nueva),
      aviso: crearAviso?.(previa, nueva),
      aplicar: () => { requests.value[indice] = nueva },
      revertir: () => {
        const actual = requests.value.findIndex(r => r.id === id)
        if (actual !== -1) requests.value[actual] = previa
      },
      persistir: () => repositorios().requests.update(id, nueva),
      mensaje
    }))
    // Confirmar, cancelar o mover una reserva cambia lo que ve el cliente en el calendario
    void useDisponibilidadStore().refrescar()
  }

  /**
   * Crea la solicitud en el servidor. Si es del cliente y no hay señal (o el servidor no responde), la deja en la
   * cola de envío para mandarla cuando vuelva la conexión (SCRUM-250). La del administrador no se encola todavía:
   * falla con el aviso de siempre. Si no se puede ni guardar en el teléfono, lanza el error original.
   */
  async function crearOEncolar(req: ReservationRequest): Promise<ReservationRequest> {
    const esCliente = requestToBooking(req).origin === 'cliente'
    const cambios = useCambiosAdminStore()
    // La del administrador va detrás de sus cambios pendientes, para no enviarse fuera de orden
    if (!esCliente && cambios.pendientes.length > 0) {
      await cambios.encolar({ tipo: 'guardar', solicitud: req, esNueva: true }, resumenDeGuardado(undefined, req))
      void cambios.reintentar()
      return req
    }
    try {
      return await conTiempoLimite(repositorios().requests.create(req), esCliente ? TIEMPO_ENVIO_MS : TIEMPO_CAMBIO_MS)
    } catch (e) {
      if (!esErrorDeRed(e)) throw e
      marcarServidorCaido()
      if (!esCliente) {
        // Sin señal, la reserva del administrador queda guardada en el dispositivo (SCRUM-250)
        try {
          await cambios.encolar({ tipo: 'guardar', solicitud: req, esNueva: true }, resumenDeGuardado(undefined, req))
        } catch (errorAlGuardar) {
          console.error('[Solicitudes] No se pudo guardar la reserva en el dispositivo:', errorAlGuardar)
          throw e
        }
        return req
      }
      try {
        await useColaEnvioStore().encolar(req)
      } catch (errorAlGuardar) {
        console.error('[Solicitudes] No se pudo guardar la solicitud en el teléfono:', errorAlGuardar)
        throw e
      }
      return req
    }
  }

  // `status` solo se indica al cargar una reserva como administrador; el cliente siempre entra como pendiente.
  async function addRequest(
    newReq: Omit<ReservationRequest, 'id' | 'status' | 'createdAt'>,
    status: BookingStatus = 'pending'
  ): Promise<ReservationRequest> {
    isLoading.value = true
    error.value = null
    const req: ReservationRequest = {
      ...newReq,
      id: generateUUID(),
      status,
      createdAt: new Date().toISOString()
    }
    // Las pendientes tienen plazo para el abono desde que se envían; las confirmadas no
    req.depositDueAt = calculateInitialDepositDueAt(req, useSettingsStore().depositDeadlineHours)
    try {
      // Con Supabase el servidor asigna el código y calcula los montos: se queda con lo que devuelve
      const creada = await conEscritura(() => persistirConReversion({
        aplicar: () => { requests.value.unshift(req) },
        revertir: () => { requests.value = requests.value.filter(r => r.id !== req.id) },
        persistir: () => crearOEncolar(req),
        mensaje: 'No se pudo registrar la solicitud.'
      }))
      // Sin señal, la solicitud del cliente quedó guardada en el teléfono (SCRUM-250): no es una solicitud del
      // panel todavía y los datos del servidor (código, montos) llegan al enviarse
      if (useColaEnvioStore().estaEnCola(req.id)) {
        requests.value = requests.value.filter(r => r.id !== req.id)
        return creada
      }
      const indice = requests.value.findIndex(r => r.id === req.id)
      if (indice !== -1) requests.value[indice] = creada
      void useDisponibilidadStore().refrescar()
      return creada
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al registrar la solicitud de reserva.')
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /** Cambia el estado de una solicitud. Devuelve si se pudo guardar. */
  async function updateRequestStatus(id: string, status: BookingStatus): Promise<boolean> {
    const found = requests.value.find(r => r.id === id)
    if (!found) return false
    isLoading.value = true
    error.value = null
    try {
      // Confirmada: el abono ya no se espera con plazo
      const nueva: ReservationRequest = { ...found, status, depositDueAt: status === 'confirmed' ? undefined : found.depositDueAt }
      await reemplazar(id, nueva, 'No se pudo cambiar el estado de la solicitud.', (previa, n) => avisoDeEstado(previa.status, n.status, n))
      return true
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al actualizar el estado de la solicitud.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Registra un pago recibido sobre una solicitud.
   * Devuelve { ok: false, message } si el monto no es válido o no se pudo guardar.
   */
  async function registerPayment(id: string, input: PaymentInput): Promise<{ ok: boolean; message?: string }> {
    const found = requests.value.find(r => r.id === id)
    if (!found) return { ok: false, message: 'No se encontró la solicitud.' }

    const validation = validatePayment(found, input)
    if (!validation.isValid) return { ok: false, message: validation.message }

    const pago = buildPayment(input)
    try {
      await conEscritura(() => persistirOEncolar({
        cambio: { tipo: 'pago-agregar', solicitudId: id, pago },
        resumen: resumenDePago('agregar', found, pago.amount),
        aviso: avisoDePago('registrado', found, pago.amount),
        aplicar: () => { found.payments.push(pago) },
        revertir: () => { found.payments = found.payments.filter(p => p.id !== pago.id) },
        persistir: () => repositorios().payments.add(id, pago),
        mensaje: 'No se pudo registrar el pago.'
      }))
      return { ok: true }
    } catch (e) {
      return { ok: false, message: mensajeDeError(e, 'No se pudo registrar el pago.') }
    }
  }

  async function removePayment(id: string, paymentId: string): Promise<void> {
    const found = requests.value.find(r => r.id === id)
    if (!found) return
    const previos = [...found.payments]
    try {
      await conEscritura(() => persistirOEncolar({
        cambio: { tipo: 'pago-quitar', solicitudId: id, pagoId: paymentId },
        resumen: resumenDePago('quitar', found, previos.find(p => p.id === paymentId)?.amount),
        aviso: avisoDePago('quitado', found, previos.find(p => p.id === paymentId)?.amount),
        aplicar: () => { found.payments = previos.filter(p => p.id !== paymentId) },
        revertir: () => { found.payments = previos },
        persistir: () => repositorios().payments.remove(id, paymentId),
        mensaje: 'No se pudo quitar el pago.'
      }))
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al quitar el pago.')
    }
  }

  /** Modifica una solicitud viva. Valida, recalcula el precio y persiste; no cambia el estado. */
  function contextoDeEdicion(): RequestEditContext {
    const catalogStore = useCatalogStore()
    const settingsStore = useSettingsStore()
    return {
      requests: requests.value,
      cabins: catalogStore.todasLasCabanas,
      campingSites: catalogStore.todosLosSitios,
      currentRates: {
        depositPercentage: settingsStore.defaultDepositPercentage,
        ivaPercentage: settingsStore.ivaPercentage
      },
      capacidades: {
        restaurante: settingsStore.restaurantCapacity,
        camping: settingsStore.limitesAforo.campingPersonas
      }
    }
  }

  /** El antes y el después de un cambio, sin guardar nada: lo que se muestra es lo que `updateRequestDetails` aplicaría. */
  function previsualizarEdicion(id: string, edit: RequestEdit): ResultadoDeComparacion {
    const found = requests.value.find(r => r.id === id)
    if (!found) return { ok: false, message: 'No se encontró la solicitud.' }
    return compararCambio(found, edit, contextoDeEdicion())
  }

  async function updateRequestDetails(id: string, edit: RequestEdit): Promise<{ ok: boolean; message?: string }> {
    const found = requests.value.find(r => r.id === id)
    if (!found) return { ok: false, message: 'No se encontró la solicitud.' }

    const result = applyRequestEdit(found, edit, contextoDeEdicion())
    if (!result.ok) return { ok: false, message: result.message }

    try {
      await reemplazar(id, result.request, 'No se pudieron guardar los cambios de la solicitud.', (previa, n) => avisoDeEdicion(previa, n))
      return { ok: true }
    } catch (e) {
      return { ok: false, message: mensajeDeError(e, 'No se pudieron guardar los cambios de la solicitud.') }
    }
  }

  /** Solicitudes que se cruzan con la indicada, para decidir cuál confirmar (SCRUM-262). Vacío si no hay cruces. */
  function crossedRequestsFor(id: string): SolicitudEnCruce[] {
    return getCrossedRequests(id, requests.value, useSettingsStore().limitesAforo)
  }

  /**
   * Confirma una solicitud. No confirma si chocaría con una reserva ya confirmada:
   * nunca deben quedar dos confirmadas cruzadas. Devuelve si se confirmó.
   */
  async function confirmRequest(id: string): Promise<boolean> {
    const found = requests.value.find(r => r.id === id)
    if (!found) return false
    if (!puedeConfirmarse(found, requests.value, useSettingsStore().limitesAforo)) {
      error.value = 'No se puede confirmar: ya hay una reserva confirmada en esas fechas o cupos.'
      return false
    }
    return updateRequestStatus(id, 'confirmed')
  }

  /**
   * Cancela una reserva confirmada (SCRUM-284): pasa a "Cancelada", libera sus fechas y cupos y queda en el
   * historial con sus pagos. Devuelve si se pudo guardar. Una solicitud que no está confirmada no se cancela:
   * las pendientes se rechazan.
   */
  async function cancelConfirmedRequest(id: string): Promise<boolean> {
    const found = requests.value.find(r => r.id === id)
    if (!found || !puedeCancelarse(found)) return false
    return updateRequestStatus(id, 'cancelled')
  }

  async function rejectRequest(id: string): Promise<void> {
    await updateRequestStatus(id, 'rejected')
  }

  /**
   * "Abono vencido": el admin decide cancelar la solicitud pendiente. La app nunca lo hace sola.
   * Las canceladas no cuentan en fechas ni cupos.
   */
  async function cancelOverdueRequest(id: string): Promise<void> {
    const found = requests.value.find(r => r.id === id)
    if (!found || found.status !== 'pending') return
    await updateRequestStatus(id, 'cancelled')
  }

  /** "Abono vencido": el admin decide esperar y se da un plazo nuevo desde ahora. */
  async function extendDepositDeadline(id: string): Promise<void> {
    const found = requests.value.find(r => r.id === id)
    if (!found || found.status !== 'pending') return
    try {
      const nueva: ReservationRequest = {
        ...found,
        depositDueAt: calculateInitialDepositDueAt(found, useSettingsStore().depositDeadlineHours)
      }
      await reemplazar(id, nueva, 'No se pudo dar más plazo para el abono.', (_previa, n) => avisoPlazoAmpliado(n, useSettingsStore().depositDeadlineHours))
    } catch (e) {
      error.value = mensajeDeError(e, 'Error al dar más plazo para el abono.')
    }
  }

  return {
    requests,
    isLoading,
    isReady,
    error,
    conflicts,
    conflictsByRequestId,
    porMoverPorId,
    requestCodes,
    init,
    refrescar,
    addRequest,
    updateRequestStatus,
    updateRequestDetails,
    previsualizarEdicion,
    registerPayment,
    removePayment,
    crossedRequestsFor,
    confirmRequest,
    cancelConfirmedRequest,
    rejectRequest,
    cancelOverdueRequest,
    extendDepositDeadline
  }
})
