// src/lib/repositories/avisosPushRepository.ts
// Dónde se guardan los dispositivos del administrador que activaron los avisos push (SCRUM-68). Con Supabase van a
// la tabla `suscripciones_push` (ver ./supabase/avisosPush.ts); sin Supabase no hay quién envíe avisos, así que
// la versión local no guarda nada y la tarjeta de Ajustes dice que no está disponible.

import type { SuscripcionDelNavegador } from '../avisosPush'

export interface AvisosPushRepository {
  /** Los avisos push solo existen con Supabase (algo tiene que enviarlos). */
  readonly disponible: boolean
  guardar(suscripcion: SuscripcionDelNavegador, agente: string): Promise<void>
  quitar(endpoint: string): Promise<void>
}

export class LocalAvisosPushRepository implements AvisosPushRepository {
  readonly disponible = false
  async guardar(): Promise<void> {
    // Sin Supabase no hay nada que guardar
  }
  async quitar(): Promise<void> {
    // Sin Supabase no hay nada que quitar
  }
}
