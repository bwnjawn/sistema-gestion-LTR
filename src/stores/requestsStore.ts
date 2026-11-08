// src/stores/requestsStore.ts

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { ReservationRequest, BookingStatus } from '../types/domain'
import { generateUUID } from '../lib/id'
import { requestsRepository } from '../lib/repositories/requestsRepository'
import { getStorageItem, setStorageItem } from '../lib/persistence'
import { normalizeRequest } from '../services/requests'
import { buildPayment, validatePayment, type PaymentInput } from '../services/payments'

export type { ReservationRequest }

export const useRequestsStore = defineStore('requests', () => {
  const requests = ref<ReservationRequest[]>(
    getStorageItem<ReservationRequest[]>('requests', []).map(normalizeRequest)
  )

  const isLoading = ref(false)
  const error = ref<string | null>(null)

  watch(
    requests,
    async (val) => {
      setStorageItem('requests', val)
      await requestsRepository.saveRequests(val)
    },
    { deep: true }
  )

  async function addRequest(
    newReq: Omit<ReservationRequest, 'id' | 'status' | 'createdAt'>
  ): Promise<ReservationRequest> {
    isLoading.value = true
    error.value = null
    try {
      const req: ReservationRequest = {
        ...newReq,
        id: generateUUID(),
        status: 'pending',
        createdAt: new Date().toISOString()
      }
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

  async function confirmRequest(id: string): Promise<void> {
    await updateRequestStatus(id, 'confirmed')
  }

  async function rejectRequest(id: string): Promise<void> {
    await updateRequestStatus(id, 'rejected')
  }

  return {
    requests,
    isLoading,
    error,
    addRequest,
    updateRequestStatus,
    registerPayment,
    removePayment,
    confirmRequest,
    rejectRequest
  }
})