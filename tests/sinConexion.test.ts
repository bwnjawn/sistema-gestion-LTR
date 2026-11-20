import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales, usarRepositorios, type Repositorios } from '../src/lib/repositories'
import { conCacheSinConexion } from '../src/lib/repositories/conCacheSinConexion'
import { traducirError } from '../src/lib/repositories/supabase/errores'
import { borrarSinConexion, guardarSinConexion, leerSinConexion, reiniciarAlmacenSinConexion } from '../src/lib/almacenSinConexion'
import { ErrorDeAlmacenamiento, esErrorDeRed } from '../src/lib/errores'
import { conTiempoLimite } from '../src/lib/conTiempoLimite'
import { marcarServidorActivo, servidorInalcanzable } from '../src/lib/estadoDeRed'
import { descartarAviso } from '../src/lib/avisos'
import {
  agregarACola,
  aplicarResultado,
  clasificarFalloDeEnvio,
  crearEntradaDeCola,
  pendientesDeEnvio,
  rechazadasEnCola
} from '../src/services/colaEnvio'
import { useRequestsStore } from '../src/stores/requestsStore'
import { useColaEnvioStore } from '../src/stores/colaEnvioStore'
import { useSettingsStore } from '../src/stores/settingsStore'
import { DEFAULT_CABINS } from '../src/data/seed'
import { DEFAULT_CONTACT } from '../src/data/ajustesPorDefecto'
import type { ReservationRequest } from '../src/types/domain'

const errorDeRed = () => new ErrorDeAlmacenamiento('red', 'No hay conexión con el servidor.')

const solicitud = (id = 'sol-1'): ReservationRequest => ({
  id,
  requestCode: 'SOL-100',
  clientName: 'Ana',
  clientPhone: '+56 9 1234 5678',
  type: 'restaurante',
  resourceName: 'Restaurante',
  date: '2027-03-10',
  guestsCount: 4,
  totalAmount: 40000,
  depositRequired: 12000,
  payments: [],
  status: 'pending',
  createdAt: '2027-01-01T10:00:00.000Z',
  details: { startDate: '2027-03-10', selectedMealTypes: ['almuerzo'] }
})

beforeEach(() => {
  reiniciarAlmacenSinConexion()
  marcarServidorActivo()
})

describe('almacén sin conexión', () => {
  it('guarda y lee un valor (sin IndexedDB usa la memoria)', async () => {
    await guardarSinConexion('a', { x: 1, lista: [1, 2] })
    expect(await leerSinConexion('a')).toEqual({ x: 1, lista: [1, 2] })
  })

  it('lo que no existe es undefined y borrar lo quita', async () => {
    expect(await leerSinConexion('nada')).toBeUndefined()
    await guardarSinConexion('b', 5)
    await borrarSinConexion('b')
    expect(await leerSinConexion('b')).toBeUndefined()
  })
})

describe('errores de red', () => {
  it('un fallo de fetch se traduce a causa "red"', () => {
    const e = traducirError({ message: 'TypeError: Failed to fetch' }, 'x')
    expect(e.causa).toBe('red')
    expect(esErrorDeRed(e)).toBe(true)
  })

  it('una regla del negocio o un permiso no son de red', () => {
    expect(esErrorDeRed(traducirError({ message: 'sin_cupo: no quedan cupos' }, 'x'))).toBe(false)
    expect(esErrorDeRed(traducirError({ code: '42501', message: 'permission denied' }, 'x'))).toBe(false)
  })

  it('una operación que no responde se corta como error de red', async () => {
    vi.useFakeTimers()
    const colgada = conTiempoLimite(new Promise(() => {}), 1000)
    const resultado = expect(colgada).rejects.toSatisfy(esErrorDeRed)
    await vi.advanceTimersByTimeAsync(1001)
    await resultado
    vi.useRealTimers()
  })
})

