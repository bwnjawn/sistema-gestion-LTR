// src/services/fotosInicio.ts
// Fotos de las tarjetas del inicio (SCRUM-271): cuál se muestra y cuál es la provisoria de cada una.

import type { ClaveFotoInicio, FotosInicio } from '../types/settings'

/** Fotos provisorias (Unsplash) hasta que el cliente entregue las reales. */
export const FOTOS_INICIO_ORIGINALES: Record<ClaveFotoInicio, string> = {
  cabana: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
  camping: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
  restaurante: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
  piscina: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80',
  evento: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=800&q=80'
}

/** Sin fotos subidas todavía: las cinco tarjetas usan la provisoria. */
export const FOTOS_INICIO_VACIAS: FotosInicio = { cabana: '', camping: '', restaurante: '', piscina: '', evento: '' }

/** Orden y nombre con que se muestran las tarjetas en Ajustes. */
export const TARJETAS_INICIO: { clave: ClaveFotoInicio; titulo: string; subtitulo: string }[] = [
  { clave: 'cabana', titulo: 'Cabaña', subtitulo: 'Desde $65.000 la noche' },
  { clave: 'camping', titulo: 'Camping', subtitulo: '$10.000 por persona la noche' },
  { clave: 'restaurante', titulo: 'Restaurante', subtitulo: 'Desayuno, almuerzo y once' },
  { clave: 'piscina', titulo: 'Piscina', subtitulo: 'Por persona' },
  { clave: 'evento', titulo: 'Evento especial', subtitulo: 'Contacta a los dueños' }
]

/** La foto que se ve en el inicio: la que subió el administrador, o la provisoria si no hay. */
export function fotoDeInicio(guardadas: Partial<FotosInicio> | undefined, clave: ClaveFotoInicio): string {
  return guardadas?.[clave]?.trim() || FOTOS_INICIO_ORIGINALES[clave]
}

/** La tarjeta usa una foto subida por el administrador (no la provisoria). */
export function tieneFotoPropia(guardadas: Partial<FotosInicio> | undefined, clave: ClaveFotoInicio): boolean {
  return !!guardadas?.[clave]?.trim()
}
