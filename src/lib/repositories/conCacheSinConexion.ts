// src/lib/repositories/conCacheSinConexion.ts
// Envuelve los repositorios de Supabase para que la app abra y se pueda usar sin señal (SCRUM-250).
// Cada lectura del catálogo, los ajustes y la disponibilidad se guarda en IndexedDB cuando funciona; si falla por
// red (o no responde a tiempo), se devuelve la última copia guardada. Las escrituras y el resto de las lecturas
// no se tocan: un error de regla o de permisos nunca se disfraza de "sin conexión".

import type { Repositorios } from './index'
import type { CabinRepository, CampingSiteRepository, DishRepository, GlobalSideRepository } from './catalogRepository'
import type { Repositorio } from './repositorio'
import type { SettingsRepository } from './settingsRepository'
import type { AvailabilityRepository } from './availabilityRepository'
import type { AjustesGuardados, ClaveAjuste } from '../../types/settings'
import { guardarSinConexion, leerSinConexion } from '../almacenSinConexion'
import { conTiempoLimite } from '../conTiempoLimite'
import { esErrorDeRed } from '../errores'
import { marcarServidorActivo, marcarServidorCaido } from '../estadoDeRed'

/** Una lectura que no responde en este tiempo se da por caída y se usa la copia guardada. */
export const TIEMPO_LECTURA_MS = 15000

/** Pide el dato; si sale bien lo guarda, y si falla por red devuelve la copia guardada (si la hay). */
export async function leerConRespaldo<T>(clave: string, pedir: () => Promise<T>): Promise<T> {
  try {
    const valor = await conTiempoLimite(pedir(), TIEMPO_LECTURA_MS)
    marcarServidorActivo()
    void guardarSinConexion(clave, valor).catch(error => console.warn('[SinConexión] No se pudo guardar la copia:', error))
    return valor
  } catch (error) {
    if (!esErrorDeRed(error)) throw error
    marcarServidorCaido()
    const guardado = await leerSinConexion<T>(clave)
    if (guardado !== undefined) return guardado
    throw error
  }
}

function coleccion<T extends { id: string }>(clave: string, r: Repositorio<T>): Repositorio<T> {
  return {
    list: () => leerConRespaldo(clave, () => r.list()),
    getById: id => r.getById(id),
    create: item => r.create(item),
    update: (id, cambios) => r.update(id, cambios),
    remove: id => r.remove(id)
  }
}

function acompanamientos(r: GlobalSideRepository): GlobalSideRepository {
  return {
    list: () => leerConRespaldo('catalogo:acompanamientos', () => r.list()),
    add: nombre => r.add(nombre),
    remove: nombre => r.remove(nombre),
    rename: (anterior, nuevo) => r.rename(anterior, nuevo)
  }
}

function ajustes(r: SettingsRepository): SettingsRepository {
  return {
    get: <K extends ClaveAjuste>(clave: K, porDefecto: AjustesGuardados[K]) =>
      leerConRespaldo<AjustesGuardados[K]>(`ajustes:${clave}`, () => r.get(clave, porDefecto)),
    save: (clave, valor) => r.save(clave, valor),
    invalidar: () => r.invalidar()
  }
}

function disponibilidad(r: AvailabilityRepository): AvailabilityRepository {
  return { fechasOcupadas: (desde, hasta) => leerConRespaldo('disponibilidad', () => r.fechasOcupadas(desde, hasta)) }
}

export function conCacheSinConexion(r: Repositorios): Repositorios {
  return {
    ...r,
    cabins: coleccion('catalogo:cabanas', r.cabins) as CabinRepository,
    campingSites: coleccion('catalogo:camping', r.campingSites) as CampingSiteRepository,
    dishes: coleccion('catalogo:platos', r.dishes) as DishRepository,
    globalSides: acompanamientos(r.globalSides),
    settings: ajustes(r.settings),
    availability: disponibilidad(r.availability)
  }
}
