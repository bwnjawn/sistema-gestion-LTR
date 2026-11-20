import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales, usarRepositorios, type Repositorios } from '../src/lib/repositories'
import { conCacheSinConexion } from '../src/lib/repositories/conCacheSinConexion'
import { traducirError } from '../src/lib/repositories/supabase/errores'
import { leerSinConexion, olvidarDatosDelAdministrador, reiniciarAlmacenSinConexion } from '../src/lib/almacenSinConexion'
import { ErrorDeAlmacenamiento, esErrorDeRed } from '../src/lib/errores'
import { marcarServidorActivo, servidorInalcanzable } from '../src/lib/estadoDeRed'
import { descartarAviso } from '../src/lib/avisos'
import {
  aplicarCambios,
  aplicarResultadoDeCambio,
  clasificarFalloDeCambio,
  crearCambioEnCola,
  idsSinSincronizar,
  type CambioEnCola
} from '../src/services/cambiosAdmin'
import { useRequestsStore } from '../src/stores/requestsStore'
import { useCambiosAdminStore } from '../src/stores/cambiosAdminStore'
import { useAuthStore } from '../src/stores/authStore'
import { bookingToRequest, requestToBooking } from '../src/services/adaptadoresReserva'
import type { Payment, ReservationRequest } from '../src/types/domain'

const errorDeRed = () => new ErrorDeAlmacenamiento('red', 'No hay conexión con el servidor.')

const reserva = (id = 'r1', extra: Partial<ReservationRequest> = {}): ReservationRequest => ({
  id,
  requestCode: 'ADM-1',
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
  details: { startDate: '2027-03-10', selectedMealTypes: ['almuerzo'], origin: 'admin' },
  ...extra
})

const pago = (id = 'p1'): Payment => ({ id, amount: 5000, method: 'transferencia', paidOn: '2027-01-02' })

const cambio = (c: Parameters<typeof crearCambioEnCola>[0], id = 'c' + Math.random()): CambioEnCola => crearCambioEnCola(c, 'x', id)

beforeEach(() => {
  reiniciarAlmacenSinConexion()
  marcarServidorActivo()
})