describe('caché de lectura sin conexión', () => {
  function repos(mem = crearAlmacenamientoEnMemoria()): Repositorios {
    return crearRepositoriosLocales(mem)
  }

  it('si la lectura funciona guarda la copia y si luego falla por red devuelve la copia', async () => {
    const base = repos()
    const envuelto = conCacheSinConexion(base)
    const cabanas = await envuelto.cabins.list()
    expect(cabanas.length).toBe(DEFAULT_CABINS.length)
    await vi.waitFor(async () => expect(await leerSinConexion('catalogo:cabanas')).toBeTruthy())

    base.cabins.list = async () => { throw errorDeRed() }
    const sinRed = await envuelto.cabins.list()
    expect(sinRed.map(c => c.id)).toEqual(cabanas.map(c => c.id))
    expect(servidorInalcanzable.value).toBe(true)
  })

  it('sin copia y sin red el error sube', async () => {
    const base = repos()
    base.dishes.list = async () => { throw errorDeRed() }
    await expect(conCacheSinConexion(base).dishes.list()).rejects.toSatisfy(esErrorDeRed)
  })

  it('un error que no es de red no se disfraza con la copia', async () => {
    const base = repos()
    const envuelto = conCacheSinConexion(base)
    await envuelto.cabins.list()
    await vi.waitFor(async () => expect(await leerSinConexion('catalogo:cabanas')).toBeTruthy())
    base.cabins.list = async () => { throw new ErrorDeAlmacenamiento('desconocida', 'No tienes permiso') }
    await expect(envuelto.cabins.list()).rejects.toThrow('No tienes permiso')
    expect(servidorInalcanzable.value).toBe(false)
  })

  it('los ajustes caen a la copia por clave', async () => {
    const base = repos()
    const envuelto = conCacheSinConexion(base)
    const contacto = { ...DEFAULT_CONTACT, phone1: '+56 9 0000 0000' }
    await base.settings.save('contact_info', contacto)
    await envuelto.settings.get('contact_info', DEFAULT_CONTACT)
    await vi.waitFor(async () => expect(await leerSinConexion('ajustes:contact_info')).toBeTruthy())
    base.settings.get = async () => { throw errorDeRed() }
    expect((await envuelto.settings.get('contact_info', DEFAULT_CONTACT)).phone1).toBe('+56 9 0000 0000')
  })
})

describe('reglas de la cola de envío', () => {
  it('solo el error de red deja la solicitud en espera; lo demás la rechaza con el motivo', () => {
    expect(clasificarFalloDeEnvio(errorDeRed())).toEqual({ tipo: 'sin-red' })
    expect(clasificarFalloDeEnvio(new ErrorDeAlmacenamiento('desconocida', 'No quedan cupos.')))
      .toEqual({ tipo: 'rechazada', motivo: 'No quedan cupos.' })
  })

  it('el mismo id no se agrega dos veces', () => {
    const e = crearEntradaDeCola(solicitud())
    expect(agregarACola(agregarACola([], e), e)).toHaveLength(1)
  })

  it('enviada sale de la cola; sin red suma un intento; rechazada queda con el motivo', () => {
    const cola = [crearEntradaDeCola(solicitud('a')), crearEntradaDeCola(solicitud('b')), crearEntradaDeCola(solicitud('c'))]
    let nueva = aplicarResultado(cola, 'a', { tipo: 'enviada' })
    nueva = aplicarResultado(nueva, 'b', { tipo: 'sin-red' })
    nueva = aplicarResultado(nueva, 'c', { tipo: 'rechazada', motivo: 'fecha_no_disponible' })
    expect(nueva.map(e => e.id)).toEqual(['b', 'c'])
    expect(nueva[0].intentos).toBe(1)
    expect(pendientesDeEnvio(nueva).map(e => e.id)).toEqual(['b'])
    expect(rechazadasEnCola(nueva)[0].motivo).toBe('fecha_no_disponible')
  })
})

