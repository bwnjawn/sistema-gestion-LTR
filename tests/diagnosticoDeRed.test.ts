// TEMPORAL (SCRUM-274): prueba del instrumento de diagnóstico de red. Se borra junto con src/lib/diagnosticoDeRed.ts.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

async function cargar() {
  vi.resetModules()
  return import('../src/lib/diagnosticoDeRed')
}

beforeEach(() => {
  vi.stubGlobal('location', { origin: 'http://192.168.1.10:5173' })
  vi.stubGlobal('navigator', { onLine: true })
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('diagnóstico de red (temporal)', () => {
  it('devuelve lo que dijo la comprobación real y anota los tres destinos', async () => {
    const { comprobarConDiagnostico, textoDiagnostico } = await cargar()
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      if (String(url).includes('supabase.co')) throw new TypeError('Load failed')
      return new Response('ok')
    }))
    expect(await comprobarConDiagnostico(async () => false)).toBe(false)
    const texto = textoDiagnostico()
    expect(texto).toContain('#1 no responde')
    expect(texto).toMatch(/supabase: FALLÓ \d+ms TypeError: Load failed/)
    expect(texto).toMatch(/local:\s+ok 200/)
    expect(texto).toMatch(/internet: ok 200/)
    expect(texto).toContain('onLine=true')
  })

  it('distingue un fallo instantáneo de uno cortado por tiempo', async () => {
    vi.useFakeTimers()
    const { comprobarConDiagnostico, textoDiagnostico } = await cargar()
    vi.stubGlobal('fetch', vi.fn((url: string, opciones?: RequestInit) =>
      String(url).includes('supabase.co')
        ? new Promise((_ok, rechazar) => opciones?.signal?.addEventListener('abort', () => rechazar(new DOMException('aborted', 'AbortError'))))
        : Promise.resolve(new Response('ok'))
    ))
    const resultado = comprobarConDiagnostico(async () => false)
    await vi.advanceTimersByTimeAsync(4100)
    await resultado
    expect(textoDiagnostico()).toMatch(/supabase: FALLÓ \d+ms AbortError.*\(cortado por tiempo\)/)
  })

  it('numera los intentos, muestra el más reciente primero y guarda solo los últimos', async () => {
    const { comprobarConDiagnostico, textoDiagnostico } = await cargar()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok')))
    for (let i = 0; i < 8; i++) await comprobarConDiagnostico(async () => true)
    const lineas = textoDiagnostico().split('\n').filter(l => /#\d+ /.test(l))
    expect(lineas).toHaveLength(6)
    expect(lineas[0]).toContain('#8 RESPONDE')
    expect(lineas[5]).toContain('#3 RESPONDE')
  })

  it('anota la carga de datos, tanto si termina como si falla (y vuelve a lanzar el error)', async () => {
    const { medirCargaDeDatos, textoDiagnostico } = await cargar()
    await medirCargaDeDatos(async () => {})
    expect(textoDiagnostico()).toMatch(/datos: datos cargados en \d+ms/)
    await expect(medirCargaDeDatos(async () => { throw new Error('sin sesión') })).rejects.toThrow('sin sesión')
    expect(textoDiagnostico()).toMatch(/datos: datos FALLARON en \d+ms: sin sesión/)
  })

  it('avisa a la pantalla cada vez que cambia', async () => {
    const { alActualizarDiagnostico, comprobarConDiagnostico } = await cargar()
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok')))
    const aviso = vi.fn()
    const dejar = alActualizarDiagnostico(aviso)
    await comprobarConDiagnostico(async () => true)
    // Una al empezar ("comprobando…") y otra al terminar
    expect(aviso).toHaveBeenCalledTimes(2)
    dejar()
    await comprobarConDiagnostico(async () => true)
    expect(aviso).toHaveBeenCalledTimes(2)
  })
})
