// src/lib/repositories/supabase/pagos.ts
// Pagos registrados sobre una solicitud (tabla `pagos`). Solo el administrador puede leerlos y escribirlos.

import type { Payment } from '../../../types/domain'
import { ErrorNoEncontrado } from '../../errores'
import { supabase } from '../../supabase'
import type { PaymentRepository } from '../paymentsRepository'
import { datosOLanzar, traducirError } from './errores'
import { pagoAFila, pagoDeFila, type FilaPago } from './mapeos'

export class SupabasePaymentRepository implements PaymentRepository {
  async listByRequest(requestId: string): Promise<Payment[]> {
    const filas = datosOLanzar(
      await supabase().from('pagos').select('*').eq('reserva_id', requestId).order('creado_en'),
      'No se pudieron cargar los pagos.'
    ) as FilaPago[]
    return filas.map(pagoDeFila)
  }

  async add(requestId: string, pago: Payment): Promise<Payment> {
    const { data } = await supabase().auth.getSession()
    // Idempotente: si el pago ya llegó (se reenvía tras un corte, SCRUM-250), no se duplica ni falla
    const resultado = await supabase()
      .from('pagos')
      .upsert(pagoAFila(pago, requestId, data.session?.user.id ?? null), { onConflict: 'id', ignoreDuplicates: true })
    if (resultado.error) {
      // La reserva ya no existe: la base lo informa con una restricción de clave foránea
      if (resultado.error.code === '23503') throw new ErrorNoEncontrado('la solicitud', requestId)
      throw traducirError(resultado.error, 'No se pudo registrar el pago.')
    }
    return pago
  }

  async remove(requestId: string, paymentId: string): Promise<void> {
    const resultado = await supabase().from('pagos').delete().eq('id', paymentId).eq('reserva_id', requestId)
    if (resultado.error) throw traducirError(resultado.error, 'No se pudo quitar el pago.')
  }
}
