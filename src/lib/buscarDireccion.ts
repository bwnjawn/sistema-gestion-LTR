// src/lib/buscarDireccion.ts
// Busca una dirección en OpenStreetMap (Nominatim) y devuelve el punto. Solo se llama cuando el administrador toca
// "Buscar" en el mapa del local (una consulta por toque, como pide la política de uso del servicio).

import { coordenadasDeBusqueda, urlDeBusqueda, type Coordenadas } from '../services/ubicacion'

/** El punto de la primera coincidencia, o `null` si no se encontró. Lanza un error si no hubo conexión con el servicio. */
export async function buscarDireccion(texto: string): Promise<Coordenadas | null> {
  if (!texto.trim()) return null
  const respuesta = await fetch(urlDeBusqueda(texto), { headers: { Accept: 'application/json' } })
  if (!respuesta.ok) throw new Error(`La búsqueda respondió ${respuesta.status}`)
  return coordenadasDeBusqueda(await respuesta.json())
}
