// src/stores/requestsStore.ts

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ReservationRequest, BookingStatus } from '../types/domain'
import { generateUUID } from '../lib/id'
import { repositorios } from '../lib/repositories'
import { persistirConReversion } from '../lib/persistirConReversion'
import { mensajeDeError } from '../lib/errores'
import { applyRequestEdit, type RequestEdit } from '../services/requests'
import { useCatalogStore } from './catalogStore'
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
      requests.value = await repositorios().requests.list()
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
    if (escrituras > 0) {
      refrescoPendiente = true
      return false
    }
    const nuevas = await repositorios().requests.list()
    if (escrituras > 0) {
      // Se empezó a guardar mientras llegaba la respuesta: puede ser anterior al cambio
      refrescoPendiente = true
      return false
    }
    if (JSON.stringify(nuevas) !== JSON.stringify(requests.value)) requests.value = nuevas
    isReady.value = true
    return true
  }

  /** Reemplaza la solicitud `id` por `nueva` en pantalla, la guarda y, si falla, deja la anterior y lanza el error. */
  async function reemplazar(
    id: string,
    nueva: ReservationRequest,
    mensaje: string
  ): Promise<void> {
    const indice = requests.value.findIndex(r => r.id === id)
    if (indice === -1) return
    const previa = requests.value[indice]
    await conEscritura(() => persistirConReversion({
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
        persistir: () => repositorios().requests.create(req),
        mensaje: 'No se pudo registrar la solicitud.'
      }))
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
      await reemplazar(id, nueva, 'No se pudo cambiar el estado de la solicitud.')
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
      await conEscritura(() => persistirConReversion({
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
      await conEscritura(() => persistirConReversion({
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
  async function updateRequestDetails(id: string, edit: RequestEdit): Promise<{ ok: boolean; message?: string }> {
    const found = requests.value.find(r => r.id === id)
    if (!found) return { ok: false, message: 'No se encontró la solicitud.' }

    const catalogStore = useCatalogStore()
    const settingsStore = useSettingsStore()
    const result = applyRequestEdit(found, edit, {
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
    })
    if (!result.ok) return { ok: false, message: result.message }

    try {
      await reemplazar(id, result.request, 'No se pudieron guardar los cambios de la solicitud.')
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
      await reemplazar(id, nueva, 'No se pudo dar más plazo para el abono.')
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
    registerPayment,
    removePayment,
    crossedRequestsFor,
    confirmRequest,
    rejectRequest,
    cancelOverdueRequest,
    extendDepositDeadline
  }
})
