// src/services/wizard.ts
// Reglas de los pasos del cliente: qué espacio de camping corresponde, si los datos de
// contacto sirven y cómo se llaman los pasos de cada flujo.

import type { CampingModality, CampingSite, ServiceType } from '../types/domain'
import { hasUsablePhone, normalizePhoneDigits } from '../lib/contactLinks'

// ---------------------------------------------------------------------------
// Camping: asignación del espacio
// ---------------------------------------------------------------------------

/** Un espacio con modalidad 'ambos' admite tanto el día de campo como pernoctar. */
export const MODALIDAD_AMBAS = 'ambos'

/** Cómo se llama en pantalla la modalidad de un espacio. */
export const ETIQUETA_MODALIDAD_ESPACIO: Record<CampingSite['modality'], string> = {
  ambos: 'Día y noche',
  diario: 'Solo de día'
}

export function siteSupportsModality(site: CampingSite, type: CampingModality): boolean {
  return site.modality === type || site.modality === MODALIDAD_AMBAS
}

/** Cómo se llama el camping por el día: no hay espacios grandes ni pequeños, todos son iguales (SCRUM-277). */
export const NOMBRE_DIA_DE_CAMPO = 'Día de campo'

/**
 * Espacio de camping que corresponde a un grupo. Pernoctando cubre la cantidad de personas y admite la
 * modalidad; si hay varios, se prefiere el de menor capacidad máxima (el más ajustado). Por el día los espacios
 * son todos iguales: sirve cualquier grupo, y solo se usa el rango de personas para elegir cuál se anota
 * (el que cubre al grupo; si ninguno, el más grande).
 * Devuelve undefined si ninguno sirve: no se asigna uno "por defecto".
 */
export function findCampingSite(
  sites: CampingSite[],
  guestsCount: number,
  type: CampingModality
): CampingSite | undefined {
  const admiten = sites.filter(s => siteSupportsModality(s, type))
  const cubren = admiten
    .filter(s => guestsCount >= s.minCapacity && guestsCount <= s.maxCapacity)
    .sort((a, b) => a.maxCapacity - b.maxCapacity)[0]
  if (type !== 'diario') return cubren
  return cubren ?? [...admiten].sort((a, b) => b.maxCapacity - a.maxCapacity)[0]
}

/** Mensaje para el cliente cuando no hay un espacio disponible para su grupo. */
export function noCampingSiteMessage(guestsCount: number, type: CampingModality): string {
  const modalidad = type === 'diario' ? 'pasar el día' : 'pernoctar'
  const personas = guestsCount === 1 ? '1 persona' : `${guestsCount} personas`
  return `Por ahora no tenemos un espacio para ${modalidad} con ${personas}. Cambia la cantidad de personas o la modalidad, o contáctanos para coordinarlo.`
}

// ---------------------------------------------------------------------------
// Datos de contacto
// ---------------------------------------------------------------------------

/** Teléfono con el prefijo y los 9 dígitos de un celular chileno. Solo '+56 9' no sirve. */
export function isClientPhoneValid(phone: string): boolean {
  return hasUsablePhone(phone)
}

/** El cliente empezó a escribir su número pero aún no está completo. */
export function isClientPhoneIncomplete(phone: string): boolean {
  return normalizePhoneDigits(phone).length > 3 && !hasUsablePhone(phone)
}

export function isClientContactValid(name: string, phone: string): boolean {
  return name.trim().length > 0 && isClientPhoneValid(phone)
}

// ---------------------------------------------------------------------------
// Pasos de cada flujo
// ---------------------------------------------------------------------------

export type StepIcon = 'calendar' | 'bed' | 'tent' | 'utensils' | 'user' | 'check'

export interface WizardStep {
  id: number
  label: string
  icon: StepIcon
}

export const WIZARD_STEPS: Record<ServiceType, WizardStep[]> = {
  cabana: [
    { id: 1, label: 'Fechas', icon: 'calendar' },
    { id: 2, label: 'Cabaña', icon: 'bed' },
    { id: 3, label: 'Datos', icon: 'user' },
    { id: 4, label: 'Confirmar', icon: 'check' }
  ],
  camping: [
    { id: 1, label: 'Fechas', icon: 'calendar' },
    { id: 2, label: 'Espacio', icon: 'tent' },
    { id: 3, label: 'Datos', icon: 'user' },
    { id: 4, label: 'Confirmar', icon: 'check' }
  ],
  restaurante: [
    { id: 1, label: 'Fechas', icon: 'calendar' },
    { id: 2, label: 'Menú', icon: 'utensils' },
    { id: 3, label: 'Datos', icon: 'user' },
    { id: 4, label: 'Confirmar', icon: 'check' }
  ],
  // La piscina (SCRUM-44) es solo informativa: fecha y personas, datos de contacto y confirmación
  piscina: [
    { id: 1, label: 'Fecha', icon: 'calendar' },
    { id: 2, label: 'Datos', icon: 'user' },
    { id: 3, label: 'Confirmar', icon: 'check' }
  ]
}
