// src/lib/persistence.ts

const PREFIX = 'ltr_reserva_'

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

export function setStorageItem<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch (error: any) {
    const isQuotaError =
      error instanceof DOMException &&
      (error.code === 22 ||
        error.code === 1014 ||
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED')

    if (isQuotaError) {
      console.error(`[Persistence] ¡Cuota de localStorage excedida al guardar ${key}!`)
      if (typeof window !== 'undefined') {
        alert('El almacenamiento local de tu navegador está lleno. Por favor libera espacio para guardar nuevos cambios.')
      }
    } else {
      console.error(`[Persistence] Error de escritura en ${key}:`, error)
    }
    return false
  }
}