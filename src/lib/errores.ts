// src/lib/errores.ts
// Errores de la capa de datos. El mensaje siempre está en español y es apto para mostrarse al usuario.

/**
 * - `red`: no se pudo hablar con el servidor (sin señal, corte o demora).
 * - `temporal`: el servidor pidió esperar un momento (límite de envíos). `red` y `temporal` son lo único que las
 *   colas de envío del modo sin conexión reintentan (SCRUM-250).
 * - `conflicto`: el servidor rechazó una confirmación porque choca con otra reserva o supera un cupo.
 */
export type CausaErrorAlmacenamiento = 'cuota' | 'red' | 'temporal' | 'conflicto' | 'desconocida'

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

/** El error es de red (sin señal o servidor inalcanzable), no una regla del negocio ni un fallo de permisos. */
export function esErrorDeRed(error: unknown): boolean {
  if (error instanceof ErrorDeAlmacenamiento) return error.causa === 'red' || error.causa === 'temporal'
  // Un fallo de `fetch` sin respuesta es un TypeError con estos mensajes (Chrome, Safari, Firefox). Cualquier otro
  // TypeError es un error de programación: no debe reintentarse para siempre como si fuera falta de señal.
  return error instanceof TypeError && /failed to fetch|load failed|networkerror|network request failed/i.test(error.message)
}

/** Texto para el usuario: el del error si ya está en español, o el de respaldo. */
export function mensajeDeError(error: unknown, respaldo: string): string {
  if (error instanceof ErrorDeAlmacenamiento) return error.message
  return respaldo
}
