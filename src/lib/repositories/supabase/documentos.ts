// src/lib/repositories/supabase/documentos.ts
// Documentos en el almacenamiento de archivos de Supabase: bucket `documentos`, de lectura pública (el cliente
// abre el enlace sin sesión). Solo un administrador puede subir o borrar (políticas de la migración 8).

import { supabase } from '../../supabase'
import type { DocumentoSubido, DocumentosRepository } from '../documentosRepository'
import { traducirError } from './errores'

const BUCKET = 'documentos'

export class SupabaseDocumentosRepository implements DocumentosRepository {
  async subir(archivo: File, ruta: string): Promise<DocumentoSubido> {
    const almacen = supabase().storage.from(BUCKET)
    const resultado = await almacen.upload(ruta, archivo, { contentType: 'application/pdf', upsert: false })
    if (resultado.error) throw traducirError(resultado.error, 'No se pudo subir el archivo.')
    return { url: almacen.getPublicUrl(ruta).data.publicUrl, ruta }
  }

  async eliminar(ruta: string): Promise<void> {
    const resultado = await supabase().storage.from(BUCKET).remove([ruta])
    if (resultado.error) throw traducirError(resultado.error, 'No se pudo borrar el archivo.')
  }
}
