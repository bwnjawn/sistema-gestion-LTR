// src/lib/repositories/catalogRepository.ts
// Catálogo: cabañas, espacios de camping, platos y acompañamientos globales. Una colección por entidad.

import type { Cabin, CampingSite, Dish } from '../../types/domain'
import { DEFAULT_CABINS, DEFAULT_CAMPING, DEFAULT_DISHES, DEFAULT_GLOBAL_SIDES } from '../../data/seed'
import type { Almacenamiento } from '../persistence'
import { almacenamientoLocal } from '../persistence'
import { ColeccionLocal } from './coleccionLocal'
import type { Repositorio } from './repositorio'

export type CabinRepository = Repositorio<Cabin>
export type CampingSiteRepository = Repositorio<CampingSite>
export type DishRepository = Repositorio<Dish>

/** Acompañamientos globales: una lista de nombres (no tienen id propio). */
export interface GlobalSideRepository {
  list(): Promise<string[]>
  /** Agrega un acompañamiento y devuelve la lista completa. No repite nombres. */
  add(nombre: string): Promise<string[]>
  /** Quita un acompañamiento y devuelve la lista completa. */
  remove(nombre: string): Promise<string[]>
}

export class LocalGlobalSideRepository implements GlobalSideRepository {
  // Una sola clave. Antes el repositorio escribía `global_side_dishes` y el store `global_sides`:
  // `migrateLegacyData()` borra la clave sobrante.
  private readonly almacenamiento: Almacenamiento
  private readonly clave = 'global_sides'

  constructor(almacenamiento: Almacenamiento) {
    this.almacenamiento = almacenamiento
  }

  async list(): Promise<string[]> {
    return this.almacenamiento.existe(this.clave)
      ? this.almacenamiento.leer<string[]>(this.clave, [])
      : [...DEFAULT_GLOBAL_SIDES]
  }

  async add(nombre: string): Promise<string[]> {
    const lista = await this.list()
    if (!lista.includes(nombre)) lista.push(nombre)
    this.almacenamiento.escribir(this.clave, lista)
    return lista
  }

  async remove(nombre: string): Promise<string[]> {
    const lista = (await this.list()).filter(s => s !== nombre)
    this.almacenamiento.escribir(this.clave, lista)
    return lista
  }
}

export function crearRepositoriosCatalogoLocales(almacenamiento: Almacenamiento = almacenamientoLocal) {
  return {
    cabins: new ColeccionLocal<Cabin>('cabins', almacenamiento, { semilla: () => DEFAULT_CABINS, entidad: 'la cabaña' }),
    campingSites: new ColeccionLocal<CampingSite>('camping_sites', almacenamiento, {
      semilla: () => DEFAULT_CAMPING,
      entidad: 'el espacio de camping'
    }),
    dishes: new ColeccionLocal<Dish>('dishes', almacenamiento, { semilla: () => DEFAULT_DISHES, entidad: 'el plato' }),
    globalSides: new LocalGlobalSideRepository(almacenamiento)
  }
}
