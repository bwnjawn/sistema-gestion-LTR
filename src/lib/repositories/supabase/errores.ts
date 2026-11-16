// src/lib/repositories/supabase/errores.ts
// Traduce los errores de Supabase al `ErrorDeAlmacenamiento` de la app, siempre con un mensaje en español
// que se pueda mostrar al usuario. Las funciones de la base empiezan su mensaje con un código estable
// ("fecha_no_disponible: la cabaña ya está reservada…"): se muestra la parte legible.

import { ErrorDeAlmacenamiento } from '../../errores'

interface ErrorSupabase {
  code?: string
  message?: string
  details?: string
}

const CODIGOS_DE_LA_BASE = [
  'fecha_no_disponible',
  'sin_cupo',
  'capacidad_excedida',
  'recurso_no_disponible',
  'fecha_pasada',
  'fechas_invalidas',
  'dato_invalido',
  'demasiadas_solicitudes',
  'rango_invalido',
  'no_autorizado',
  'aforo_excedido'
]

export const MENSAJE_SIN_CONEXION = 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'

/** Código de la base al inicio del mensaje, si lo tiene (por ejemplo `sin_cupo`). */
export function codigoDeLaBase(mensaje: string | undefined): string | undefined {
  const m = /^([a-z_]+):\s/.exec(mensaje ?? '')
  return m && CODIGOS_DE_LA_BASE.includes(m[1]) ? m[1] : undefined
}

/** Convierte un error de Supabase (o de red) en un `ErrorDeAlmacenamiento` con mensaje para el usuario. */
export function traducirError(error: unknown, respaldo: string): ErrorDeAlmacenamiento {
  if (error instanceof ErrorDeAlmacenamiento) return error
  const e = (error ?? {}) as ErrorSupabase
  const mensaje = e.message ?? (error instanceof Error ? error.message : '')

  const codigo = codigoDeLaBase(mensaje)
  if (codigo) return new ErrorDeAlmacenamiento('desconocida', mensaje.slice(codigo.length + 1).trim())

  if (e.code === '23P01') return new ErrorDeAlmacenamiento('desconocida', 'Ya hay una reserva confirmada en esas fechas o cupos.')
  if (e.code === '42501' || e.code === 'PGRST301' || /row-level security|permission denied|JWT/i.test(mensaje)) {
    return new ErrorDeAlmacenamiento('desconocida', 'No tienes permiso para hacer esto. Inicia sesión como administrador.')
  }
  if (e.code === '23503') {
    return new ErrorDeAlmacenamiento('desconocida', 'No se puede eliminar: hay reservas que lo usan. Desactívalo en su lugar.')
  }
  if (e.code === '23505') return new ErrorDeAlmacenamiento('desconocida', 'Ya existe un registro con esos datos.')
  if (error instanceof TypeError || /fetch|network|failed to|load failed/i.test(mensaje)) {
    return new ErrorDeAlmacenamiento('desconocida', MENSAJE_SIN_CONEXION)
  }
  return new ErrorDeAlmacenamiento('desconocida', respaldo)
}

/** Resultado de una consulta de supabase-js: lanza el error traducido o devuelve los datos. */
export function datosOLanzar<T>(resultado: { data: T | null; error: unknown }, respaldo: string): T {
  if (resultado.error) throw traducirError(resultado.error, respaldo)
  return resultado.data as T
}
