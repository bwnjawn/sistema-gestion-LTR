// src/services/documentos.ts
// Reglas de los documentos que sube el administrador (hoy, el reglamento del camping en PDF).

/** Tamaño máximo de un PDF: 10 MB (el mismo límite del bucket de Supabase). */
export const TAMANO_MAXIMO_PDF = 10 * 1024 * 1024

interface DatosDeArchivo {
  name: string
  type: string
  size: number
}

/** Valida un archivo antes de subirlo. Devuelve el mensaje de error, o `null` si es válido. */
export function validarPdf(archivo: DatosDeArchivo): string | null {
  // Algunos navegadores no informan el tipo: en ese caso se mira la extensión
  const esPdf = archivo.type === 'application/pdf' || (archivo.type === '' && archivo.name.toLowerCase().endsWith('.pdf'))
  if (!esPdf) return 'El archivo debe ser un PDF.'
  if (archivo.size === 0) return 'El archivo está vacío.'
  if (archivo.size > TAMANO_MAXIMO_PDF) {
    return `El PDF pesa ${formatearTamano(archivo.size)} y el máximo es ${formatearTamano(TAMANO_MAXIMO_PDF)}.`
  }
  return null
}

/** Tamaño legible: "850 KB" o "2,3 MB". */
export function formatearTamano(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

/**
 * Ruta donde se guarda el reglamento. Lleva la fecha para que cada versión tenga su propio enlace (así ningún
 * navegador muestra una copia vieja del archivo) y no usa el nombre que puso el administrador.
 */
export function rutaDeReglamentoCamping(ahora: number = Date.now()): string {
  return `reglamento-camping/${ahora}.pdf`
}
