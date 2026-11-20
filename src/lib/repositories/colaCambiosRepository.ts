// src/lib/repositories/colaCambiosRepository.ts
// Dónde se guardan los cambios del administrador hechos sin conexión (SCRUM-250). Viven en el dispositivo
// (IndexedDB): son justamente los cambios que aún no llegaron al servidor.

import { guardarSinConexion, leerSinConexion } from '../almacenSinConexion'
import type { CambioEnCola } from '../../services/cambiosAdmin'

export interface ColaCambiosRepository {
  listar(): Promise<CambioEnCola[]>
  /** Reemplaza la cola completa. */
  guardar(cola: CambioEnCola[]): Promise<void>
}

const CLAVE = 'cola_cambios_admin'

export class ColaCambiosIndexedDb implements ColaCambiosRepository {
  async listar(): Promise<CambioEnCola[]> {
    return (await leerSinConexion<CambioEnCola[]>(CLAVE)) ?? []
  }

  async guardar(cola: CambioEnCola[]): Promise<void> {
    await guardarSinConexion(CLAVE, cola)
  }
}
