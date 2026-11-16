// Actualización automática del panel (SCRUM-273): al volver a la app, en tiempo real y a mano.
// Se simula "otro dispositivo" escribiendo directo en el repositorio, sin pasar por los stores.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales, usarRepositorios, type Repositorios } from '../src/lib/repositories'
import { textoHaceCuanto } from '../src/services/actualizacion'
import { ESPERA_DE_AVISOS_MS, SEGUNDOS_MINIMOS_AL_VOLVER, useActualizacionStore } from '../src/stores/actualizacionStore'
import { useAuthStore } from '../src/stores/authStore'
import { useCatalogStore } from '../src/stores/catalogStore'
import { useRequestsStore } from '../src/stores/requestsStore'
import { useSettingsStore } from '../src/stores/settingsStore'
import { DEFAULT_CABINS } from '../src/data/seed'
import { DEFAULT_CONTACT } from '../src/data/ajustesPorDefecto'
import type { ReservationRequest } from '../src/types/domain'

let mem: ReturnType<typeof crearAlmacenamientoEnMemoria>
let repos: Repositorios
let avisar: (() => void) | null
let cancelarEscucha: ReturnType<typeof vi.fn>

/** Repositorios locales que se hacen pasar por Supabase, con un "canal en vivo" que la prueba controla. */
function preparar(modo: 'local' | 'supabase' = 'supabase') {
  mem = crearAlmacenamientoEnMemoria()
  repos = { ...crearRepositoriosLocales(mem), modo }
  avisar = null
  cancelarEscucha = vi.fn()
  repos.requests.escucharCambios = (alCambiar: () => void) => {
    avisar = alCambiar
    return cancelarEscucha as unknown as () => void
  }
  usarRepositorios(repos)
  setActivePinia(createPinia())
}

function conSesionDeAdministrador() {
  useAuthStore().currentUser = { id: 'admin-1', email: 'admin@troncos.cl', role: 'owner' }
}

let contador = 0
/** Una solicitud como la guardaría otro dispositivo. */
function solicitudAjena(sobre: Partial<ReservationRequest> = {}): ReservationRequest {
  contador++
  return {
    id: `ajena-${contador}`,
    requestCode: `SOL-9${contador}`,
    clientName: 'Cliente de otro dispositivo',
    clientPhone: '+56 9 1234 5678',
    type: 'restaurante',
    resourceName: 'Restaurante',
    date: '2027-03-10',
    guestsCount: 4,
    totalAmount: 40000,
    depositRequired: 12000,
    payments: [],
    status: 'pending',
    createdAt: new Date().toISOString(),
    details: { startDate: '2027-03-10', selectedMealTypes: ['almuerzo'] },
    ...sobre
  }
}

describe('textoHaceCuanto', () => {
  const t0 = 1_000_000_000

  it('dice "ahora" durante los primeros segundos y después cuenta minutos y horas', () => {
    expect(textoHaceCuanto(null, t0)).toBe('Sin actualizar')
    expect(textoHaceCuanto(t0, t0)).toBe('Actualizado ahora')
    expect(textoHaceCuanto(t0, t0 + 44_000)).toBe('Actualizado ahora')
    expect(textoHaceCuanto(t0, t0 + 50_000)).toBe('Actualizado hace 1 min')
    expect(textoHaceCuanto(t0, t0 + 5 * 60_000)).toBe('Actualizado hace 5 min')
    expect(textoHaceCuanto(t0, t0 + 59 * 60_000 + 30_000)).toBe('Actualizado hace 59 min')
    expect(textoHaceCuanto(t0, t0 + 2 * 3600_000)).toBe('Actualizado hace 2 h')
    expect(textoHaceCuanto(t0, t0 + 3 * 24 * 3600_000)).toBe('Actualizado hace más de un día')
  })

  it('un reloj adelantado no produce tiempos negativos', () => {
    expect(textoHaceCuanto(t0 + 10_000, t0)).toBe('Actualizado ahora')
  })
})

