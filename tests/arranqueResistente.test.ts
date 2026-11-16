// Arranque resistente (SCRUM-274): la app nunca queda en blanco, avisa cuando tarda y se recupera sola.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { arrancarConReintentos, SEGUNDOS_PARA_AVISAR_DEMORA, SEGUNDOS_PARA_SUGERIR_REINICIO, type PantallaDeArranque } from '../src/lib/arranqueConReintentos'
import { fetchConTiempoLimite } from '../src/lib/fetchConTiempoLimite'

/** Una promesa que la prueba resuelve o rechaza cuando quiere. */
function pendiente() {
  let resolver!: () => void
  let rechazar!: (e: unknown) => void
  const promesa = new Promise<void>((res, rej) => { resolver = res; rechazar = rej })
  return { promesa, resolver, rechazar }
}

function montar(inicial: { conexion?: boolean } = {}) {
  const estado = { conexion: inicial.conexion ?? true }
  const avisos: (() => void)[] = []
  const quitar = vi.fn()
  const pantalla = {
    mostrarCargando: vi.fn(),
    mostrarDemora: vi.fn(),
    mostrarSinConexion: vi.fn(),
    mostrarSugerenciaDeReinicio: vi.fn(),
    mostrarError: vi.fn()
  } satisfies PantallaDeArranque
  const iniciar = vi.fn<() => Promise<void>>()
  const alTerminar = vi.fn()
  const opciones = {
    iniciar,
    alTerminar,
    pantalla,
    hayConexion: () => estado.conexion,
    alRecuperarConexion: (alVolver: () => void) => {
      avisos.push(alVolver)
      return quitar
    }
  }
  return {
    estado, pantalla, iniciar, alTerminar, quitar, opciones,
    /** Simula que el navegador avisa que volvió internet. */
    volverInternet: () => { estado.conexion = true; avisos.forEach(a => a()) }
  }
}

