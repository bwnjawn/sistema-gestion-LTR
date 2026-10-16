// src/lib/repositories/paymentsRepository.ts

import { getStorageItem, setStorageItem } from '../persistence'

export interface PaymentRecord {
  requestId: string
  amount: number
  depositPercentage: number
  status: 'pending' | 'completed' | 'refunded'
  updatedAt: string
}

export interface PaymentsRepository {
  getPayments(): Promise<PaymentRecord[]>
  savePayment(record: PaymentRecord): Promise<void>
  getPaymentByRequestId(requestId: string): Promise<PaymentRecord | undefined>
}

export class LocalPaymentsRepository implements PaymentsRepository {
  async getPayments(): Promise<PaymentRecord[]> {
    return getStorageItem('payments', [])
  }

  async savePayment(record: PaymentRecord): Promise<void> {
    const list = await this.getPayments()
    const idx = list.findIndex(p => p.requestId === record.requestId)
    if (idx !== -1) {
      list[idx] = record
    } else {
      list.push(record)
    }
    setStorageItem('payments', list)
  }

  async getPaymentByRequestId(requestId: string): Promise<PaymentRecord | undefined> {
    const list = await this.getPayments()
    return list.find(p => p.requestId === requestId)
  }
}

export const paymentsRepository: PaymentsRepository = new LocalPaymentsRepository()