// src/services/menus.ts

import type { Dish, MealType } from '../types/domain'
import type { LimiteVariedades } from '../types/settings'

/** Las comidas en su orden del día, y el texto que ve el usuario de cada una. */
export const ORDEN_COMIDAS: readonly MealType[] = ['desayuno', 'almuerzo', 'once']
export const ETIQUETAS_COMIDA: Record<MealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  once: 'Once'
}

/** Valores de fábrica: más de 30 personas, máximo 3 platos distintos en el almuerzo (SCRUM-36, SCRUM-294). */
export const LIMITE_VARIEDADES_POR_DEFECTO: LimiteVariedades = { umbralPersonas: 30, maxVariedades: 3 }

/** Solo el almuerzo tiene tope de platos distintos; el desayuno y la once no (decisión del 22/11, SCRUM-294). */
export function comidaTieneLimiteDeVariedades(comida: MealType): boolean {
  return comida === 'almuerzo'
}

/** La regla de variedades se aplica solo al almuerzo y solo cuando el grupo supera el umbral. */
export function aplicaLimiteVariedades(personas: number, limite: LimiteVariedades, comida: MealType): boolean {
  return comidaTieneLimiteDeVariedades(comida) && personas > limite.umbralPersonas
}

/** Indica si se puede sumar un plato distinto a los que ya están elegidos en una comida. */
export function puedeAgregarVariedad(
  personas: number,
  variedadesElegidas: number,
  limite: LimiteVariedades,
  comida: MealType
): boolean {
  return !aplicaLimiteVariedades(personas, limite, comida) || variedadesElegidas < limite.maxVariedades
}

/** Indica si una comida ya supera el máximo de variedades (por ejemplo, tras subir las personas). */
export function superaLimiteVariedades(
  personas: number,
  variedadesElegidas: number,
  limite: LimiteVariedades,
  comida: MealType
): boolean {
  return aplicaLimiteVariedades(personas, limite, comida) && variedadesElegidas > limite.maxVariedades
}

// ---------------------------------------------------------------------------
// Acompañamientos y validación de platos (SCRUM-229)
// ---------------------------------------------------------------------------

/** Solo el almuerzo lleva acompañamiento: el desayuno y la once se sirven completos (decisión del 18/11). */
export function comidaAdmiteAcompanamiento(comida: MealType): boolean {
  return comida === 'almuerzo'
}

/**
 * Deja un plato sin acompañamiento si su comida no lo admite. Lo que tenía como acompañamiento fijo pasa a la
 * descripción (si no estaba ya escrito ahí) para no perder lo que incluye. Devuelve el mismo plato si no hay nada
 * que cambiar.
 */
export function aplicarReglaDeAcompanamiento<T extends Pick<Dish, 'mealType' | 'sideMode' | 'availableSides' | 'fixedSide' | 'description'>>(plato: T): T {
  if (comidaAdmiteAcompanamiento(plato.mealType)) return plato
  const hayAlgo = plato.sideMode !== 'none' || plato.availableSides.length > 0 || !!plato.fixedSide
  if (!hayAlgo) return plato
  const fijo = (plato.fixedSide ?? '').trim()
  const descripcion = plato.description ?? ''
  const nuevaDescripcion =
    fijo && !descripcion.toLowerCase().includes(fijo.toLowerCase())
      ? [descripcion.trim(), fijo].filter(Boolean).join('. ')
      : descripcion
  const { fixedSide: _descartado, ...resto } = plato
  return { ...resto, sideMode: 'none', availableSides: [], description: nuevaDescripcion } as unknown as T
}

/** Platos activos que ofrecen un acompañamiento a elección. Sirve para bloquear su eliminación. */
export function platosQueUsanAcompanamiento(nombre: string, platos: Dish[]): Dish[] {
  return platos.filter(p => p.isActive && p.sideMode === 'choice' && p.availableSides.includes(nombre))
}

/** Compara nombres sin distinguir mayúsculas ni espacios sobrantes. */
function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase()
}

/**
 * Valida el nombre de un acompañamiento nuevo o renombrado. Devuelve el mensaje de error, o `null` si es válido.
 * `actual` es el nombre que se está renombrando: puede conservarse tal cual o cambiar solo las mayúsculas.
 */
export function validarNombreAcompanamiento(nombre: string, existentes: string[], actual?: string): string | null {
  const limpio = normalizarNombre(nombre)
  if (!limpio) return 'Escribe un nombre para el acompañamiento.'
  const repetido = existentes.some(e => e !== actual && normalizarNombre(e) === limpio)
  return repetido ? 'Ya existe un acompañamiento con ese nombre.' : null
}

/** Valida la configuración de acompañamientos de un plato. Devuelve el mensaje de error, o `null` si es válido. */
export function validarPlato(plato: Pick<Dish, 'name' | 'mealType' | 'sideMode' | 'fixedSide' | 'availableSides'>): string | null {
  if (!plato.name.trim()) return 'El plato necesita un nombre.'
  if (!comidaAdmiteAcompanamiento(plato.mealType)) return null
  if (plato.sideMode === 'fixed' && !plato.fixedSide?.trim()) {
    return 'Escribe cuál es el acompañamiento fijo, o elige otra opción.'
  }
  if (plato.sideMode === 'choice' && plato.availableSides.length === 0) {
    return 'Marca al menos un acompañamiento para que el cliente pueda elegir, o elige otra opción.'
  }
  return null
}
