// src/lib/repositories/supabase/avisosPush.ts
// Dispositivos del administrador con avisos push activados, en la tabla `suscripciones_push` (migración 11).

import type { SuscripcionDelNavegador } from '../../avisosPush'
import { supabase } from '../../supabase'
import type { AvisosPushRepository } from '../avisosPushRepository'
import { datosOLanzar } from './errores'

export class SupabaseAvisosPushRepository implements AvisosPushRepository {
  readonly disponible = true

  async guardar(suscripcion: SuscripcionDelNavegador, agente: string): Promise<void> {
    datosOLanzar(
      await supabase().rpc('registrar_suscripcion_push', {
        p_endpoint: suscripcion.endpoint,
        p_p256dh: suscripcion.p256dh,
        p_auth: suscripcion.auth,
        p_agente: agente.slice(0, 200)
      }),
      'No se pudieron activar los avisos.'
    )
  }

  async quitar(endpoint: string): Promise<void> {
    datosOLanzar(
      await supabase().from('suscripciones_push').delete().eq('endpoint', endpoint),
      'No se pudieron desactivar los avisos.'
    )
  }
}
