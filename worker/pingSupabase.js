// Ping programado a Supabase (SCRUM-292).
//
// Por qué existe: el plan gratuito de Supabase pausa el proyecto cuando casi no hay actividad de base
// de datos durante una semana, y con el proyecto pausado la app deja de funcionar. Una vez al día, el
// Worker hace una consulta mínima para que siempre haya actividad.
//
// Qué NO hace: no es un respaldo. Evita la pausa, no protege de borrados por error ni de fallas de la
// plataforma (ver SCRUM-293 y docs/despliegue-y-mantenimiento.md).
//
// Configuración (Worker → Settings → Variables and secrets, tipo "Secret"; no van en el repositorio
// porque es público, y los secretos no se pierden al desplegar):
//   SUPABASE_URL              la misma dirección que VITE_SUPABASE_URL
//   SUPABASE_PUBLISHABLE_KEY  la misma clave pública que VITE_SUPABASE_PUBLISHABLE_KEY

/** Tabla de lectura pública (la ven los clientes sin sesión): no hace falta ninguna clave secreta. */
const RUTA_CONSULTA = '/rest/v1/cabanas?select=id&limit=1'
const TIEMPO_LIMITE_MS = 15000

/**
 * Hace la consulta mínima. Si algo falla (variables sin cargar, error de red o respuesta que no es 2xx)
 * lanza un error: así la ejecución queda marcada como fallida en el panel de Cloudflare y en los logs.
 *
 * @param {{ SUPABASE_URL?: string, SUPABASE_PUBLISHABLE_KEY?: string }} env variables del Worker
 * @param {typeof fetch} solicitar `fetch`; se puede reemplazar en las pruebas
 * @returns {Promise<{ estado: number, ms: number }>}
 */
export async function mantenerActivaLaBase(env, solicitar = fetch) {
  const direccion = (env.SUPABASE_URL || '').trim().replace(/\/+$/, '')
  const clave = (env.SUPABASE_PUBLISHABLE_KEY || '').trim()
  if (!direccion || !clave) {
    throw new Error('Ping a Supabase: faltan las variables SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en el Worker.')
  }

  const inicio = Date.now()
  let respuesta
  try {
    respuesta = await solicitar(direccion + RUTA_CONSULTA, {
      headers: { apikey: clave },
      signal: AbortSignal.timeout(TIEMPO_LIMITE_MS)
    })
  } catch (error) {
    throw new Error(`Ping a Supabase: no se pudo consultar (${error instanceof Error ? error.message : String(error)}).`)
  }

  const ms = Date.now() - inicio
  if (!respuesta.ok) {
    throw new Error(`Ping a Supabase: respondió ${respuesta.status} (${ms} ms).`)
  }
  console.log(`Ping a Supabase: correcto, respondió ${respuesta.status} en ${ms} ms.`)
  return { estado: respuesta.status, ms }
}
