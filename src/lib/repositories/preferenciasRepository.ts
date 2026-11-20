// src/lib/repositories/preferenciasRepository.ts
// Preferencias de pantalla de este dispositivo (SCRUM-276). Viven en el navegador, no en Supabase: cada persona
// elige según su vista y su pantalla, y lo que elige un administrador no cambia lo que ve otro.

import { normalizarTamanoLetra, TAMANO_DE_LETRA_INICIAL, type TamanoLetra } from '../../services/preferencias'
import type { Almacenamiento } from '../persistence'
import { almacenamientoLocal } from '../persistence'

export interface PreferenciasRepository {
  leerTamanoLetra(): Promise<TamanoLetra>
  guardarTamanoLetra(tamano: TamanoLetra): Promise<void>
}

const CLAVE_TAMANO_LETRA = 'tamano_letra'

export class LocalPreferenciasRepository implements PreferenciasRepository {
  private readonly almacenamiento: Almacenamiento

  constructor(almacenamiento: Almacenamiento = almacenamientoLocal) {
    this.almacenamiento = almacenamiento
  }

  async leerTamanoLetra(): Promise<TamanoLetra> {
    return normalizarTamanoLetra(this.almacenamiento.leer<unknown>(CLAVE_TAMANO_LETRA, TAMANO_DE_LETRA_INICIAL))
  }

  async guardarTamanoLetra(tamano: TamanoLetra): Promise<void> {
    this.almacenamiento.escribir(CLAVE_TAMANO_LETRA, tamano)
  }
}
