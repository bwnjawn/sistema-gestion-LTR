// src/services/menus.ts

import type { MealType } from '../types/domain'
import type { LimiteVariedades } from '../types/settings'

/** Las comidas en su orden del día, y el texto que ve el usuario de cada una. */
export const ORDEN_COMIDAS: readonly MealType[] = ['desayuno', 'almuerzo', 'once']
export const ETIQUETAS_COMIDA: Record<MealType, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  once: 'Once'
}

/** Valores de fábrica: más de 30 personas, máximo 3 platos distintos por comida (SCRUM-36). */
export const LIMITE_VARIEDADES_POR_DEFECTO: LimiteVariedades = { umbralPersonas: 30, maxVariedades: 3 }

/** La regla de variedades se aplica solo cuando el grupo supera el umbral. */
export function aplicaLimiteVariedades(personas: number, limite: LimiteVariedades): boolean {
  return personas > limite.umbralPersonas
}

/** Indica si se puede sumar un plato distinto a los que ya están elegidos en una comida. */
export function puedeAgregarVariedad(
  personas: number,
  variedadesElegidas: number,
  limite: LimiteVariedades
): boolean {
  return !aplicaLimiteVariedades(personas, limite) || variedadesElegidas < limite.maxVariedades
}

/** Indica si una comida ya supera el máximo de variedades (por ejemplo, tras subir las personas). */
export function superaLimiteVariedades(
  personas: number,
  variedadesElegidas: number,
  limite: LimiteVariedades
): boolean {
  return aplicaLimiteVariedades(personas, limite) && variedadesElegidas > limite.maxVariedades
}
