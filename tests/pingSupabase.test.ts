import { afterEach, describe, expect, it, vi } from 'vitest'
import { mantenerActivaLaBase } from '../worker/pingSupabase.js'

const env = { SUPABASE_URL: 'https://proyecto.supabase.co', SUPABASE_PUBLISHABLE_KEY: 'clave-publica' }

function respuesta(estado: number): Response {
  return new Response('[]', { status: estado })
}

describe('ping programado a Supabase (SCRUM-292)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('consulta una tabla pública con la clave pública y devuelve el estado', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const solicitar = vi.fn().mockResolvedValue(respuesta(200))

    const resultado = await mantenerActivaLaBase(env, solicitar)

    expect(resultado.estado).toBe(200)
    expect(solicitar).toHaveBeenCalledTimes(1)
    const [direccion, opciones] = solicitar.mock.calls[0]
    expect(direccion).toBe('https://proyecto.supabase.co/rest/v1/cabanas?select=id&limit=1')
    expect(opciones.headers).toEqual({ apikey: 'clave-publica' })
  })

  it('no duplica la barra final de la dirección', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    const solicitar = vi.fn().mockResolvedValue(respuesta(200))

    await mantenerActivaLaBase({ ...env, SUPABASE_URL: 'https://proyecto.supabase.co/ ' }, solicitar)

    expect(solicitar.mock.calls[0][0]).toBe('https://proyecto.supabase.co/rest/v1/cabanas?select=id&limit=1')
  })

  it('sin las variables falla con un mensaje claro y no consulta nada', async () => {
    const solicitar = vi.fn()

    await expect(mantenerActivaLaBase({}, solicitar)).rejects.toThrow('faltan las variables SUPABASE_URL')
    await expect(mantenerActivaLaBase({ SUPABASE_URL: 'https://x.supabase.co' }, solicitar)).rejects.toThrow('faltan las variables')
    expect(solicitar).not.toHaveBeenCalled()
  })

  it('si Supabase responde con error, lanza para que la ejecución quede marcada como fallida', async () => {
    const solicitar = vi.fn().mockResolvedValue(respuesta(401))

    await expect(mantenerActivaLaBase(env, solicitar)).rejects.toThrow('respondió 401')
  })

  it('si la red falla, lanza con el motivo', async () => {
    const solicitar = vi.fn().mockRejectedValue(new TypeError('fetch failed'))

    await expect(mantenerActivaLaBase(env, solicitar)).rejects.toThrow('no se pudo consultar (fetch failed)')
  })
})