describe('reglas de los cambios del administrador', () => {
  it('lo pendiente se ve encima de lo del servidor: nueva, reemplazo y pagos', () => {
    const servidor = [reserva('r1'), reserva('r2')]
    const cola = [
      cambio({ tipo: 'guardar', solicitud: reserva('r3'), esNueva: true }),
      cambio({ tipo: 'guardar', solicitud: reserva('r1', { status: 'confirmed' }), esNueva: false }),
      cambio({ tipo: 'pago-agregar', solicitudId: 'r2', pago: pago('p1') }),
      cambio({ tipo: 'pago-agregar', solicitudId: 'r2', pago: pago('p2') }),
      cambio({ tipo: 'pago-quitar', solicitudId: 'r2', pagoId: 'p1' })
    ]
    const vista = aplicarCambios(servidor, cola)
    expect(vista.map(r => r.id)).toEqual(['r3', 'r1', 'r2'])
    expect(vista.find(r => r.id === 'r1')?.status).toBe('confirmed')
    expect(vista.find(r => r.id === 'r2')?.payments.map(p => p.id)).toEqual(['p2'])
  })

  it('un cambio rechazado no se aplica en pantalla', () => {
    const rechazado = { ...cambio({ tipo: 'guardar', solicitud: reserva('r1', { status: 'confirmed' }), esNueva: false }), estado: 'rechazado' as const }
    expect(aplicarCambios([reserva('r1')], [rechazado])[0].status).toBe('pending')
  })

  it('la lista de "sin sincronizar" cuenta solo lo pendiente', () => {
    const cola = [
      cambio({ tipo: 'pago-agregar', solicitudId: 'r2', pago: pago() }),
      { ...cambio({ tipo: 'guardar', solicitud: reserva('r1'), esNueva: false }), estado: 'rechazado' as const }
    ]
    expect([...idsSinSincronizar(cola)]).toEqual(['r2'])
  })

  it('un choque al confirmar es conflicto; al guardar otra cosa es rechazo; sin red espera', () => {
    const confirmar = { tipo: 'guardar' as const, solicitud: reserva('r1', { status: 'confirmed' }), esNueva: false }
    const conflicto = new ErrorDeAlmacenamiento('conflicto', 'Ya hay una reserva confirmada.')
    expect(clasificarFalloDeCambio(confirmar, conflicto)).toEqual({ tipo: 'conflicto' })
    expect(clasificarFalloDeCambio({ ...confirmar, solicitud: reserva('r1') }, conflicto).tipo).toBe('rechazado')
    expect(clasificarFalloDeCambio(confirmar, new ErrorDeAlmacenamiento('desconocida', 'No tienes permiso')))
      .toEqual({ tipo: 'rechazado', motivo: 'No tienes permiso' })
    expect(clasificarFalloDeCambio(confirmar, errorDeRed())).toEqual({ tipo: 'sin-red' })
  })

  it('un conflicto deja el cambio como pendiente y en conflicto', () => {
    const cola = [cambio({ tipo: 'guardar', solicitud: reserva('r1', { status: 'confirmed' }), esNueva: false }, 'c1')]
    const nueva = aplicarResultadoDeCambio(cola, 'c1', { tipo: 'conflicto' })
    const c = nueva[0].cambio
    expect(c.tipo === 'guardar' && c.solicitud.status).toBe('pending')
    expect(c.tipo === 'guardar' && c.solicitud.enConflicto).toBe(true)
  })

  it('los errores del servidor se traducen: choque = conflicto, permisos = desconocida', () => {
    expect(traducirError({ code: '23P01', message: 'conflicting key' }, 'x').causa).toBe('conflicto')
    expect(traducirError({ message: 'aforo_excedido: no caben más personas' }, 'x').causa).toBe('conflicto')
    expect(traducirError({ message: 'sin_cupo: ya no quedan cupos' }, 'x').causa).toBe('conflicto')
    expect(traducirError({ message: 'dato_invalido: falta el nombre' }, 'x').causa).toBe('desconocida')
    // "Espera un momento" es temporal: se reintenta, no se rechaza
    const limite = traducirError({ message: 'demasiadas_solicitudes: espera un momento antes de enviar otra solicitud' }, 'x')
    expect(limite.causa).toBe('temporal')
    expect(esErrorDeRed(limite)).toBe(true)
    expect(esErrorDeRed(new TypeError('x is not a function'))).toBe(false)
    expect(esErrorDeRed(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('la marca "en conflicto" viaja a la base y vuelve', () => {
    const r = reserva('r1', { enConflicto: true })
    expect(requestToBooking(r).inConflict).toBe(true)
    expect(requestToBooking(reserva('r2')).inConflict).toBe(false)
    expect(bookingToRequest(requestToBooking(r)).enConflicto).toBe(true)
  })
})

describe('caché de las solicitudes del administrador', () => {
  it('sin señal se usa la última lista y se borra al cerrar sesión', async () => {
    const base = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    await base.requests.create(reserva('r1'))
    const envuelto = conCacheSinConexion(base)
    expect(await envuelto.requests.list()).toHaveLength(1)
    await new Promise(r => setTimeout(r, 20))
    expect(await leerSinConexion('solicitudes')).toBeTruthy()

    base.requests.list = async () => { throw errorDeRed() }
    expect(await envuelto.requests.list()).toHaveLength(1)
    expect(servidorInalcanzable.value).toBe(true)

    await olvidarDatosDelAdministrador()
    await expect(envuelto.requests.list()).rejects.toThrow()
  })
})

describe('el administrador trabaja sin señal', () => {
  let repos: Repositorios
  let hayRed: boolean
  let guardados: ReservationRequest[]
  let pagosEnviados: string[]
  let rechazo: Error | null

  beforeEach(() => {
    descartarAviso()
    const base = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    hayRed = false
    guardados = []
    pagosEnviados = []
    rechazo = null
    const sinRed = () => { if (!hayRed) throw errorDeRed() }
    repos = {
      ...base,
      requests: Object.assign(Object.create(base.requests), {
        create: async (r: ReservationRequest) => { sinRed(); if (rechazo) throw rechazo; guardados.push(r); return r },
        update: async (_id: string, r: ReservationRequest) => { sinRed(); if (rechazo) throw rechazo; guardados.push(r); return r },
        list: async () => guardados.length ? [...guardados].reverse() : []
      }),
      payments: {
        listByRequest: async () => [],
        add: async (_id: string, p: Payment) => { sinRed(); pagosEnviados.push(p.id); return p },
        remove: async () => { sinRed() }
      }
    }
    usarRepositorios(repos)
    setActivePinia(createPinia())
  })

  async function conUnaReserva() {
    hayRed = true
    const store = useRequestsStore()
    const creada = await store.addRequest(reserva('r1'))
    hayRed = false
    return { store, creada, id: creada.id }
  }

  it('crear una reserva sin señal la deja en pantalla, "sin sincronizar" y guardada en el dispositivo', async () => {
    const store = useRequestsStore()
    const cambios = useCambiosAdminStore()
    const creada = await store.addRequest(reserva('nueva'))
    expect(store.requests.map(r => r.id)).toEqual([creada.id])
    expect(cambios.estaSinSincronizar(creada.id)).toBe(true)
    expect(await repos.colaCambios.listar()).toHaveLength(1)
    cambios.detener()
  })

  it('confirmar sin señal se ve confirmada y se envía al volver la señal, sin duplicar', async () => {
    const { store, id } = await conUnaReserva()
    const cambios = useCambiosAdminStore()
    expect(await store.confirmRequest(id)).toBe(true)
    expect(store.requests[0].status).toBe('confirmed')
    expect(cambios.pendientes).toHaveLength(1)

    hayRed = true
    const { enviados } = await cambios.sincronizar()
    expect(enviados).toBe(1)
    expect(guardados.at(-1)?.status).toBe('confirmed')
    expect(cambios.entradas).toHaveLength(0)
    expect(servidorInalcanzable.value).toBe(false)
    cambios.detener()
  })

  it('un pago sin señal se ve en pantalla y se envía después', async () => {
    const { store, id } = await conUnaReserva()
    const cambios = useCambiosAdminStore()
    const r = await store.registerPayment(id, { amount: 5000, method: 'transferencia' })
    expect(r.ok).toBe(true)
    expect(store.requests[0].payments).toHaveLength(1)
    hayRed = true
    await cambios.sincronizar()
    expect(pagosEnviados).toHaveLength(1)
    expect(cambios.entradas).toHaveLength(0)
    cambios.detener()
  })

  it('los cambios se envían en el orden en que se hicieron y se detienen si vuelve a faltar la señal', async () => {
    const store = useRequestsStore()
    const cambios = useCambiosAdminStore()
    const { id } = { id: (await store.addRequest(reserva('r1'))).id }
    await store.registerPayment(id, { amount: 5000, method: 'transferencia' })
    expect(cambios.pendientes.map(c => c.cambio.tipo)).toEqual(['guardar', 'pago-agregar'])
    await cambios.sincronizar() // sigue sin señal
    expect(cambios.pendientes).toHaveLength(2)
    hayRed = true
    await cambios.sincronizar()
    expect(cambios.entradas).toHaveLength(0)
    expect(guardados).toHaveLength(1)
    expect(pagosEnviados).toHaveLength(1)
    cambios.detener()
  })

  it('una confirmación que choca al sincronizar queda pendiente y "en conflicto", sin perderse', async () => {
    const { store, id } = await conUnaReserva()
    const cambios = useCambiosAdminStore()
    await store.confirmRequest(id)
    hayRed = true
    // El servidor rechaza confirmar (choque) pero acepta guardarla como pendiente
    const original = repos.requests.update
    repos.requests.update = async (id, r) => {
      if ((r as ReservationRequest).status === 'confirmed') throw new ErrorDeAlmacenamiento('conflicto', 'Ya hay una reserva confirmada en esas fechas o cupos.')
      return original.call(repos.requests, id, r)
    }
    await cambios.sincronizar()
    expect(cambios.entradas).toHaveLength(0)
    expect(cambios.conflictosNuevos).toBe(1)
    const guardada = guardados.at(-1)!
    expect(guardada.status).toBe('pending')
    expect(guardada.enConflicto).toBe(true)
    cambios.detener()
  })

  it('un cambio que el servidor rechaza queda con el motivo y se puede descartar', async () => {
    const { store, id } = await conUnaReserva()
    const cambios = useCambiosAdminStore()
    await store.updateRequestStatus(id, 'rejected')
    hayRed = true
    rechazo = new ErrorDeAlmacenamiento('desconocida', 'No tienes permiso para hacer esto.')
    await cambios.sincronizar()
    expect(cambios.rechazados).toHaveLength(1)
    expect(cambios.rechazados[0].motivo).toBe('No tienes permiso para hacer esto.')
    const idCambio = cambios.rechazados[0].id
    await cambios.descartar(idCambio)
    expect(cambios.entradas).toHaveLength(0)
    cambios.detener()
  })

  it('actuar sobre una reserva en conflicto quita la marca', async () => {
    hayRed = true
    const store = useRequestsStore()
    const { id } = await store.addRequest(reserva('r1', { enConflicto: true }))
    expect(store.requests[0].enConflicto).toBe(true)
    await store.updateRequestStatus(id, 'rejected')
    expect(store.requests[0].enConflicto).toBeUndefined()
  })

  it('la cola guardada se recupera al abrir la app y se ve sobre las solicitudes', async () => {
    const { store, id } = await conUnaReserva()
    await store.confirmRequest(id)
    setActivePinia(createPinia())
    const cambios = useCambiosAdminStore()
    await cambios.init()
    const nuevo = useRequestsStore()
    await nuevo.init()
    expect(nuevo.requests.find(r => r.id === id)?.status).toBe('confirmed')
    cambios.detener()
  })

  it('con cambios sin sincronizar no se cierra la sesión', async () => {
    const { store, id } = await conUnaReserva()
    await store.confirmRequest(id)
    const auth = useAuthStore()
    expect(await auth.logout()).toBe(false)
    useCambiosAdminStore().detener()
  })

  it('un error de regla (no de red) no se encola: se avisa y la pantalla vuelve atrás', async () => {
    const { store, id } = await conUnaReserva()
    hayRed = true
    rechazo = new ErrorDeAlmacenamiento('desconocida', 'No tienes permiso para hacer esto.')
    expect(await store.updateRequestStatus(id, 'rejected')).toBe(false)
    expect(store.requests[0].status).toBe('pending')
    expect(useCambiosAdminStore().entradas).toHaveLength(0)
  })
})
