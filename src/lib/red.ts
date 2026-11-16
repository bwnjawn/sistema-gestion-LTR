// src/lib/red.ts
// Estado de la red según lo que realmente responde el servidor (SCRUM-274).
//
// `navigator.onLine` NO se usa como verdad: en iPhone puede quedarse en "sin internet" después del modo avión hasta
// cerrar la app del todo, y el aviso "volvió internet" puede no llegar nunca. Aquí la red se considera caída cuando el
// navegador avisa que se cortó o cuando el servidor no responde, y mientras esté caída se vuelve a comprobar sola cada
// pocos segundos: se recupera aunque el navegador no avise.

/** Cada cuántos milisegundos se vuelve a comprobar mientras la red está caída. */
export const ESPERA_ENTRE_COMPROBACIONES_RED_MS = 3000

type Oyente = (caida: boolean) => void

let caida = false
const oyentes = new Set<Oyente>()

/** ¿La red está caída? Empieza en "no": se supone que hay red hasta que algo demuestre lo contrario. */
export function redCaida(): boolean {
  return caida
}

/** Avisa cada vez que la red cae o se recupera. Devuelve la función que deja de avisar. */
export function alCambiarLaRed(oyente: Oyente): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

/** Registra lo observado. Solo avisa a los oyentes si cambió. */
export function marcarRed(estaCaida: boolean): void {
  if (estaCaida === caida) return
  caida = estaCaida
  for (const oyente of [...oyentes]) oyente(caida)
}

/** Para las pruebas: deja el estado como al abrir la app. */
export function reiniciarRed(): void {
  caida = false
  oyentes.clear()
}

/**
 * Pone a vigilar la red: al quedar sin conexión, al volver, y cada vez que vuelves a la app, comprueba si el servidor
 * responde de verdad; mientras la red esté caída lo repite solo hasta que responda. `comprobar` devuelve si responde.
 * Devuelve la función que deja de vigilar.
 */
export function vigilarRed(opciones: { comprobar: () => Promise<boolean>; cadaMs?: number }): () => void {
  if (typeof window === 'undefined') return () => {}
  const cadaMs = opciones.cadaMs ?? ESPERA_ENTRE_COMPROBACIONES_RED_MS
  let temporizador: ReturnType<typeof setTimeout> | undefined
  let detenido = false
  let comprobando = false

  function programar(): void {
    clearTimeout(temporizador)
    // Con la red caída no se espera a que el navegador avise que volvió: se pregunta al servidor
    if (!detenido && caida) temporizador = setTimeout(() => void verificar(), cadaMs)
  }

  async function verificar(): Promise<void> {
    if (comprobando || detenido) return
    comprobando = true
    try {
      marcarRed(!(await opciones.comprobar()))
    } catch {
      marcarRed(true)
    } finally {
      comprobando = false
    }
    programar()
  }

  const alQuedarSinRed = () => {
    marcarRed(true)
    programar()
  }
  const alVolverLaRed = () => void verificar()
  const alVolverALaApp = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') void verificar()
  }

  window.addEventListener('offline', alQuedarSinRed)
  window.addEventListener('online', alVolverLaRed)
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', alVolverALaApp)

  return () => {
    detenido = true
    clearTimeout(temporizador)
    window.removeEventListener('offline', alQuedarSinRed)
    window.removeEventListener('online', alVolverLaRed)
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', alVolverALaApp)
  }
}
