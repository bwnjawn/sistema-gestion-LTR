// src/lib/repositories/documentosRepository.ts
// Archivos que sube el administrador (el reglamento del camping, SCRUM-51). Con Supabase van al almacenamiento
// de archivos (bucket `documentos`, de lectura pública); sin él, se guardan en el navegador como un enlace `data:`.

export interface DocumentoSubido {
  /** Enlace con el que el cliente abre el archivo. */
  url: string
  /** Ruta dentro del almacenamiento; sirve para borrarlo después. */
  ruta: string
}

export interface DocumentosRepository {
  subir(archivo: File, ruta: string): Promise<DocumentoSubido>
  /** Borra un archivo. Si ya no existe, no es un error. */
  eliminar(ruta: string): Promise<void>
}

/** Convierte bytes a base64 por trozos (un solo `String.fromCharCode` falla con archivos grandes). */
function aBase64(bytes: Uint8Array): string {
  let binario = ''
  const trozo = 0x8000
  for (let i = 0; i < bytes.length; i += trozo) {
    binario += String.fromCharCode(...bytes.subarray(i, i + trozo))
  }
  return btoa(binario)
}

export class LocalDocumentosRepository implements DocumentosRepository {
  async subir(archivo: File, ruta: string): Promise<DocumentoSubido> {
    const bytes = new Uint8Array(await archivo.arrayBuffer())
    return { url: `data:application/pdf;base64,${aBase64(bytes)}`, ruta }
  }

  async eliminar(): Promise<void> {
    // El archivo vive dentro del ajuste que lo guarda: no hay nada más que borrar
  }
}
