// src/lib/fetchConTiempoLimite.ts
// `fetch` que se corta si el servidor no responde a tiempo (SCRUM-274). Sin esto, con una conexión "a medias" una
// consulta puede quedar colgada indefinidamente y la pantalla esperando.

/** Tiempo máximo de una consulta a Supabase. */
export const TIEMPO_LIMITE_CONSULTA_MS = 15000

export function fetchConTiempoLimite(
  entrada: RequestInfo | URL,
  opciones: RequestInit = {},
  limiteMs: number = TIEMPO_LIMITE_CONSULTA_MS
): Promise<Response> {
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(new DOMException('La consulta tardó demasiado.', 'TimeoutError')), limiteMs)

  // Si quien llama también cancela la consulta, se respeta
  const origen = opciones.signal
  if (origen) {
    if (origen.aborted) controlador.abort(origen.reason)
    else origen.addEventListener('abort', () => controlador.abort(origen.reason), { once: true })
  }

  return fetch(entrada, { ...opciones, signal: controlador.signal }).finally(() => clearTimeout(temporizador))
}