describe('requestsStore.refrescar', () => {
  beforeEach(() => preparar())

  it('trae lo que otro dispositivo guardó', async () => {
    const store = useRequestsStore()
    await store.init()
    expect(store.requests).toHaveLength(0)
    await repos.requests.create(solicitudAjena())
    expect(await store.refrescar()).toBe(true)
    expect(store.requests.map(r => r.clientName)).toEqual(['Cliente de otro dispositivo'])
  })

  it('si no cambió nada, no toca la lista (no hay parpadeo)', async () => {
    await repos.requests.create(solicitudAjena())
    const store = useRequestsStore()
    await store.init()
    const antes = store.requests
    expect(await store.refrescar()).toBe(true)
    expect(store.requests).toBe(antes)
  })

  it('mientras el administrador guarda un cambio no se actualiza, y al terminar se actualiza solo', async () => {
    const original = solicitudAjena()
    await repos.requests.create(original)
    const store = useRequestsStore()
    await store.init()

    // El guardado queda detenido hasta que la prueba lo suelte
    let soltar!: () => void
    const compuerta = new Promise<void>(resolver => { soltar = resolver })
    const actualizar = repos.requests.update.bind(repos.requests)
    repos.requests.update = async (id, cambios) => {
      await compuerta
      return actualizar(id, cambios)
    }

    const guardando = store.updateRequestStatus(original.id, 'confirmed')
    // Otro dispositivo agrega una solicitud mientras tanto
    await repos.requests.create(solicitudAjena({ clientName: 'Llegó durante el guardado' }))
    expect(await store.refrescar()).toBe(false)
    // La pantalla muestra el cambio del administrador y aún no la solicitud nueva (no se pisó nada)
    expect(store.requests.find(r => r.id === original.id)?.status).toBe('confirmed')
    expect(store.requests.some(r => r.clientName === 'Llegó durante el guardado')).toBe(false)

    soltar()
    expect(await guardando).toBe(true)
    await new Promise(resolver => setTimeout(resolver, 0))
    expect(store.requests.some(r => r.clientName === 'Llegó durante el guardado')).toBe(true)
    expect(store.requests.find(r => r.id === original.id)?.status).toBe('confirmed')
  })

  it('si el servidor falla, lanza el error y deja en pantalla lo que ya había', async () => {
    await repos.requests.create(solicitudAjena())
    const store = useRequestsStore()
    await store.init()
    repos.requests.list = async () => { throw new Error('sin red') }
    await expect(store.refrescar()).rejects.toThrow('sin red')
    expect(store.requests).toHaveLength(1)
  })
})

