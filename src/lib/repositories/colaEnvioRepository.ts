// src/lib/repositories/colaEnvioRepository.ts
// Dónde se guarda la cola de solicitudes por enviar (SCRUM-250). Vive en el dispositivo (IndexedDB), no en
// Supabase: son justamente las solicitudes que aún no llegaron al servidor.

import { guardarSinConexion, leerSinConexion } from '../almacenSinConexion'
import type { SolicitudEnCola } from '../../services/colaEnvio'

export interface ColaEnvioRepository {
  listar(): Promise<SolicitudEnCola[]>
  /** Reemplaza la cola completa. */
  guardar(cola: SolicitudEnCola[]): Promise<void>
}

const CLAVE = 'cola_envio'

export class ColaEnvioIndexedDb implements ColaEnvioRepository {
  async listar(): Promise<SolicitudEnCola[]> {
    return (await leerSinConexion<SolicitudEnCola[]>(CLAVE)) ?? []
  }

  async guardar(cola: SolicitudEnCola[]): Promise<void> {
    await guardarSinConexion(CLAVE, cola)
  }
}