describe('arranque resistente', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('con buena conexión carga, monta la app una sola vez y no avisa de nada', async () => {
    const t = montar()
    t.iniciar.mockResolvedValue()
    arrancarConReintentos(t.opciones)
    expect(t.pantalla.mostrarCargando).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(0)
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(t.pantalla.mostrarDemora).not.toHaveBeenCalled()
    expect(t.pantalla.mostrarError).not.toHaveBeenCalled()
    expect(t.quitar).toHaveBeenCalledTimes(1)
  })

  it('si tarda más de lo normal avisa con el botón de reintentar, y sigue esperando', async () => {
    const t = montar()
    const carga = pendiente()
    t.iniciar.mockReturnValue(carga.promesa)
    arrancarConReintentos(t.opciones)

    await vi.advanceTimersByTimeAsync(SEGUNDOS_PARA_AVISAR_DEMORA * 1000 - 100)
    expect(t.pantalla.mostrarDemora).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(200)
    expect(t.pantalla.mostrarDemora).toHaveBeenCalledTimes(1)
    expect(t.alTerminar).not.toHaveBeenCalled()

    // Cuando por fin responde, la app se monta sola
    carga.resolver()
    await vi.advanceTimersByTimeAsync(0)
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
  })

  it('sin internet al empezar avisa al instante y no espera a que fallen las consultas', async () => {
    const t = montar({ conexion: false })
    arrancarConReintentos(t.opciones)
    expect(t.pantalla.mostrarSinConexion).toHaveBeenCalledTimes(1)
    expect(t.iniciar).not.toHaveBeenCalled()
    expect(t.pantalla.mostrarCargando).not.toHaveBeenCalled()
  })

  it('al volver internet carga sola, sin que nadie toque nada', async () => {
    const t = montar({ conexion: false })
    t.iniciar.mockResolvedValue()
    arrancarConReintentos(t.opciones)
    t.volverInternet()
    await vi.advanceTimersByTimeAsync(0)
    expect(t.iniciar).toHaveBeenCalledTimes(1)
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
  })

  it('si falla con internet explica el error y permite reintentar con el botón', async () => {
    const t = montar()
    t.iniciar.mockRejectedValueOnce(new Error('falló')).mockResolvedValueOnce()
    arrancarConReintentos(t.opciones)
    await vi.advanceTimersByTimeAsync(0)
    expect(t.pantalla.mostrarError).toHaveBeenCalledTimes(1)
    expect(t.alTerminar).not.toHaveBeenCalled()

    const reintentar = t.pantalla.mostrarError.mock.calls[0][0]
    reintentar()
    await vi.advanceTimersByTimeAsync(0)
    expect(t.iniciar).toHaveBeenCalledTimes(2)
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
  })

  it('si falla porque se cortó el internet lo dice como "sin conexión" y se recupera al volver', async () => {
    const t = montar()
    const carga = pendiente()
    t.iniciar.mockReturnValueOnce(carga.promesa).mockResolvedValueOnce()
    arrancarConReintentos(t.opciones)
    t.estado.conexion = false
    carga.rechazar(new Error('sin red'))
    await vi.advanceTimersByTimeAsync(0)
    expect(t.pantalla.mostrarSinConexion).toHaveBeenCalledTimes(1)
    expect(t.pantalla.mostrarError).not.toHaveBeenCalled()

    t.volverInternet()
    await vi.advanceTimersByTimeAsync(0)
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
  })

  it('un error ya no avisa "tarda más de lo normal" después', async () => {
    const t = montar()
    t.iniciar.mockRejectedValue(new Error('falló'))
    arrancarConReintentos(t.opciones)
    await vi.advanceTimersByTimeAsync(0)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(t.pantalla.mostrarDemora).not.toHaveBeenCalled()
  })

  it('el resultado de un intento viejo no pisa al nuevo, y gana el primero que termine bien', async () => {
    const t = montar()
    const viejo = pendiente()
    const nuevo = pendiente()
    t.iniciar.mockReturnValueOnce(viejo.promesa).mockReturnValueOnce(nuevo.promesa)
    arrancarConReintentos(t.opciones)

    // Vuelve internet mientras el primer intento sigue colgado: empieza otro
    t.volverInternet()
    expect(t.iniciar).toHaveBeenCalledTimes(2)

    // El intento viejo falla tarde: no debe mostrar un error encima del intento nuevo
    viejo.rechazar(new Error('tarde'))
    await vi.advanceTimersByTimeAsync(0)
    expect(t.pantalla.mostrarError).not.toHaveBeenCalled()

    nuevo.resolver()
    await vi.advanceTimersByTimeAsync(0)
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
  })

  it('una vez montada la app, volver internet ya no reinicia nada', async () => {
    const t = montar()
    t.iniciar.mockResolvedValue()
    arrancarConReintentos(t.opciones)
    await vi.advanceTimersByTimeAsync(0)
    t.volverInternet()
    await vi.advanceTimersByTimeAsync(0)
    expect(t.iniciar).toHaveBeenCalledTimes(1)
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
  })

  it('cancelar detiene los avisos y deja de escuchar la conexión', async () => {
    const t = montar()
    t.iniciar.mockReturnValue(new Promise(() => {}))
    const { cancelar } = arrancarConReintentos(t.opciones)
    cancelar()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(t.pantalla.mostrarDemora).not.toHaveBeenCalled()
    expect(t.quitar).toHaveBeenCalled()
  })
})

