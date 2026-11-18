// src/lib/compartirArchivo.ts
// Entregar un archivo generado en la app: menú de compartir del celular (si lo permite) o descarga.

/** El menú de compartir con archivos adjuntos solo existe en navegadores modernos y con HTTPS. */
export function puedeCompartirArchivo(archivo: File): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [archivo] })
}

export type ResultadoCompartir = 'compartido' | 'cancelado' | 'no-disponible'

/** Abre el menú de compartir con el archivo. Si no se puede, devuelve 'no-disponible' sin hacer nada. */
export async function compartirArchivo(archivo: File, titulo: string, texto: string): Promise<ResultadoCompartir> {
  if (!puedeCompartirArchivo(archivo)) return 'no-disponible'
  try {
    await navigator.share({ files: [archivo], title: titulo, text: texto })
    return 'compartido'
  } catch (error) {
    // Cerrar el menú sin elegir nada no es un error
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelado'
    return 'no-disponible'
  }
}

export function descargarArchivo(archivo: File): void {
  const url = URL.createObjectURL(archivo)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = archivo.name
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
