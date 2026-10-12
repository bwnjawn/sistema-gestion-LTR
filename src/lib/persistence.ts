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
 } catch (error) {
   console.error(`[Persistence] Error de cuota o escritura en ${key}:`, error)
   return false
 }
}