describe('arranque resistente: esperar a que el servidor responda de verdad', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('si el servidor responde, carga enseguida y comprueba una sola vez', async () => {
    const t = montar()
    const comprobar = vi.fn().mockResolvedValue(true)
    t.iniciar.mockResolvedValue()
    arrancarConReintentos({ ...t.opciones, comprobarServidor: comprobar })
    await vi.advanceTimersByTimeAsync(0)
    expect(comprobar).toHaveBeenCalledTimes(1)
    expect(t.iniciar).toHaveBeenCalledTimes(1)
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
    expect(t.pantalla.mostrarSinConexion).not.toHaveBeenCalled()
  })

  it('con "internet" pero sin que el servidor responda (recién reconectado) no pide nada hasta que responda', async () => {
    const t = montar()
    const comprobar = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(false).mockResolvedValue(true)
    t.iniciar.mockResolvedValue()
    arrancarConReintentos({ ...t.opciones, comprobarServidor: comprobar, esperaEntreComprobacionesMs: 2000 })

    await vi.advanceTimersByTimeAsync(0)
    expect(t.pantalla.mostrarSinConexion).toHaveBeenCalledTimes(1)
    expect(t.iniciar).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(2000)
    // Sigue sin responder: no se repite el aviso ni se carga nada
    expect(comprobar).toHaveBeenCalledTimes(2)
    expect(t.pantalla.mostrarSinConexion).toHaveBeenCalledTimes(1)
    expect(t.iniciar).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(2000)
    expect(comprobar).toHaveBeenCalledTimes(3)
    // Responde: vuelve a "cargando", carga y monta la app, y todo sin que nadie toque nada
    expect(t.pantalla.mostrarCargando).toHaveBeenCalledTimes(2)
    expect(t.iniciar).toHaveBeenCalledTimes(1)
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
  })

  it('el aviso de "tarda más de lo normal" cuenta desde que empieza a cargar, no mientras espera a la red', async () => {
    const t = montar()
    const comprobar = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true)
    t.iniciar.mockReturnValue(new Promise(() => {}))
    arrancarConReintentos({ ...t.opciones, comprobarServidor: comprobar, esperaEntreComprobacionesMs: 10_000 })
    await vi.advanceTimersByTimeAsync(10_000)
    expect(t.iniciar).toHaveBeenCalledTimes(1)
    expect(t.pantalla.mostrarDemora).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(SEGUNDOS_PARA_AVISAR_DEMORA * 1000 + 100)
    expect(t.pantalla.mostrarDemora).toHaveBeenCalledTimes(1)
  })

  it('un intento nuevo (volvió internet) corta la espera del anterior', async () => {
    const t = montar()
    const respuestas = [false, false, false, true]
    const comprobar = vi.fn(async () => respuestas.shift() ?? true)
    t.iniciar.mockResolvedValue()
    arrancarConReintentos({ ...t.opciones, comprobarServidor: comprobar, esperaEntreComprobacionesMs: 2000 })
    await vi.advanceTimersByTimeAsync(0)
    expect(comprobar).toHaveBeenCalledTimes(1)

    t.volverInternet()
    await vi.advanceTimersByTimeAsync(0)
    // El intento nuevo comprobó una vez más; el viejo ya no sigue comprobando por su cuenta
    expect(comprobar).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(2000)
    expect(comprobar).toHaveBeenCalledTimes(3)
    await vi.advanceTimersByTimeAsync(2000)
    expect(t.iniciar).toHaveBeenCalledTimes(1)
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
  })

  it('cancelar corta la espera', async () => {
    const t = montar()
    const comprobar = vi.fn().mockResolvedValue(false)
    const { cancelar } = arrancarConReintentos({ ...t.opciones, comprobarServidor: comprobar, esperaEntreComprobacionesMs: 1000 })
    await vi.advanceTimersByTimeAsync(0)
    cancelar()
    const llamadas = comprobar.mock.calls.length
    await vi.advanceTimersByTimeAsync(10_000)
    expect(comprobar.mock.calls.length).toBe(llamadas)
    expect(t.iniciar).not.toHaveBeenCalled()
  })
})

