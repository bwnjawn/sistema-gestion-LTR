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
