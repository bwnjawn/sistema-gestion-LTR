// src/lib/repositories/supabase/solicitudes.ts
// Solicitudes de reserva en la tabla `reservas` (con sus comidas, ítems y pagos).
//  - El cliente (sin sesión) crea con la función `crear_solicitud`: el servidor valida y calcula el precio.
//  - El administrador crea y modifica con `admin_guardar_reserva`, que guarda todo en una sola operación.

import type { ReservationRequest } from '../../../types/domain'
import { requestToBooking } from '../../../services/adaptadoresReserva'
import { ErrorNoEncontrado } from '../../errores'
import { supabase } from '../../supabase'
import type { RequestRepository } from '../requestsRepository'
import { datosOLanzar, traducirError } from './errores'
import {
  payloadCrearSolicitud,
  payloadGuardarReserva,
  SELECT_RESERVA,
  solicitudConRespuesta,
  solicitudDeFila,
  type FilaReserva,
  type RespuestaCrearSolicitud
} from './mapeos'

const TAMANO_LOTE = 1000

export class SupabaseRequestRepository implements RequestRepository {
  /** Todas las solicitudes, la más reciente primero. Solo el administrador puede leerlas. */
  async list(): Promise<ReservationRequest[]> {
    const solicitudes: ReservationRequest[] = []
    for (let desde = 0; ; desde += TAMANO_LOTE) {
      const lote = datosOLanzar(
        await supabase()
          .from('reservas')
          .select(SELECT_RESERVA)
          .order('creada_en', { ascending: false })
          .order('id')
          .range(desde, desde + TAMANO_LOTE - 1),
        'No se pudieron cargar las solicitudes.'
      ) as unknown as FilaReserva[]
      solicitudes.push(...lote.map(solicitudDeFila))
      if (lote.length < TAMANO_LOTE) break
    }
    return solicitudes
  }

  async listByRange(desde: string, hasta: string): Promise<ReservationRequest[]> {
    const filas = datosOLanzar(
      await supabase()
        .from('reservas')
        .select(SELECT_RESERVA)
        .lte('fecha_inicio', hasta)
        .gte('fecha_fin', desde)
        .order('creada_en', { ascending: false }),
      'No se pudieron cargar las solicitudes.'
    ) as unknown as FilaReserva[]
    return filas.map(solicitudDeFila)
  }

  async getById(id: string): Promise<ReservationRequest | undefined> {
    const fila = datosOLanzar(
      await supabase().from('reservas').select(SELECT_RESERVA).eq('id', id).maybeSingle(),
      'No se pudo cargar la solicitud.'
    ) as unknown as FilaReserva | null
    return fila ? solicitudDeFila(fila) : undefined
  }

  /**
   * Una solicitud del cliente va por `crear_solicitud` y vuelve con el código, el estado y los montos que
   * decidió el servidor. Una cargada por el administrador se guarda directo y la base le asigna el código.
   */
  async create(item: ReservationRequest): Promise<ReservationRequest> {
    if (requestToBooking(item).origin === 'cliente') {
      const respuesta = datosOLanzar(
        await supabase().rpc('crear_solicitud', { p: payloadCrearSolicitud(item) }),
        'No se pudo enviar la solicitud.'
      ) as RespuestaCrearSolicitud
      return solicitudConRespuesta(item, respuesta)
    }
    const { id } = datosOLanzar(
      await supabase().rpc('admin_guardar_reserva', { p: payloadGuardarReserva(item, { conCodigo: false }) }),
      'No se pudo registrar la reserva.'
    ) as { id: string }
    return (await this.getById(id)) ?? item
  }

  async update(id: string, cambios: Partial<ReservationRequest>): Promise<ReservationRequest> {
    const actual = await this.getById(id)
    if (!actual) throw new ErrorNoEncontrado('la solicitud', id)
    const nueva: ReservationRequest = { ...actual, ...cambios, id }
    datosOLanzar(
      await supabase().rpc('admin_guardar_reserva', { p: payloadGuardarReserva(nueva, { conCodigo: true }) }),
      'No se pudieron guardar los cambios de la solicitud.'
    )
    return (await this.getById(id)) ?? nueva
  }

  async remove(id: string): Promise<void> {
    const resultado = await supabase().from('reservas').delete().eq('id', id)
    if (resultado.error) throw traducirError(resultado.error, 'No se pudo eliminar la solicitud.')
  }
}
