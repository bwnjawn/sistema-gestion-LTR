// src/lib/persistence.ts
// Acceso al `localStorage`. Solo lo usan los repositorios locales (src/lib/repositories/): ni las vistas ni
// los stores lo tocan. Una escritura que falla lanza `ErrorDeAlmacenamiento` (nunca un `alert()`): quien
// guarda decide qué hacer y la pantalla muestra el aviso.

import { ErrorDeAlmacenamiento } from './errores'

const PREFIX = 'ltr_reserva_'

/** Lo que necesita un repositorio local para guardar. Las pruebas usan uno en memoria. */
export interface Almacenamiento {
  leer<T>(clave: string, porDefecto: T): T
  /** Lanza `ErrorDeAlmacenamiento` si no pudo escribir. */
  escribir<T>(clave: string, valor: T): void
  borrar(clave: string): void
  /** True si la clave tiene algo guardado (aunque sea una lista vacía). */
  existe(clave: string): boolean
}

export function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return defaultValue
    return JSON.parse(raw) as T
  } catch (error) {
    console.warn(`[Persistence] Error leyendo ${key}:`, error)
    return defaultValue
  }
}

export function removeStorageItem(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch (error) {
    console.warn(`[Persistence] Error eliminando ${key}:`, error)
  }
}

function esErrorDeCuota(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.code === 22 ||
      error.code === 1014 ||
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

/** Escribe o lanza `ErrorDeAlmacenamiento`. */
export function writeStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch (error) {
    console.error(`[Persistence] Error de escritura en ${key}:`, error)
    throw new ErrorDeAlmacenamiento(esErrorDeCuota(error) ? 'cuota' : 'desconocida')
  }
}

/** Como `writeStorageItem`, pero devuelve false en vez de lanzar. */
export function setStorageItem<T>(key: string, value: T): boolean {
  try {
    writeStorageItem(key, value)
    return true
  } catch {
    return false
  }
}

function existeEnLocalStorage(key: string): boolean {
  try {
    return localStorage.getItem(PREFIX + key) !== null
  } catch {
    return false
  }
}

export const almacenamientoLocal: Almacenamiento = {
  leer: getStorageItem,
  escribir: writeStorageItem,
  borrar: removeStorageItem,
  existe: existeEnLocalStorage
}

/** Almacenamiento en memoria, para pruebas. `fallar` simula un navegador lleno o una base caída. */
export function crearAlmacenamientoEnMemoria(inicial: Record<string, unknown> = {}) {
  const datos = new Map<string, string>(Object.entries(inicial).map(([k, v]) => [k, JSON.stringify(v)]))
  const estado = { fallar: false }
  const almacenamiento: Almacenamiento & { estado: typeof estado; datos: Map<string, string> } = {
    estado,
    datos,
    leer<T>(clave: string, porDefecto: T): T {
      const crudo = datos.get(clave)
      return crudo === undefined ? porDefecto : (JSON.parse(crudo) as T)
    },
    escribir<T>(clave: string, valor: T): void {
      if (estado.fallar) throw new ErrorDeAlmacenamiento('cuota')
      datos.set(clave, JSON.stringify(valor))
    },
    borrar(clave: string): void {
      datos.delete(clave)
    },
    existe(clave: string): boolean {
      return datos.has(clave)
    }
  }
  return almacenamiento
}
