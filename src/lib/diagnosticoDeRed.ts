// src/lib/diagnosticoDeRed.ts
// *** TEMPORAL (SCRUM-274): QUITAR ANTES DEL PR. ***
// Instrumento para entender por qué, tras el modo avión, la app del iPhone queda varios minutos en "Sin conexión" aunque
// Safari sí cargue. En la pantalla de arranque muestra, por cada intento, cuánto duró y cómo terminó hacia tres destinos
// a la vez:
//   - Supabase (lo que necesita la app),
//   - el servidor de la propia página (red local con `dev:red`),
//   - un sitio cualquiera de internet (control).
// Cómo leerlo:
//   - Supabase falla ~4000 ms "cortado por tiempo" y el control de internet funciona -> conexión muerta reutilizada.
//   - Supabase e internet fallan al instante ("Load failed")                           -> red/DNS "pegados" en la app.
//   - No aparece ningún intento nuevo                                                  -> la comprobación se detuvo.
// Para quitarlo: borrar este archivo, tests/diagnosticoDeRed.test.ts y los 3 usos marcados "TEMPORAL" en main.ts y
// src/lib/pantallaDeArranque.ts.

const VERSION = 'diag-1'
const LIMITE_MS = 4000
const MAX_INTENTOS = 6

const hora = (fecha: Date = new Date()): string => fecha.toTimeString().slice(0, 8)
const cargadaA = hora()

interface Intento {
  n: number
  hora: string
  /** Lo que dijo la comprobación real de la app. */
  respondio: boolean
  supabase: string
  local: string
  internet: string
  onLine: boolean
}

const intentos: Intento[] = []
const eventos: string[] = []
let numero = 0
let enCurso: { n: number; desde: string } | null = null
let fase = ''
const oyentes = new Set<() => void>()

const notificar = () => oyentes.forEach(oyente => oyente())

/** Avisa cuando el diagnóstico cambia (la pantalla se repinta). Devuelve la función que deja de avisar. */
export function alActualizarDiagnostico(oyente: () => void): () => void {
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
  }
}

/** Una petición de prueba: devuelve "ok 123ms" o "FALLÓ 4001ms … (cortado por tiempo)". */
async function sonda(url: string, opciones: RequestInit): Promise<string> {
  const inicio = performance.now()
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), LIMITE_MS)
  try {
    const respuesta = await fetch(url, { ...opciones, cache: 'no-store', signal: controlador.signal })
    const estado = respuesta.type === 'opaque' ? '' : `${respuesta.status} `
    return `ok ${estado}${Math.round(performance.now() - inicio)}ms`
  } catch (error) {
    const ms = Math.round(performance.now() - inicio)
    const detalle = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
    return `FALLÓ ${ms}ms ${detalle.slice(0, 40)}${ms >= LIMITE_MS - 50 ? ' (cortado por tiempo)' : ''}`
  } finally {
    clearTimeout(temporizador)
  }
}

const sondaSupabase = () => {
  const url: string | undefined = import.meta.env.VITE_SUPABASE_URL
  const clave: string | undefined = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !clave) return Promise.resolve('sin configurar')
  return sonda(`${url.replace(/\/$/, '')}/auth/v1/health`, { headers: { apikey: clave } })
}
const sondaLocal = () => sonda(`${location.origin}/favicon.png`, {})
const sondaInternet = () => sonda('https://www.gstatic.com/generate_204', { mode: 'no-cors' })

/**
 * Ejecuta la comprobación real de la app y, a la vez, las tres sondas, y anota el resultado. Devuelve lo que dijo la
 * comprobación real (no cambia el comportamiento de la app).
 */
export async function comprobarConDiagnostico(comprobar: () => Promise<boolean>): Promise<boolean> {
  const n = ++numero
  enCurso = { n, desde: hora() }
  notificar()
  const [respondio, supabase, local, internet] = await Promise.all([comprobar(), sondaSupabase(), sondaLocal(), sondaInternet()])
  enCurso = null
  intentos.unshift({ n, hora: hora(), respondio, supabase, local, internet, onLine: navigator.onLine })
  intentos.length = Math.min(intentos.length, MAX_INTENTOS)
  notificar()
  return respondio
}

/** Anota cuánto tarda y cómo termina la carga de datos (lo que ocurre después de que el servidor responde). */
export async function medirCargaDeDatos(cargar: () => Promise<void>): Promise<void> {
  const inicio = performance.now()
  fase = `cargando datos desde ${hora()}`
  notificar()
  try {
    await cargar()
    fase = `datos cargados en ${Math.round(performance.now() - inicio)}ms`
  } catch (error) {
    fase = `datos FALLARON en ${Math.round(performance.now() - inicio)}ms: ${error instanceof Error ? error.message.slice(0, 50) : String(error)}`
    throw error
  } finally {
    notificar()
  }
}

/** Anota los avisos del navegador (modo avión, volver a la app) con su hora. */
export function registrarEventosDeRed(): void {
  if (typeof window === 'undefined') return
  const anotar = (texto: string) => {
    eventos.unshift(`${hora()} ${texto}`)
    eventos.length = Math.min(eventos.length, 6)
    notificar()
  }
  window.addEventListener('offline', () => anotar('offline'))
  window.addEventListener('online', () => anotar('online'))
  document.addEventListener('visibilitychange', () => anotar(`app ${document.visibilityState === 'visible' ? 'visible' : 'oculta'}`))
}

/** El texto que se muestra en pantalla. */
export function textoDiagnostico(): string {
  const lineas = [`${VERSION} · página cargada ${cargadaA} · ahora ${hora()} · onLine=${navigator.onLine}`]
  if (fase) lineas.push(`datos: ${fase}`)
  if (enCurso) lineas.push(`comprobando #${enCurso.n} desde ${enCurso.desde}…`)
  for (const i of intentos) {
    lineas.push(`${i.hora} #${i.n} ${i.respondio ? 'RESPONDE' : 'no responde'}`)
    lineas.push(`  supabase: ${i.supabase}`)
    lineas.push(`  local:    ${i.local}`)
    lineas.push(`  internet: ${i.internet}`)
  }
  if (eventos.length) lineas.push(`eventos: ${eventos.join(' | ')}`)
  return lineas.join('\n')
}
