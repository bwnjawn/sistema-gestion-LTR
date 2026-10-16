// src/lib/format.ts

export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(amount)
}

export function formatPhoneClean(phone: string): string {
  return phone.replace(/\s+/g, '')
}

/**
 * Calcula el número de noches entre dos fechas en formato ISO/string (YYYY-MM-DD).
 * Garantiza un mínimo de 1 noche.
 */
export function calculateNights(checkInDate: string, checkOutDate: string): number {
  if (!checkInDate || !checkOutDate) return 1
  const start = new Date(checkInDate).getTime()
  const end = new Date(checkOutDate).getTime()
  if (isNaN(start) || isNaN(end)) return 1
  const diff = end - start
  const days = Math.ceil(diff / (1000 * 3600 * 24))
  return days > 0 ? days : 1
}