// src/lib/repositories/paymentsRepository.ts
// Pagos registrados sobre una solicitud. Con Supabase (SCRUM-248) son filas de `pagos`; en el almacenamiento
// local viven dentro de la solicitud, así que este repositorio trabaja sobre el de solicitudes.

import type { Payment } from '../../types/domain'
import { ErrorNoEncontrado } from '../errores'
import type { RequestRepository } from './requestsRepository'

export interface PaymentRepository {
  listByRequest(requestId: string): Promise<Payment[]>
  add(requestId: string, pago: Payment): Promise<Payment>
  remove(requestId: string, paymentId: string): Promise<void>
}

export class LocalPaymentRepository implements PaymentRepository {
  private readonly solicitudes: RequestRepository

  constructor(solicitudes: RequestRepository) {
    this.solicitudes = solicitudes
  }

  private async solicitud(requestId: string) {
    const req = await this.solicitudes.getById(requestId)
    if (!req) throw new ErrorNoEncontrado('la solicitud', requestId)
    return req
  }

  async listByRequest(requestId: string): Promise<Payment[]> {
    return (await this.solicitud(requestId)).payments ?? []
  }

  async add(requestId: string, pago: Payment): Promise<Payment> {
    const req = await this.solicitud(requestId)
    await this.solicitudes.update(requestId, { payments: [...(req.payments ?? []), pago] })
    return pago
  }

  async remove(requestId: string, paymentId: string): Promise<void> {
    const req = await this.solicitud(requestId)
    await this.solicitudes.update(requestId, { payments: (req.payments ?? []).filter(p => p.id !== paymentId) })
  }
}