describe('actualizacionStore: actualizar todo', () => {
  beforeEach(() => preparar())

  it('sin Supabase no hace nada (no hay otros dispositivos)', async () => {
    preparar('local')
    const spy = vi.spyOn(repos.requests, 'list')
    const store = useActualizacionStore()
    expect(store.disponible).toBe(false)
    await store.refrescarTodo()
    expect(spy).not.toHaveBeenCalled()
    expect(store.ultimaVez).toBeNull()
  })

  it('como administrador trae solicitudes, catálogo y ajustes cambiados por otro dispositivo', async () => {
    conSesionDeAdministrador()
    const solicitudes = useRequestsStore()
    const catalogo = useCatalogStore()
    const ajustes = useSettingsStore()
    await Promise.all([solicitudes.init(), catalogo.init(), ajustes.init()])

    await repos.requests.create(solicitudAjena())
    await repos.cabins.update(DEFAULT_CABINS[0].id, { pricePerNight: 99000 })
    await repos.settings.save('contact_info', { ...DEFAULT_CONTACT, phone1: '+56 9 0000 1111' })

    const store = useActualizacionStore()
    expect(store.disponible).toBe(true)
    await store.refrescarTodo()

    expect(solicitudes.requests).toHaveLength(1)
    expect(catalogo.todasLasCabanas.find(c => c.id === DEFAULT_CABINS[0].id)?.pricePerNight).toBe(99000)
    expect(ajustes.contactInfo.phone1).toBe('+56 9 0000 1111')
    expect(store.ultimaVez).not.toBeNull()
    expect(store.error).toBeNull()
    expect(store.actualizando).toBe(false)
  })

  it('un visitante sin sesión no pide las solicitudes, pero sí el catálogo', async () => {
    const spy = vi.spyOn(repos.requests, 'list')
    await useActualizacionStore().refrescarTodo()
    expect(spy).not.toHaveBeenCalled()
    expect(useCatalogStore().todasLasCabanas.length).toBeGreaterThan(0)
  })

  it('con un mínimo de segundos no repite si se actualizó hace poco, pero a mano siempre actualiza', async () => {
    conSesionDeAdministrador()
    const spy = vi.spyOn(repos.requests, 'list')
    const store = useActualizacionStore()
    await store.refrescarTodo()
    expect(spy).toHaveBeenCalledTimes(1)
    await store.refrescarTodo({ minimoSegundos: SEGUNDOS_MINIMOS_AL_VOLVER })
    expect(spy).toHaveBeenCalledTimes(1)
    await store.refrescarTodo()
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('si falla, deja el motivo, conserva lo cargado y no marca la hora como actualizada', async () => {
    conSesionDeAdministrador()
    const solicitudes = useRequestsStore()
    await repos.requests.create(solicitudAjena())
    await solicitudes.init()
    repos.requests.list = async () => { throw new Error('sin red') }

    const store = useActualizacionStore()
    await store.refrescarTodo()
    expect(store.error).toBeTruthy()
    expect(store.ultimaVez).toBeNull()
    expect(solicitudes.requests).toHaveLength(1)
    expect(store.actualizando).toBe(false)
  })

  it('no empieza otra actualización mientras hay una en curso', async () => {
    conSesionDeAdministrador()
    let soltar!: () => void
    const compuerta = new Promise<void>(resolver => { soltar = resolver })
    const original = repos.requests.list.bind(repos.requests)
    const spy = vi.fn(async () => { await compuerta; return original() })
    repos.requests.list = spy
    const store = useActualizacionStore()
    const primera = store.refrescarTodo()
    await store.refrescarTodo()
    soltar()
    await primera
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('actualizacionStore: tiempo real', () => {
  beforeEach(() => {
    preparar()
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('sin sesión de administrador no escucha', () => {
    const store = useActualizacionStore()
    store.empezarTiempoReal()
    expect(avisar).toBeNull()
    expect(store.tiempoRealActivo).toBe(false)
  })

  it('con sesión escucha una sola vez, aunque se pida varias', () => {
    conSesionDeAdministrador()
    const escuchar = vi.spyOn(repos.requests, 'escucharCambios')
    const store = useActualizacionStore()
    store.empezarTiempoReal()
    store.empezarTiempoReal()
    expect(escuchar).toHaveBeenCalledTimes(1)
    expect(store.tiempoRealActivo).toBe(true)
  })

  it('una ráfaga de avisos se junta en una sola actualización de las solicitudes', async () => {
    conSesionDeAdministrador()
    const store = useActualizacionStore()
    const solicitudes = useRequestsStore()
    await solicitudes.init()
    store.empezarTiempoReal()
    const spy = vi.spyOn(repos.requests, 'list')

    await repos.requests.create(solicitudAjena())
    avisar!()
    avisar!()
    avisar!()
    await vi.advanceTimersByTimeAsync(ESPERA_DE_AVISOS_MS - 50)
    expect(spy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(100)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(solicitudes.requests).toHaveLength(1)
    expect(store.ultimaVez).not.toBeNull()
  })

  it('un fallo al actualizar por un aviso no rompe nada y queda anotado', async () => {
    conSesionDeAdministrador()
    const store = useActualizacionStore()
    store.empezarTiempoReal()
    repos.requests.list = async () => { throw new Error('sin red') }
    avisar!()
    await vi.advanceTimersByTimeAsync(ESPERA_DE_AVISOS_MS + 10)
    expect(store.error).toBeTruthy()
  })

  it('al detener deja de escuchar, cancela lo pendiente y permite volver a empezar', async () => {
    conSesionDeAdministrador()
    const store = useActualizacionStore()
    store.empezarTiempoReal()
    const spy = vi.spyOn(repos.requests, 'list')
    avisar!()
    store.detenerTiempoReal()
    expect(cancelarEscucha).toHaveBeenCalledTimes(1)
    expect(store.tiempoRealActivo).toBe(false)
    await vi.advanceTimersByTimeAsync(ESPERA_DE_AVISOS_MS + 10)
    expect(spy).not.toHaveBeenCalled()

    store.empezarTiempoReal()
    expect(store.tiempoRealActivo).toBe(true)
  })
})

describe('actualizacionStore: al volver a la app', () => {
  let documento: EventTarget & { visibilityState: string }
  let ventana: EventTarget

  beforeEach(() => {
    preparar()
    conSesionDeAdministrador()
    documento = Object.assign(new EventTarget(), { visibilityState: 'visible' })
    ventana = new EventTarget()
    vi.stubGlobal('document', documento)
    vi.stubGlobal('window', ventana)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('al volver a la pestaña actualiza, pero no si ya se actualizó hace poco ni si sigue oculta', async () => {
    const store = useActualizacionStore()
    store.iniciar()
    const spy = vi.spyOn(repos.requests, 'list')

    documento.visibilityState = 'hidden'
    documento.dispatchEvent(new Event('visibilitychange'))
    expect(spy).not.toHaveBeenCalled()

    documento.visibilityState = 'visible'
    documento.dispatchEvent(new Event('visibilitychange'))
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1))

    // Vuelve enseguida otra vez: no repite
    documento.dispatchEvent(new Event('visibilitychange'))
    await new Promise(resolver => setTimeout(resolver, 10))
    expect(spy).toHaveBeenCalledTimes(1)
    store.detener()
  })

  it('al recuperar internet actualiza aunque se haya actualizado hace poco', async () => {
    const store = useActualizacionStore()
    store.iniciar()
    await store.refrescarTodo()
    const spy = vi.spyOn(repos.requests, 'list')
    ventana.dispatchEvent(new Event('online'))
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
    store.detener()
  })

  it('una página restaurada de la memoria del navegador (iPhone) también actualiza', async () => {
    const store = useActualizacionStore()
    store.iniciar()
    const spy = vi.spyOn(repos.requests, 'list')
    const evento = Object.assign(new Event('pageshow'), { persisted: true })
    ventana.dispatchEvent(evento)
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1))
    store.detener()
  })

  it('iniciar dos veces no duplica los oyentes, y detener los quita', async () => {
    const store = useActualizacionStore()
    store.iniciar()
    store.iniciar()
    const spy = vi.spyOn(repos.requests, 'list')
    documento.dispatchEvent(new Event('visibilitychange'))
    await vi.waitFor(() => expect(spy).toHaveBeenCalledTimes(1))

    store.detener()
    documento.dispatchEvent(new Event('visibilitychange'))
    ventana.dispatchEvent(new Event('online'))
    await new Promise(resolver => setTimeout(resolver, 10))
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
