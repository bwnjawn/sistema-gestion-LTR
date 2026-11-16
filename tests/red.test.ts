// Vigilancia de la red (SCRUM-274): se recupera sola aunque el navegador no avise que volvió internet.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { alCambiarLaRed, ESPERA_ENTRE_COMPROBACIONES_RED_MS, marcarRed, redCaida, reiniciarRed, vigilarRed } from '../src/lib/red'

beforeEach(() => reiniciarRed())

describe('estado de la red', () => {
  it('empieza con red, y avisa solo cuando cambia', () => {
    expect(redCaida()).toBe(false)
    const avisos: boolean[] = []
    alCambiarLaRed(caida => avisos.push(caida))
    marcarRed(false)
    marcarRed(true)
    marcarRed(true)
    marcarRed(false)
    expect(avisos).toEqual([true, false])
  })

  it('quien deja de escuchar ya no recibe avisos', () => {
    const avisos: boolean[] = []
    const dejar = alCambiarLaRed(caida => avisos.push(caida))
    marcarRed(true)
    dejar()
    marcarRed(false)
    expect(avisos).toEqual([true])
  })
})

describe('vigilarRed', () => {
  let ventana: EventTarget
  let documento: EventTarget & { visibilityState: string }
  let detener: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    ventana = new EventTarget()
    documento = Object.assign(new EventTarget(), { visibilityState: 'visible' })
    vi.stubGlobal('window', ventana)
    vi.stubGlobal('document', documento)
  })
  afterEach(() => {
    detener?.()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('al cortarse la red la marca caída y, aunque el navegador NUNCA avise que volvió, la recupera sola', async () => {
    let hayRed = false
    const comprobar = vi.fn(async () => hayRed)
    detener = vigilarRed({ comprobar })

    ventana.dispatchEvent(new Event('offline'))
    expect(redCaida()).toBe(true)

    // Mientras no responde, vuelve a comprobar cada pocos segundos
    await vi.advanceTimersByTimeAsync(ESPERA_ENTRE_COMPROBACIONES_RED_MS)
    await vi.advanceTimersByTimeAsync(ESPERA_ENTRE_COMPROBACIONES_RED_MS)
    expect(comprobar).toHaveBeenCalledTimes(2)
    expect(redCaida()).toBe(true)

    // Vuelve la red, sin ningún evento del navegador
    hayRed = true
    await vi.advanceTimersByTimeAsync(ESPERA_ENTRE_COMPROBACIONES_RED_MS)
    expect(redCaida()).toBe(false)

    // Y ya no sigue comprobando
    const llamadas = comprobar.mock.calls.length
    await vi.advanceTimersByTimeAsync(ESPERA_ENTRE_COMPROBACIONES_RED_MS * 5)
    expect(comprobar.mock.calls.length).toBe(llamadas)
  })

  it('avisa a quien escucha cuando la red cae y cuando se recupera', async () => {
    let hayRed = false
    detener = vigilarRed({ comprobar: async () => hayRed })
    const avisos: boolean[] = []
    alCambiarLaRed(caida => avisos.push(caida))
    ventana.dispatchEvent(new Event('offline'))
    hayRed = true
    await vi.advanceTimersByTimeAsync(ESPERA_ENTRE_COMPROBACIONES_RED_MS)
    expect(avisos).toEqual([true, false])
  })

  it('cuando el navegador avisa que volvió internet comprueba de inmediato', async () => {
    const comprobar = vi.fn(async () => true)
    detener = vigilarRed({ comprobar })
    marcarRed(true)
    ventana.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(0)
    expect(comprobar).toHaveBeenCalledTimes(1)
    expect(redCaida()).toBe(false)
  })

  it('al volver a la app comprueba la red, y si resulta caída la marca y empieza a reintentar', async () => {
    let hayRed = false
    const comprobar = vi.fn(async () => hayRed)
    detener = vigilarRed({ comprobar })

    documento.visibilityState = 'hidden'
    documento.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(comprobar).not.toHaveBeenCalled()

    documento.visibilityState = 'visible'
    documento.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(comprobar).toHaveBeenCalledTimes(1)
    expect(redCaida()).toBe(true)

    hayRed = true
    await vi.advanceTimersByTimeAsync(ESPERA_ENTRE_COMPROBACIONES_RED_MS)
    expect(redCaida()).toBe(false)
  })

  it('una comprobación que falla con error cuenta como red caída', async () => {
    detener = vigilarRed({ comprobar: async () => { throw new Error('boom') } })
    ventana.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(0)
    expect(redCaida()).toBe(true)
  })

  it('no hay dos comprobaciones a la vez', async () => {
    let soltar!: () => void
    const compuerta = new Promise<void>(resolver => { soltar = resolver })
    const comprobar = vi.fn(async () => { await compuerta; return true })
    detener = vigilarRed({ comprobar })
    ventana.dispatchEvent(new Event('online'))
    ventana.dispatchEvent(new Event('online'))
    documento.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(comprobar).toHaveBeenCalledTimes(1)
    soltar()
    await vi.advanceTimersByTimeAsync(0)
  })

  it('al dejar de vigilar quita los oyentes y los temporizadores', async () => {
    const comprobar = vi.fn(async () => false)
    detener = vigilarRed({ comprobar })
    ventana.dispatchEvent(new Event('offline'))
    detener()
    await vi.advanceTimersByTimeAsync(ESPERA_ENTRE_COMPROBACIONES_RED_MS * 3)
    ventana.dispatchEvent(new Event('online'))
    documento.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(0)
    expect(comprobar).not.toHaveBeenCalled()
  })
})