describe('envío del cliente sin señal', () => {
  let repos: Repositorios
  let intentos: ReservationRequest[]
  let hayRed: boolean
  let rechazo: Error | null

  beforeEach(() => {
    descartarAviso()
    const base = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    intentos = []
    hayRed = false
    rechazo = null
    repos = {
      ...base,
      requests: Object.assign(Object.create(base.requests), {
        create: async (req: ReservationRequest) => {
          intentos.push(req)
          if (!hayRed) throw errorDeRed()
          if (rechazo) throw rechazo
          return { ...req, requestCode: 'SOL-0001' }
        }
      })
    }
    usarRepositorios(repos)
    setActivePinia(createPinia())
  })

  it('sin señal la solicitud del cliente queda en la cola, no en el panel, y no se pierde', async () => {
    const store = useRequestsStore()
    const cola = useColaEnvioStore()
    const { requestCode: _c, ...borrador } = solicitud()
    const creada = await store.addRequest({ ...borrador, requestCode: 'SOL-100' })
    expect(cola.estaEnCola(creada.id)).toBe(true)
    expect(cola.pendientes).toHaveLength(1)
    expect(store.requests).toHaveLength(0)
    expect(await repos.colaEnvio.listar()).toHaveLength(1)
    cola.detener()
  })

  it('al volver la señal se envía con el mismo id y sale de la cola', async () => {
    const store = useRequestsStore()
    const cola = useColaEnvioStore()
    const creada = await store.addRequest(solicitud())
    hayRed = true
    const { enviadas } = await cola.sincronizar()
    expect(enviadas).toBe(1)
    expect(intentos.at(-1)?.id).toBe(creada.id)
    expect(cola.entradas).toHaveLength(0)
    expect(await repos.colaEnvio.listar()).toHaveLength(0)
    expect(servidorInalcanzable.value).toBe(false)
    cola.detener()
  })

  it('si sigue sin señal se queda pendiente y suma un intento', async () => {
    const store = useRequestsStore()
    const cola = useColaEnvioStore()
    await store.addRequest(solicitud())
    await cola.sincronizar()
    expect(cola.pendientes).toHaveLength(1)
    expect(cola.pendientes[0].intentos).toBe(1)
    expect(servidorInalcanzable.value).toBe(true)
    cola.detener()
  })

  it('si el servidor la rechaza queda marcada con el motivo y el cliente puede descartarla', async () => {
    const store = useRequestsStore()
    const cola = useColaEnvioStore()
    const creada = await store.addRequest(solicitud())
    hayRed = true
    rechazo = new ErrorDeAlmacenamiento('desconocida', 'Ya no quedan cupos para ese día.')
    await cola.sincronizar()
    expect(cola.rechazadas).toHaveLength(1)
    expect(cola.rechazadas[0].motivo).toBe('Ya no quedan cupos para ese día.')
    expect(cola.pendientes).toHaveLength(0)
    await cola.descartar(creada.id)
    expect(cola.entradas).toHaveLength(0)
    cola.detener()
  })

  it('la cola guardada se recupera al abrir la app', async () => {
    const store = useRequestsStore()
    await store.addRequest(solicitud())
    setActivePinia(createPinia())
    const nueva = useColaEnvioStore()
    await nueva.init()
    expect(nueva.pendientes).toHaveLength(1)
    nueva.detener()
  })

  it('una solicitud del administrador sin señal no se encola: falla con el aviso de siempre', async () => {
    const store = useRequestsStore()
    await expect(store.addRequest({ ...solicitud(), requestCode: 'ADM-1' })).rejects.toThrow()
    expect(useColaEnvioStore().entradas).toHaveLength(0)
    expect(store.requests).toHaveLength(0)
  })

  it('un error de regla del servidor no se encola: la solicitud falla y el cliente ve el motivo', async () => {
    hayRed = true
    rechazo = new ErrorDeAlmacenamiento('desconocida', 'Ya no quedan cupos para ese día.')
    const store = useRequestsStore()
    await expect(store.addRequest(solicitud())).rejects.toThrow('Ya no quedan cupos')
    expect(useColaEnvioStore().entradas).toHaveLength(0)
  })

  it('el aviso de conexión sale del servidor, no solo del navegador', () => {
    const settings = useSettingsStore()
    expect(settings.isConnected).toBe(true)
    servidorInalcanzable.value = true
    expect(settings.isConnected).toBe(false)
    marcarServidorActivo()
    expect(settings.isConnected).toBe(true)
  })
})
