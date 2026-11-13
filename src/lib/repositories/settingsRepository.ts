// src/lib/repositories/settingsRepository.ts
// Ajustes del negocio: contacto, transferencia, parámetros y horarios. Un valor por clave.
// Con Supabase (SCRUM-248) son las filas de la tabla `ajustes`.

import type { AjustesGuardados, ClaveAjuste } from '../../types/settings'
import type { Almacenamiento } from '../persistence'
import { almacenamientoLocal } from '../persistence'

export interface SettingsRepository {
  /** El valor guardado, o `porDefecto` si el administrador aún no lo cambió. */
  get<K extends ClaveAjuste>(clave: K, porDefecto: AjustesGuardados[K]): Promise<AjustesGuardados[K]>
  save<K extends ClaveAjuste>(clave: K, valor: AjustesGuardados[K]): Promise<void>
}

export class LocalSettingsRepository implements SettingsRepository {
  private readonly almacenamiento: Almacenamiento

  constructor(almacenamiento: Almacenamiento = almacenamientoLocal) {
    this.almacenamiento = almacenamiento
  }

  async get<K extends ClaveAjuste>(clave: K, porDefecto: AjustesGuardados[K]): Promise<AjustesGuardados[K]> {
    return this.almacenamiento.leer(clave, porDefecto)
  }

  async save<K extends ClaveAjuste>(clave: K, valor: AjustesGuardados[K]): Promise<void> {
    this.almacenamiento.escribir(clave, valor)
  }
}
