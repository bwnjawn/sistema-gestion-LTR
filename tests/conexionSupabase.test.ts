// Con la red caída no se le pide nada a Supabase (SCRUM-274). Con una sesión caducada, cada consulta sin red haría que
// Supabase reintente renovarla de 12 a 25 s y guarde el fallo 60 s (ver docs/supabase-esquema.md).
// La red se considera caída por lo que responde el servidor, NO por `navigator.onLine` (ver src/lib/red.ts).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MENSAJE_SIN_CONEXION } from '../src/lib/repositories/supabase/errores'

const { clienteFalso, crearCliente } = vi.hoisted(() => {
  const clienteFalso = { auth: { stopAutoRefresh: vi.fn(), startAutoRefresh: vi.fn() } }
  return { clienteFalso, crearCliente: vi.fn(() => clienteFalso) }
})
vi.mock('@supabase/supabase-js', () => ({ createClient: crearCliente }))

let documento: EventTarget & { visibilityState: string }

/** Carga `supabase.ts` y `red.ts` de nuevo (estado limpio), con Supabase "configurado" o no. */
async function cargarModulos(configurado = true) {
  vi.resetModules()
  vi.stubEnv('VITE_PROBAR_SUPABASE', '1')
  vi.stubEnv('VITE_SUPABASE_URL', configurado ? 'https://abcdefgh.supabase.co' : '')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', configurado ? 'clave-publica-de-prueba' : '')
  const conexion = await import('../src/lib/supabase')
  const red = await import('../src/lib/red')
  return { ...conexion, red }
}

beforeEach(() => {
  crearCliente.mockClear()
  clienteFalso.auth.stopAutoRefresh.mockClear()
  clienteFalso.auth.startAutoRefresh.mockClear()
  documento = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  vi.stubGlobal('document', documento)
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('supabase(): con la red caída no toca a Supabase', () => {
  it('con red crea el cliente una sola vez', async () => {
    const { supabase } = await cargarModulos()
    expect(supabase()).toBe(clienteFalso)
    expect(supabase()).toBe(clienteFalso)
    expect(crearCliente).toHaveBeenCalledTimes(1)
  })

  it('con la red caída lanza "sin conexión" al instante y ni siquiera crea el cliente', async () => {
    const { supabase, red } = await cargarModulos()
    red.marcarRed(true)
    let error: unknown
    try {
      supabase()
    } catch (e) {
      error = e
    }
    // Se compara por nombre: al recargar los módulos en la prueba, la clase del error es otra copia
    expect((error as Error).name).toBe('ErrorDeAlmacenamiento')
    expect((error as Error).message).toBe(MENSAJE_SIN_CONEXION)
    expect(crearCliente).not.toHaveBeenCalled()
  })

  it('lo que no necesita red (cerrar sesión) sí puede pedir el cliente', async () => {
    const { supabase, red } = await cargarModulos()
    red.marcarRed(true)
    expect(supabase({ permitirSinInternet: true })).toBe(clienteFalso)
  })

  it('cuando la red se recupera vuelve a funcionar', async () => {
    const { supabase, red } = await cargarModulos()
    red.marcarRed(true)
    expect(() => supabase()).toThrow()
    red.marcarRed(false)
    expect(supabase()).toBe(clienteFalso)
  })

  it('sin configurar sigue avisando que falta la configuración', async () => {
    const { supabase } = await cargarModulos(false)
    expect(() => supabase()).toThrow(/no está configurado/)
  })
})

describe('la renovación de sesión en segundo plano no corre con la red caída', () => {
  it('se detiene cuando la red cae y se reanuda cuando se recupera', async () => {
    const { supabase, red } = await cargarModulos()
    supabase()
    red.marcarRed(true)
    expect(clienteFalso.auth.stopAutoRefresh).toHaveBeenCalledTimes(1)
    red.marcarRed(false)
    expect(clienteFalso.auth.startAutoRefresh).toHaveBeenCalledTimes(1)
  })

  it('si vuelves a la app con la red caída (Supabase la reanuda sola) se vuelve a detener', async () => {
    const { supabase, red } = await cargarModulos()
    supabase()
    red.marcarRed(true)
    documento.dispatchEvent(new Event('visibilitychange'))
    expect(clienteFalso.auth.stopAutoRefresh).toHaveBeenCalledTimes(2)
  })

  it('si vuelves a la app con red no se detiene nada', async () => {
    const { supabase } = await cargarModulos()
    supabase()
    documento.dispatchEvent(new Event('visibilitychange'))
    expect(clienteFalso.auth.stopAutoRefresh).not.toHaveBeenCalled()
  })
})

describe('servidorAlcanzable(): ¿responde el servidor de verdad?', () => {
  it('cualquier respuesta HTTP cuenta, aunque sea un error', async () => {
    const { servidorAlcanzable } = await cargarModulos()
    const peticion = vi.fn().mockResolvedValue(new Response('no autorizado', { status: 401 }))
    vi.stubGlobal('fetch', peticion)
    expect(await servidorAlcanzable()).toBe(true)
    const [url, opciones] = peticion.mock.calls[0]
    expect(url).toBe('https://abcdefgh.supabase.co/auth/v1/health')
    expect((opciones as RequestInit).headers).toEqual({ apikey: 'clave-publica-de-prueba' })
    expect((opciones as RequestInit).cache).toBe('no-store')
  })

  it('NO se fía de navigator.onLine: si el navegador dice "sin internet" pero el servidor responde, dice que sí', async () => {
    // El caso del iPhone tras el modo avión: la bandera queda en "sin internet" hasta cerrar la app
    vi.stubGlobal('navigator', { onLine: false })
    const { servidorAlcanzable } = await cargarModulos()
    const peticion = vi.fn().mockResolvedValue(new Response('ok'))
    vi.stubGlobal('fetch', peticion)
    expect(await servidorAlcanzable()).toBe(true)
    expect(peticion).toHaveBeenCalledTimes(1)
  })

  it('si la petición falla (sin red de verdad, o DNS aún sin listo) responde que no', async () => {
    const { servidorAlcanzable } = await cargarModulos()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    expect(await servidorAlcanzable()).toBe(false)
  })

  it('si el servidor no responde a tiempo, responde que no', async () => {
    vi.useFakeTimers()
    try {
      const { servidorAlcanzable } = await cargarModulos()
      vi.stubGlobal('fetch', vi.fn((_url: unknown, opciones?: RequestInit) =>
        new Promise((_ok, rechazar) => opciones?.signal?.addEventListener('abort', () => rechazar(new Error('cancelado'))))
      ))
      const resultado = servidorAlcanzable(3000)
      await vi.advanceTimersByTimeAsync(3001)
      expect(await resultado).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('sin Supabase configurado (almacenamiento local) no hay servidor que esperar', async () => {
    const { servidorAlcanzable } = await cargarModulos(false)
    const peticion = vi.fn()
    vi.stubGlobal('fetch', peticion)
    expect(await servidorAlcanzable()).toBe(true)
    expect(peticion).not.toHaveBeenCalled()
  })
})

describe('comprobarRed(): deja anotado el resultado en el estado de la red', () => {
  it('si el servidor no responde marca la red caída, y cuando responde la marca recuperada (y avisa)', async () => {
    const { comprobarRed, red } = await cargarModulos()
    const avisos: boolean[] = []
    red.alCambiarLaRed(caida => avisos.push(caida))

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    expect(await comprobarRed()).toBe(false)
    expect(red.redCaida()).toBe(true)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')))
    expect(await comprobarRed()).toBe(true)
    expect(red.redCaida()).toBe(false)
    expect(avisos).toEqual([true, false])
  })
})
