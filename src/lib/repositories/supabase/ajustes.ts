// src/lib/repositories/supabase/ajustes.ts
// Ajustes del negocio en la tabla `ajustes` (una fila por clave). Todos los ajustes públicos se piden de una vez
// al arrancar y se guardan en memoria, así `get` no hace una consulta por clave.

import type { AjustesGuardados, ClaveAjuste } from '../../../types/settings'
import { supabase } from '../../supabase'
import type { SettingsRepository } from '../settingsRepository'
import { datosOLanzar, traducirError } from './errores'
import { CLAVE_DE_AJUSTE } from './mapeos'

export class SupabaseSettingsRepository implements SettingsRepository {
  private cache: Promise<Map<string, unknown>> | null = null

  private cargar(): Promise<Map<string, unknown>> {
    if (!this.cache) {
      this.cache = (async () => {
        const filas = datosOLanzar(
          await supabase().from('ajustes').select('clave, valor'),
          'No se pudieron cargar los ajustes.'
        ) as { clave: string; valor: unknown }[]
        return new Map(filas.map(f => [f.clave, f.valor]))
      })().catch(error => {
        this.cache = null
        throw traducirError(error, 'No se pudieron cargar los ajustes.')
      })
    }
    return this.cache
  }

  async get<K extends ClaveAjuste>(clave: K, porDefecto: AjustesGuardados[K]): Promise<AjustesGuardados[K]> {
    const valor = (await this.cargar()).get(CLAVE_DE_AJUSTE[clave])
    if (valor === undefined || valor === null) return porDefecto
    // Lo guardado antes de que existieran campos nuevos se completa con los de fábrica
    return typeof valor === 'object' && !Array.isArray(valor)
      ? ({ ...(porDefecto as object), ...(valor as object) } as AjustesGuardados[K])
      : (valor as AjustesGuardados[K])
  }

  async save<K extends ClaveAjuste>(clave: K, valor: AjustesGuardados[K]): Promise<void> {
    // La fecha de hoy y el estado de la conexión se calculan en la app: no se guardan
    const limpio = clave === 'parameters'
      ? Object.fromEntries(Object.entries(valor as object).filter(([k]) => k !== 'currentDate' && k !== 'isConnected'))
      : valor
    const resultado = await supabase()
      .from('ajustes')
      .upsert({ clave: CLAVE_DE_AJUSTE[clave], valor: limpio, actualizado_en: new Date().toISOString() })
    if (resultado.error) throw traducirError(resultado.error, 'No se pudieron guardar los ajustes.')
    ;(await this.cargar()).set(CLAVE_DE_AJUSTE[clave], limpio)
  }
}
