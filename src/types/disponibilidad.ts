// src/types/disponibilidad.ts
// Lo que el público puede saber de las reservas: solo lo que está confirmado y sin datos personales
// (ni nombres, ni teléfonos, ni códigos). Es lo que devuelve `AvailabilityRepository` y lo que usa el
// calendario del cliente. Con Supabase lo entrega la función `fechas_ocupadas` (ver docs/supabase-esquema.md),
// porque el público no puede leer la tabla `reservas`.

import type { CampingModality, MealType } from './domain'

export interface NocheDeCabana {
  cabinId: string
  /** `YYYY-MM-DD`: la noche que empieza ese día. La fecha de salida no cuenta. */
  noche: string
}

export interface PersonasDelDia<K extends string> {
  /** `YYYY-MM-DD` */
  dia: string
  tipo: K
  /** Personas ya confirmadas ese día en esa comida o modalidad. */
  personas: number
}

export interface FechasOcupadas {
  /** Una entrada por cabaña y noche ocupada por una reserva confirmada. */
  cabanas: NocheDeCabana[]
  /** Personas confirmadas del restaurante por día y comida. */
  restaurante: PersonasDelDia<MealType>[]
  /** Personas confirmadas de camping por día y modalidad (pernoctar cuenta cada noche de la estadía). */
  camping: PersonasDelDia<CampingModality>[]
}

export const SIN_FECHAS_OCUPADAS: Readonly<FechasOcupadas> = Object.freeze({
  cabanas: [],
  restaurante: [],
  camping: []
})
