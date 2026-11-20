// src/services/ubicacion.ts
// Ubicación del local en el mapa (SCRUM-281): el administrador marca un punto exacto y de las coordenadas salen el
// enlace "Cómo llegar" y el mapa que ve el cliente. La dirección escrita queda aparte, solo para mostrarla.

export interface Coordenadas {
  lat: number
  lng: number
}

/** "Turismo Los Troncos de Repil": el punto real, de donde parte el mapa si aún no hay uno guardado. */
export const UBICACION_POR_DEFECTO: Coordenadas = { lat: -41.0616375, lng: -73.647016 }

/** Texto que ve el cliente cuando el administrador no escribe una referencia de la dirección. */
export const DIRECCION_POR_DEFECTO = 'Sector Repil s/n, Comuna de Fresia, Región de Los Lagos, Chile'

/** La referencia de la dirección que se muestra: la que escribió el administrador o, si la dejó vacía, la de siempre. */
export function direccionParaMostrar(texto?: string | null): string {
  return texto?.trim() || DIRECCION_POR_DEFECTO
}

/** Dos coordenadas dentro de lo posible en la Tierra (latitud de -90 a 90, longitud de -180 a 180). */
export function coordenadasValidas(c: Partial<Coordenadas> | null | undefined): c is Coordenadas {
  return (
    !!c &&
    typeof c.lat === 'number' && Number.isFinite(c.lat) && c.lat >= -90 && c.lat <= 90 &&
    typeof c.lng === 'number' && Number.isFinite(c.lng) && c.lng >= -180 && c.lng <= 180
  )
}

/** Seis decimales bastan (unos 10 cm) y evitan guardar números larguísimos. */
export function redondearCoordenadas(c: Coordenadas): Coordenadas {
  const redondear = (n: number) => Math.round(n * 1e6) / 1e6
  return { lat: redondear(c.lat), lng: redondear(c.lng) }
}

/** Las coordenadas guardadas en los datos de contacto, o `null` si el administrador aún no marcó el punto. */
export function coordenadasDeContacto(contacto: { latitude?: number; longitude?: number }): Coordenadas | null {
  const c = { lat: contacto.latitude as number, lng: contacto.longitude as number }
  return coordenadasValidas(c) ? c : null
}

/** Enlace que abre el punto en la app de mapas del teléfono ("Cómo llegar"). */
export function enlaceDeMapa(c: Coordenadas): string {
  return `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`
}

/** Mapa que se incrusta en la pantalla de contacto del cliente, centrado en el punto. */
export function mapaIncrustado(c: Coordenadas): string {
  return `https://maps.google.com/maps?q=${c.lat},${c.lng}&z=17&output=embed`
}

/** "-41.06164, -73.64702": para mostrar al administrador qué punto quedó marcado. */
export function textoCoordenadas(c: Coordenadas): string {
  return `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`
}

/** Dirección de la búsqueda de lugares (OpenStreetMap), limitada a Chile. */
export function urlDeBusqueda(texto: string): string {
  const consulta = encodeURIComponent(texto.trim())
  return `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=cl&accept-language=es&q=${consulta}`
}

/** La primera coincidencia de la búsqueda como coordenadas, o `null` si no hubo ninguna o la respuesta no sirve. */
export function coordenadasDeBusqueda(respuesta: unknown): Coordenadas | null {
  if (!Array.isArray(respuesta) || respuesta.length === 0) return null
  const primero = respuesta[0] as { lat?: unknown; lon?: unknown }
  const c = { lat: Number(primero?.lat), lng: Number(primero?.lon) }
  return coordenadasValidas(c) ? redondearCoordenadas(c) : null
}
