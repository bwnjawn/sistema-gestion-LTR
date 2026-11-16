import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ErrorDeAlmacenamiento } from './errores'
import { fetchConTiempoLimite } from './fetchConTiempoLimite'
import { alCambiarLaRed, marcarRed, redCaida } from './red'
import { MENSAJE_SIN_CONEXION } from './repositories/supabase/errores'

// Solo la URL y la clave pública (publishable). La clave secreta no debe estar nunca en el front.
const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL
const supabaseClavePublica: string | undefined = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** Hay una URL y una clave reales (no los marcadores de `.env.example`). Sin ellas la app usa el almacenamiento local. */
// Las pruebas (modo `test`) nunca usan la base real, aunque `.env` esté completo, salvo las de integración, que
// se activan a propósito con `VITE_PROBAR_SUPABASE=1` (ver tests/integracion).
export const supabaseConfigurado: boolean =
  (import.meta.env.MODE !== 'test' || import.meta.env.VITE_PROBAR_SUPABASE === '1') &&
  !!supabaseUrl &&
  !!supabaseClavePublica &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl)

let cliente: SupabaseClient | null = null

/**
 * El cliente de Supabase, creado la primera vez que se pide. Lanza si falta la configuración.
 *
 * Con la red caída (ver src/lib/red.ts) lanza de inmediato "sin conexión" y no toca a Supabase (SCRUM-274). Motivo:
 * con una sesión caducada, cualquier consulta hace que Supabase intente renovarla con reintentos (de 12 a 25 s); la
 * primera falla cuesta eso y queda guardada 60 s, así que al volver internet dentro de ese minuto la sesión parece
 * perdida. `permitirSinInternet` es para lo que no necesita red (cerrar sesión).
 */
export function supabase(opciones: { permitirSinInternet?: boolean } = {}): SupabaseClient {
  if (!supabaseConfigurado || !supabaseUrl || !supabaseClavePublica) {
    throw new Error('Supabase no está configurado: completa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.')
  }
  if (!opciones.permitirSinInternet && redCaida()) {
    throw new ErrorDeAlmacenamiento('desconocida', MENSAJE_SIN_CONEXION)
  }
  if (!cliente) {
    cliente = createClient(supabaseUrl, supabaseClavePublica, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      // Ninguna consulta puede quedar colgada indefinidamente con una conexión a medias (SCRUM-274)
      global: { fetch: fetchConTiempoLimite }
    })
    vigilarRenovacionDeSesion(cliente)
  }
  return cliente
}

/**
 * Supabase renueva la sesión en segundo plano cada 30 s. Con la red caída esa renovación falla con reintentos y deja
 * el fallo guardado: se detiene mientras la red está caída y se reanuda cuando vuelve. Su propio aviso de "volví a la
 * app" la reanuda siempre, así que si la red sigue caída se vuelve a detener.
 */
function vigilarRenovacionDeSesion(c: SupabaseClient): void {
  alCambiarLaRed(caida => void (caida ? c.auth.stopAutoRefresh() : c.auth.startAutoRefresh()))
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && redCaida()) void c.auth.stopAutoRefresh()
    })
  }
}

/** Tiempo máximo para saber si el servidor responde. */
export const TIEMPO_COMPROBACION_MS = 4000

/**
 * ¿Responde el servidor de verdad? Cualquier respuesta HTTP (aunque sea un error) cuenta; solo la falta de respuesta
 * no. No se consulta `navigator.onLine`: la prueba real es intentar (si no hay red, el intento falla al instante).
 * Sin Supabase configurado (almacenamiento local) no hay servidor que esperar.
 */
export async function servidorAlcanzable(limiteMs: number = TIEMPO_COMPROBACION_MS): Promise<boolean> {
  if (!supabaseConfigurado || !supabaseUrl || !supabaseClavePublica) return true
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), limiteMs)
  try {
    await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/health`, {
      headers: { apikey: supabaseClavePublica },
      cache: 'no-store',
      signal: controlador.signal
    })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(temporizador)
  }
}

/** Comprueba el servidor y deja anotado el resultado en el estado de la red. */
export async function comprobarRed(): Promise<boolean> {
  const responde = await servidorAlcanzable()
  marcarRed(!responde)
  return responde
}
