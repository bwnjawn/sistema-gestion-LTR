// src/services/migracionIds.ts
// Migración de los id antiguos de platos a UUID válidos (SCRUM-247).
// Los datos semilla de platos usaban id que empezaban con g, h, i y j, que no son hexadecimales:
// una columna `uuid` de Postgres los rechaza. Los navegadores que ya guardaron el catálogo, las solicitudes
// o un borrador con esos id se llevan al id nuevo al cargar, sin perder platos ni referencias.

/** Id antiguo de un plato semilla → id nuevo (UUID válido). */
export const IDS_PLATOS_ANTIGUOS: Readonly<Record<string, string>> = {
  'g6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77': 'a6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77',
  'h7fecb99-9c0b-4ef8-bb6d-6bb9bd380a88': 'b7fecb99-9c0b-4ef8-bb6d-6bb9bd380a88',
  'i8fecb99-9c0b-4ef8-bb6d-6bb9bd380a99': 'c8fecb99-9c0b-4ef8-bb6d-6bb9bd380a99',
  'j9fecb99-9c0b-4ef8-bb6d-6bb9bd380b00': 'd9fecb99-9c0b-4ef8-bb6d-6bb9bd380b00'
}

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** True si el texto es un UUID válido (hexadecimal, con versión y variante correctas). */
export function esUUIDValido(id: string): boolean {
  return FORMATO_UUID.test(id)
}

/** El id vigente de un plato: si el id es uno antiguo se devuelve el nuevo; si no, el mismo. */
export function idPlatoVigente(id: string): string {
  return IDS_PLATOS_ANTIGUOS[id] ?? id
}

/**
 * Lleva los platos del catálogo guardado a los id nuevos. Si no hay nada que migrar devuelve la misma lista
 * (misma referencia), así quien llama sabe si hay que volver a guardar. No modifica la lista recibida.
 */
export function migrarIdsPlatos<T extends { id: string }>(platos: T[]): T[] {
  if (!platos.some(p => idPlatoVigente(p.id) !== p.id)) return platos
  return platos.map(p => (idPlatoVigente(p.id) !== p.id ? { ...p, id: idPlatoVigente(p.id) } : p))
}

/**
 * Lo mismo para los platos elegidos dentro de una solicitud o un borrador: así siguen apuntando
 * al plato del catálogo. Devuelve la misma lista si no hay nada que migrar.
 */
export function migrarIdsPlatosElegidos<T extends { id: string }>(elegidos: T[] | undefined): T[] | undefined {
  return elegidos ? migrarIdsPlatos(elegidos) : elegidos
}
