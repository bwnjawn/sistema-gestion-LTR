// src/lib/contactLinks.ts
// Genera los enlaces a partir de lo que escribe el administrador,
// para que no tenga que conocer ni pegar direcciones web.

export function buildWebsiteUrl(display: string): string {
  const clean = display.trim()
  if (!clean) return ''
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`
}

export function cleanInstagramUser(user: string): string {
  return user.trim().replace(/^@+/, '')
}

export function buildInstagramUrl(user: string): string {
  const clean = cleanInstagramUser(user)
  return clean ? `https://instagram.com/${clean}` : ''
}

export function buildMapsUrl(address: string): string {
  const clean = address.trim()
  return clean ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clean)}` : ''
}

export function buildMapEmbedUrl(address: string): string {
  const clean = address.trim()
  return clean ? `https://maps.google.com/maps?q=${encodeURIComponent(clean)}&output=embed` : ''
}

/** Deja solo los dígitos de un teléfono chileno y agrega el 56 si falta ('+56 9 1234 5678' → '56912345678'). */
export function normalizePhoneDigits(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('56')) return digits
  if (digits.length === 9) return `56${digits}`
  return digits
}

/** Un teléfono es útil para contactar si, además del prefijo, tiene al menos 9 dígitos. */
export function hasUsablePhone(phone: string): boolean {
  return normalizePhoneDigits(phone).length >= 11
}

export function buildTelUrl(phone: string): string {
  const digits = normalizePhoneDigits(phone)
  return digits ? `tel:+${digits}` : ''
}

export function buildWhatsappUrl(phone: string, message?: string): string {
  const digits = normalizePhoneDigits(phone)
  if (!digits) return ''
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${digits}${text}`
}

export function buildMailtoUrl(email: string, subject?: string): string {
  const clean = (email || '').trim()
  if (!clean) return ''
  return subject ? `mailto:${clean}?subject=${encodeURIComponent(subject)}` : `mailto:${clean}`
}
