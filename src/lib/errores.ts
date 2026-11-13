// src/lib/errores.ts
// Errores de la capa de datos. El mensaje siempre está en español y es apto para mostrarse al usuario.

export type CausaErrorAlmacenamiento = 'cuota' | 'desconocida'

/** Falló al leer o escribir en el almacenamiento (navegador lleno, sin permiso, base de datos caída…). */
export class ErrorDeAlmacenamiento extends Error {
  readonly causa: CausaErrorAlmacenamiento

  constructor(causa: CausaErrorAlmacenamiento = 'desconocida', mensaje?: string) {
    super(
      mensaje ??
        (causa === 'cuota'
          ? 'El almacenamiento del navegador está lleno. Libera espacio para guardar nuevos cambios.'
          : 'No se pudo guardar. Intenta de nuevo.')
    )
    this.name = 'ErrorDeAlmacenamiento'
    this.causa = causa
  }
}

/** Se pidió una fila que no existe (por ejemplo, actualizar una cabaña que ya no está). */
export class ErrorNoEncontrado extends Error {
  constructor(entidad: string, id: string) {
    super(`No se encontró ${entidad} (${id}).`)
    this.name = 'ErrorNoEncontrado'
  }
}

/** Texto para el usuario: el del error si ya está en español, o el de respaldo. */
export function mensajeDeError(error: unknown, respaldo: string): string {
  if (error instanceof ErrorDeAlmacenamiento) return error.message
  return respaldo
}
