// src/stores/requestsStore.ts

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { ReservationRequest, BookingStatus } from '../types/domain'
import { generateUUID } from '../lib/id'
import { requestsRepository } from '../lib/repositories/requestsRepository'
import { getStorageItem, setStorageItem } from '../lib/persistence'
import { applyRequestEdit, normalizeRequest, type RequestEdit } from '../services/requests'
import { useCatalogStore } from './catalogStore'
import { useSettingsStore } from './settingsStore'
import {
  buildPayment,
  calculateInitialDepositDueAt,
  validatePayment,
  type PaymentInput
} from '../services/payments'
import { findConflicts, groupConflictsByRequest } from '../services/availability'
import { getCrossedRequests, puedeConfirmarse, type SolicitudEnCruce } from '../services/cruces'

export type { ReservationRequest }

export const useRequestsStore = defineStore('requests', () => {
  const requests = ref<ReservationRequest[]>(
    getStorageItem<ReservationRequest[]>('requests', []).map(normalizeRequest)
  )

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Solicitudes activas que no caben juntas (SCRUM-60); se recalcula solo al cambiar las solicitudes o los aforos
  const conflicts = computed(() => findConflicts(requests.value, useSettingsStore().limitesAforo))
  const conflictsByRequestId = computed(() => groupConflictsByRequest(conflicts.value))

  watch(
    requests,
    async (val) => {
      setStorageItem('requests', val)
      await requestsRepository.saveRequests(val)
    },
    { deep: true }
  )

  /** Códigos ya usados, para que una solicitud nueva no repita ninguno. */
  const requestCodes = computed(() => requests.value.map(r => r.requestCode))

  // `status` solo se indica al cargar una reserva como administrador; el cliente siempre entra como pendiente.
  async function addRequest(
    newReq: Omit<ReservationRequest, 'id' | 'status' | 'createdAt'>,
    status: BookingStatus = 'pending'
  ): Promise<ReservationRequest> {
    isLoading.value = true
    error.value = null
    try {
      const req: ReservationRequest = {
        ...newReq,
        id: generateUUID(),
        status,
        createdAt: new Date().toISOString()
      }
      // Las pendientes tienen plazo para el abono desde que se envían; las confirmadas no
      req.depositDueAt = calculateInitialDepositDueAt(req, useSettingsStore().depositDeadlineHours)
      requests.value.unshift(req)
      await requestsRepository.addRequest(req)
      return req
    } catch (e: any) {
      error.value = 'Error al registrar la solicitud de reserva.'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  async function updateRequestStatus(id: string, status: BookingStatus): Promise<void> {
    isLoading.value = true
    error.value = null
    try {
      const found = requests.value.find(r => r.id === id)
      if (found) {
        found.status = status
        // Confirmada: el abono ya no se espera con plazo
        if (status === 'confirmed') found.depositDueAt = undefined
        await requestsRepository.updateStatus(id, status)
      }
    } catch (e: any) {
      error.value = 'Error al actualizar el estado de la solicitud.'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Registra un pago recibido sobre una solicitud.
   * Devuelve { ok: false, message } si el monto no es válido.
   */
  function registerPayment(id: string, input: PaymentInput): { ok: boolean; message?: string } {
    const found = requests.value.find(r => r.id === id)
    if (!found) return { ok: false, message: 'No se encontró la solicitud.' }

    const validation = validatePayment(found, input)
    if (!validation.isValid) return { ok: false, message: validation.message }

    found.payments.push(buildPayment(input))
    return { ok: true }
  }

  function removePayment(id: string, paymentId: string): void {
    const found = requests.value.find(r => r.id === id)
    if (!found) return
    found.payments = found.payments.filter(p => p.id !== paymentId)
  }

  /** Modifica una solicitud viva. Valida, recalcula el precio y persiste; no cambia el estado. */
  function updateRequestDetails(id: string, edit: RequestEdit): { ok: boolean; message?: string } {
    const index = requests.value.findIndex(r => r.id === id)
    if (index === -1) return { ok: false, message: 'No se encontró la solicitud.' }

    const catalogStore = useCatalogStore()
    const settingsStore = useSettingsStore()
    const result = applyRequestEdit(requests.value[index], edit, {
      requests: requests.value,
      cabins: catalogStore.cabins,
      campingSites: catalogStore.campingSites,
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

    requests.value[index] = result.request
    return { ok: true }
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
    await updateRequestStatus(id, 'confirmed')
    return true
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
  function extendDepositDeadline(id: string): void {
    const found = requests.value.find(r => r.id === id)
    if (!found || found.status !== 'pending') return
    found.depositDueAt = calculateInitialDepositDueAt(found, useSettingsStore().depositDeadlineHours)
  }

  return {
    requests,
    isLoading,
    error,
    conflicts,
    conflictsByRequestId,
    requestCodes,
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