describe('arranque resistente: sugerir cerrar y volver a abrir la app', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const sinRespuesta = () => vi.fn().mockResolvedValue(false)

  it('si el servidor lleva un rato sin responder, sugiere cerrar y volver a abrir la app, una sola vez', async () => {
    const t = montar()
    arrancarConReintentos({ ...t.opciones, comprobarServidor: sinRespuesta(), esperaEntreComprobacionesMs: 2000 })
    await vi.advanceTimersByTimeAsync(SEGUNDOS_PARA_SUGERIR_REINICIO * 1000 - 500)
    expect(t.pantalla.mostrarSugerenciaDeReinicio).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1000)
    expect(t.pantalla.mostrarSugerenciaDeReinicio).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(120_000)
    expect(t.pantalla.mostrarSugerenciaDeReinicio).toHaveBeenCalledTimes(1)
  })

  it('si el servidor responde antes, no sugiere nada', async () => {
    const t = montar()
    const comprobar = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true)
    t.iniciar.mockResolvedValue()
    arrancarConReintentos({ ...t.opciones, comprobarServidor: comprobar, esperaEntreComprobacionesMs: 2000 })
    await vi.advanceTimersByTimeAsync(60_000)
    expect(t.pantalla.mostrarSugerenciaDeReinicio).not.toHaveBeenCalled()
    expect(t.alTerminar).toHaveBeenCalledTimes(1)
  })

  it('Reintentar empieza la cuenta de nuevo', async () => {
    const t = montar()
    arrancarConReintentos({ ...t.opciones, comprobarServidor: sinRespuesta(), esperaEntreComprobacionesMs: 2000 })
    await vi.advanceTimersByTimeAsync(15_000)
    const reintentar = t.pantalla.mostrarSinConexion.mock.calls[0][0]
    reintentar()
    await vi.advanceTimersByTimeAsync(10_000)
    // Pasaron 25 s desde el principio, pero solo 10 desde el último intento
    expect(t.pantalla.mostrarSugerenciaDeReinicio).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(11_000)
    expect(t.pantalla.mostrarSugerenciaDeReinicio).toHaveBeenCalledTimes(1)
  })

  it('si el navegador dice que no hay internet (modo avión) no sugiere cerrar la app', async () => {
    const t = montar({ conexion: false })
    arrancarConReintentos({ ...t.opciones, comprobarServidor: sinRespuesta() })
    await vi.advanceTimersByTimeAsync(120_000)
    expect(t.pantalla.mostrarSinConexion).toHaveBeenCalledTimes(1)
    expect(t.pantalla.mostrarSugerenciaDeReinicio).not.toHaveBeenCalled()
  })

  it('cancelar detiene la sugerencia', async () => {
    const t = montar()
    const { cancelar } = arrancarConReintentos({ ...t.opciones, comprobarServidor: sinRespuesta(), esperaEntreComprobacionesMs: 2000 })
    await vi.advanceTimersByTimeAsync(5000)
    cancelar()
    await vi.advanceTimersByTimeAsync(60_000)
    expect(t.pantalla.mostrarSugerenciaDeReinicio).not.toHaveBeenCalled()
  })
})

describe('fetchConTiempoLimite', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  /** Un fetch que nunca responde, pero que se corta si lo cancelan (como el de verdad). */
  function fetchColgado() {
    return vi.fn((_entrada: unknown, opciones?: RequestInit) =>
      new Promise<Response>((_resolver, rechazar) => {
        const senal = opciones?.signal
        // Como el fetch real: si ya viene cancelada, rechaza de inmediato
        if (senal?.aborted) return rechazar(senal.reason ?? new Error('cancelado'))
        senal?.addEventListener('abort', () => rechazar(senal.reason ?? new Error('cancelado')))
      })
    )
  }

  it('corta la consulta que no responde a tiempo', async () => {
    vi.stubGlobal('fetch', fetchColgado())
    const consulta = fetchConTiempoLimite('https://ejemplo.test/x', {}, 5000)
    const resultado = expect(consulta).rejects.toMatchObject({ name: 'TimeoutError' })
    await vi.advanceTimersByTimeAsync(5001)
    await resultado
  })

  it('una consulta que responde a tiempo pasa tal cual y no deja el temporizador pendiente', async () => {
    const respuesta = new Response('ok')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta))
    await expect(fetchConTiempoLimite('https://ejemplo.test/x', {}, 5000)).resolves.toBe(respuesta)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('si quien llama cancela, la consulta se cancela', async () => {
    vi.stubGlobal('fetch', fetchColgado())
    const propio = new AbortController()
    const consulta = fetchConTiempoLimite('https://ejemplo.test/x', { signal: propio.signal }, 5000)
    const resultado = expect(consulta).rejects.toBeDefined()
    propio.abort(new Error('cancelada por el usuario'))
    await resultado
  })

  it('con una cancelación que ya venía hecha, ni siquiera espera', async () => {
    vi.stubGlobal('fetch', fetchColgado())
    const propio = new AbortController()
    propio.abort(new Error('ya cancelada'))
    await expect(fetchConTiempoLimite('https://ejemplo.test/x', { signal: propio.signal }, 5000)).rejects.toBeDefined()
  })
})
