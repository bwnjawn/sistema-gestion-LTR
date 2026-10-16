// src/lib/repositories/requestsRepository.ts

import type { ReservationRequest, BookingStatus } from '../../types/domain'
import { getStorageItem, setStorageItem } from '../persistence'

export interface RequestsRepository {
  getRequests(): Promise<ReservationRequest[]>
  saveRequests(requests: ReservationRequest[]): Promise<void>
  addRequest(request: ReservationRequest): Promise<void>
  updateStatus(id: string, status: BookingStatus): Promise<void>
}

export class LocalRequestsRepository implements RequestsRepository {
  async getRequests(): Promise<ReservationRequest[]> {
    return getStorageItem('requests', [])
  }

  async saveRequests(requests: ReservationRequest[]): Promise<void> {
    setStorageItem('requests', requests)
  }

  async addRequest(request: ReservationRequest): Promise<void> {
    const list = await this.getRequests()
    list.unshift(request)
    await this.saveRequests(list)
  }

  async updateStatus(id: string, status: BookingStatus): Promise<void> {
    const list = await this.getRequests()
    const found = list.find(r => r.id === id)
    if (found) {
      found.status = status
      await this.saveRequests(list)
    }
  }
}

export const requestsRepository: RequestsRepository = new LocalRequestsRepository()