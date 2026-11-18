// src/lib/abrirDocumento.ts
// Abre un documento (PDF) en una pestaña nueva. Los enlaces normales (Supabase) los abre el navegador por sí solo;
// los `data:` (modo local, sin Supabase) los bloquean los navegadores como destino de un enlace, así que se
// convierten antes en un archivo temporal.

/** ¿El enlace es de los que hay que convertir antes de abrir? */
export function esEnlaceData(url: string): boolean {
  return url.startsWith('data:')
}

/** Convierte un enlace `data:` en un enlace temporal (`blob:`) que el navegador sí abre. */
export async function enlaceTemporalDeData(url: string): Promise<string> {
  const respuesta = await fetch(url)
  return URL.createObjectURL(await respuesta.blob())
}

/** Abre el documento en una pestaña nueva. */
export async function abrirDocumento(url: string): Promise<void> {
  const destino = esEnlaceData(url) ? await enlaceTemporalDeData(url) : url
  window.open(destino, '_blank', 'noopener')
}
