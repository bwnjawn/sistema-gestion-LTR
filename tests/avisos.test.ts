import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales, usarRepositorios, type Repositorios } from '../src/lib/repositories'
import {
  aviso,
  avisarError,
  avisarExito,
  avisarGuardadoSinConexion,
  avisoDeError,
  descartarAviso,
  DURACION_AVISO_MS,
  TITULO_AVISO_COLA
} from '../src/lib/avisos'
import { persistirConReversion } from '../src/lib/persistirConReversion'
import { ErrorDeAlmacenamiento } from '../src/lib/errores'
import { marcarServidorActivo } from '../src/lib/estadoDeRed'
import {
  AVISOS_DE_AJUSTES,
  avisoAcompanamiento,
  avisoCatalogoAgregado,
  avisoCatalogoCambiado,
  avisoDeEdicion,
  avisoDeEstado,
  avisoDePago,
  avisoSincronizacion,
  textoGuardadoSinConexion
} from '../src/services/mensajesAvisos'
import { useRequestsStore } from '../src/stores/requestsStore'
import { useCambiosAdminStore } from '../src/stores/cambiosAdminStore'
import { useCatalogStore } from '../src/stores/catalogStore'
import { useSettingsStore } from '../src/stores/settingsStore'
import type { ReservationRequest } from '../src/types/domain'

const reserva = (extra: Partial<ReservationRequest> = {}): Omit<ReservationRequest, 'id' | 'status' | 'createdAt'> => ({
  requestCode: 'SOL-1',
  clientName: 'Ana Pérez',
  clientPhone: '+56 9 1234 5678',
  type: 'restaurante',
  resourceName: 'Restaurante',
  date: '2099-03-10',
  guestsCount: 4,
  totalAmount: 40000,
  depositRequired: 12000,
  payments: [],
  details: { startDate: '2099-03-10', selectedMealTypes: ['almuerzo'], origin: 'admin' },
  ...extra
})

describe('el aviso de arriba (SCRUM-288)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    descartarAviso()
  })
  afterEach(() => {
    descartarAviso()
    vi.useRealTimers()
  })

  it('el verde y el azul se van solos a los 4 segundos', () => {
    expect(DURACION_AVISO_MS).toBe(4000)
    avisarExito('Solicitud aprobada', 'Ana Pérez')
    expect(aviso.value).toMatchObject({ tipo: 'exito', titulo: 'Solicitud aprobada', detalle: 'Ana Pérez' })
    vi.advanceTimersByTime(3900)
    expect(aviso.value).not.toBeNull()
    vi.advanceTimersByTime(200)
    expect(aviso.value).toBeNull()

    avisarGuardadoSinConexion('Aprobar la solicitud de Ana. Se enviará cuando vuelva la señal.')
    expect(aviso.value).toMatchObject({ tipo: 'cola', titulo: TITULO_AVISO_COLA })
    vi.advanceTimersByTime(4100)
    expect(aviso.value).toBeNull()
  })

  it('el rojo se queda hasta que se cierra', () => {
    avisarError('No hay conexión con el servidor.')
    expect(avisoDeError.value).toBe('No hay conexión con el servidor.')
    vi.advanceTimersByTime(60000)
    expect(aviso.value?.tipo).toBe('error')
    descartarAviso()
    expect(aviso.value).toBeNull()
    expect(avisoDeError.value).toBeNull()
  })

  it('hay un solo aviso: el nuevo reemplaza al anterior y reinicia el tiempo', () => {
    avisarExito('Primero')
    const primero = aviso.value!.id
    vi.advanceTimersByTime(3000)
    avisarExito('Segundo')
    expect(aviso.value!.titulo).toBe('Segundo')
    expect(aviso.value!.id).not.toBe(primero)
    // El reloj del primero no apaga al segundo
    vi.advanceTimersByTime(2000)
    expect(aviso.value?.titulo).toBe('Segundo')
    vi.advanceTimersByTime(2100)
    expect(aviso.value).toBeNull()
  })

  it('persistirConReversion avisa verde si se guardó y rojo (sin verde) si falló', async () => {
    let valor = 0
    await persistirConReversion({
      aplicar: () => { valor = 1 },
      revertir: () => { valor = 0 },
      persistir: async () => 'ok',
      mensaje: 'No se pudo.',
      exito: { titulo: 'Guardado', detalle: 'Ana' }
    })
    expect(valor).toBe(1)
    expect(aviso.value).toMatchObject({ tipo: 'exito', titulo: 'Guardado' })

    descartarAviso()
    await expect(persistirConReversion({
      aplicar: () => { valor = 2 },
      revertir: () => { valor = 1 },
      persistir: async () => { throw new ErrorDeAlmacenamiento('desconocida', 'Sin permiso.') },
      mensaje: 'No se pudo.',
      exito: { titulo: 'Guardado' }
    })).rejects.toThrow('Sin permiso.')
    expect(valor).toBe(1)
    expect(aviso.value).toMatchObject({ tipo: 'error', detalle: 'Sin permiso.' })
  })

  it('el aviso verde puede cancelarse con una función que devuelve null', async () => {
    await persistirConReversion({ aplicar: () => {}, revertir: () => {}, persistir: async () => 1, mensaje: 'x', exito: () => null })
    expect(aviso.value).toBeNull()
  })
})

describe('textos de los avisos', () => {
  const ana = { ...reserva(), id: 'r1', status: 'pending', createdAt: '2099-01-01' } as ReservationRequest

  it('aprobar, rechazar y cancelar dicen qué pasó y a quién', () => {
    expect(avisoDeEstado('pending', 'confirmed', ana)).toMatchObject({ titulo: 'Solicitud aprobada', detalle: 'Ana Pérez · Restaurante' })
    expect(avisoDeEstado('pending', 'rejected', ana).titulo).toBe('Solicitud rechazada')
    expect(avisoDeEstado('confirmed', 'cancelled', ana)).toMatchObject({ titulo: 'Reserva cancelada' })
    expect(avisoDeEstado('confirmed', 'cancelled', ana).detalle).toContain('fechas quedaron libres')
    expect(avisoDeEstado('pending', 'cancelled', ana).titulo).toBe('Solicitud cancelada')
  })

  it('el tono sigue los colores de las insignias: verde, gris (descartado) y ámbar (atención)', () => {
    // Verde: aprobar, guardar, agregar, activar, "disponible"
    for (const a of [
      avisoDeEstado('pending', 'confirmed', ana),
      avisoCatalogoAgregado('cabana', 'C9'),
      avisoCatalogoCambiado('cabana', 'C6', { isActive: true }),
      avisoCatalogoCambiado('cabana', 'C6', { enMantencion: false }),
      avisoCatalogoCambiado('cabana', 'C6', { name: 'Otra' } as never),
      avisoAcompanamiento('agregado', 'Papas'),
      AVISOS_DE_AJUSTES.contacto,
      AVISOS_DE_AJUSTES.fotoRestaurada,
      avisoSincronizacion(2, 0)
    ]) expect(a.tono ?? 'exito').toBe('exito')
    // Gris: rechazar, cancelar, quitar, dar de baja, mantención
    for (const a of [
      avisoDeEstado('pending', 'rejected', ana),
      avisoDeEstado('confirmed', 'cancelled', ana),
      avisoDeEstado('pending', 'cancelled', ana),
      avisoDePago('quitado', ana, 5000),
      avisoCatalogoCambiado('cabana', 'C6', { isActive: false }),
      avisoCatalogoCambiado('plato', 'Asado', { isActive: false }),
      avisoCatalogoCambiado('cabana', 'C6', { enMantencion: true }),
      avisoAcompanamiento('quitado', 'Papas'),
      AVISOS_DE_AJUSTES.reglamentoQuitado
    ]) expect(a.tono).toBe('descartado')
    // Registrar un pago es positivo
    expect(avisoDePago('registrado', ana, 5000).tono ?? 'exito').toBe('exito')
    // Ámbar: lo sincronizado dejó una reserva en conflicto, que pide revisar
    expect(avisoSincronizacion(2, 1).tono).toBe('atencion')
  })

  it('el aviso de un tono distinto sigue el mismo reloj de 4 segundos', () => {
    vi.useFakeTimers()
    avisarExito('Solicitud rechazada', 'Ana', 'descartado')
    expect(aviso.value?.tipo).toBe('descartado')
    vi.advanceTimersByTime(4100)
    expect(aviso.value).toBeNull()
    avisarExito('Cambios sincronizados', '1 reserva quedó en conflicto', 'atencion')
    expect(aviso.value?.tipo).toBe('atencion')
    vi.advanceTimersByTime(4100)
    expect(aviso.value).toBeNull()
    vi.useRealTimers()
  })

  it('sin conexión dice qué falta enviar, nunca "listo"', () => {
    const texto = textoGuardadoSinConexion(avisoDeEstado('pending', 'confirmed', ana))
    expect(texto).toBe('Aprobar la solicitud de Ana Pérez. Se enviará cuando vuelva la señal.')
    expect(texto.toLowerCase()).not.toContain('listo')
  })

  it('si solo cambian las fechas se llama "Fecha movida"; si cambia otra cosa, "Cambios guardados"', () => {
    const movida = { ...ana, details: { ...ana.details, startDate: '2099-03-12' }, date: '2099-03-12' }
    expect(avisoDeEdicion(ana, movida).titulo).toBe('Fecha movida')
    expect(avisoDeEdicion(ana, { ...movida, guestsCount: 9 }).titulo).toBe('Cambios guardados')
    expect(avisoDeEdicion(ana, { ...ana, clientName: 'Ana P.' }).titulo).toBe('Cambios guardados')
  })

  it('el catálogo respeta el género y distingue baja, activar y mantención', () => {
    expect(avisoCatalogoAgregado('cabana', 'Cabaña 9').titulo).toBe('Cabaña agregada')
    expect(avisoCatalogoAgregado('plato', 'Asado').titulo).toBe('Plato agregado')
    expect(avisoCatalogoAgregado('camping', 'Zona').titulo).toBe('Espacio de camping agregado')
    expect(avisoCatalogoCambiado('cabana', 'C6', { isActive: false }).titulo).toBe('Cabaña dada de baja')
    expect(avisoCatalogoCambiado('plato', 'Asado', { isActive: false }).titulo).toBe('Plato dado de baja')
    expect(avisoCatalogoCambiado('cabana', 'C6', { enMantencion: true }).titulo).toBe('Cabaña en mantención')
    expect(avisoCatalogoCambiado('cabana', 'C6', { enMantencion: false }).titulo).toBe('Cabaña disponible')
    expect(avisoCatalogoCambiado('cabana', 'C6', { isActive: true }).titulo).toBe('Cabaña activada')
    expect(avisoCatalogoCambiado('cabana', 'C6', { name: 'Nueva', pricePerNight: 1 } as never).titulo).toBe('Cabaña guardada')
    expect(avisoAcompanamiento('quitado', 'Papas').titulo).toBe('Acompañamiento quitado')
  })

  it('la sincronización cuenta los cambios y avisa de los conflictos', () => {
    expect(avisoSincronizacion(1, 0).detalle).toBe('Se envió 1 cambio.')
    expect(avisoSincronizacion(3, 0).detalle).toBe('Se enviaron 3 cambios.')
    expect(avisoSincronizacion(2, 1).detalle).toContain('1 reserva quedó en conflicto')
    expect(avisoSincronizacion(2, 2).detalle).toContain('2 reservas quedaron en conflicto')
  })
})

describe('cada acción del administrador avisa (SCRUM-288)', () => {
  let repos: Repositorios
  let hayRed: boolean

  beforeEach(() => {
    descartarAviso()
    marcarServidorActivo()
    hayRed = true
    const base = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    const sinRed = () => { if (!hayRed) throw new ErrorDeAlmacenamiento('red', 'Sin conexión.') }
    repos = {
      ...base,
      requests: Object.assign(Object.create(base.requests), {
        create: async (r: ReservationRequest) => { sinRed(); return base.requests.create(r) },
        update: async (id: string, r: ReservationRequest) => { sinRed(); return base.requests.update(id, r) }
      }),
      payments: {
        listByRequest: base.payments.listByRequest.bind(base.payments),
        add: async (id: string, p: never) => { sinRed(); return base.payments.add(id, p) },
        remove: async (id: string, p: string) => { sinRed(); return base.payments.remove(id, p) }
      }
    }
    usarRepositorios(repos)
    setActivePinia(createPinia())
  })

  it('aprobar sale en verde; rechazar y cancelar, en gris: se descartó algo, no es una buena noticia', async () => {
    const store = useRequestsStore()
    await store.init()
    const a = await store.addRequest(reserva({ requestCode: 'SOL-1' }), 'pending')
    await store.confirmRequest(a.id)
    expect(aviso.value).toMatchObject({ tipo: 'exito', titulo: 'Solicitud aprobada', detalle: 'Ana Pérez · Restaurante' })

    const b = await store.addRequest(reserva({ requestCode: 'SOL-2' }), 'pending')
    await store.rejectRequest(b.id)
    expect(aviso.value).toMatchObject({ tipo: 'descartado', titulo: 'Solicitud rechazada' })

    await store.cancelConfirmedRequest(a.id)
    expect(aviso.value).toMatchObject({ tipo: 'descartado', titulo: 'Reserva cancelada' })
  })

  it('registrar y quitar un pago avisan con el monto', async () => {
    const store = useRequestsStore()
    await store.init()
    const a = await store.addRequest(reserva(), 'pending')
    await store.registerPayment(a.id, { amount: 12000, method: 'transferencia' })
    expect(aviso.value).toMatchObject({ tipo: 'exito', titulo: 'Pago registrado' })
    expect(aviso.value?.detalle).toContain('12.000')
    const pagoId = store.requests[0].payments[0].id
    await store.removePayment(a.id, pagoId)
    expect(aviso.value).toMatchObject({ tipo: 'descartado', titulo: 'Pago quitado' })
  })

  it('sin conexión el aviso es azul y dice qué se enviará: nunca verde', async () => {
    const store = useRequestsStore()
    await store.init()
    const a = await store.addRequest(reserva(), 'pending')
    descartarAviso()

    hayRed = false
    await store.confirmRequest(a.id)
    expect(aviso.value).toMatchObject({ tipo: 'cola', titulo: TITULO_AVISO_COLA })
    expect(aviso.value?.detalle).toBe('Aprobar la solicitud de Ana Pérez. Se enviará cuando vuelva la señal.')

    // Y al volver la señal, lo enviado se confirma en verde
    hayRed = true
    const cambios = useCambiosAdminStore()
    await cambios.sincronizar()
    expect(aviso.value).toMatchObject({ tipo: 'exito', titulo: 'Cambios sincronizados', detalle: 'Se envió 1 cambio.' })
    cambios.detener()
  })

  it('una acción que falla muestra solo el rojo', async () => {
    const store = useRequestsStore()
    await store.init()
    const a = await store.addRequest(reserva(), 'pending')
    descartarAviso()
    repos.requests.update = async () => { throw new ErrorDeAlmacenamiento('desconocida', 'No tienes permiso.') }
    await store.rejectRequest(a.id)
    expect(aviso.value).toMatchObject({ tipo: 'error', detalle: 'No tienes permiso.' })
  })

  it('el catálogo y los ajustes avisan al guardar', async () => {
    const catalogo = useCatalogStore()
    await catalogo.init()
    await catalogo.addCabin({ name: 'Cabaña 9', capacity: 3, pricePerNight: 70000 })
    expect(aviso.value).toMatchObject({ tipo: 'exito', titulo: 'Cabaña agregada', detalle: 'Cabaña 9' })
    const id = catalogo.cabins.at(-1)!.id
    await catalogo.deleteCabin(id)
    expect(aviso.value).toMatchObject({ tipo: 'descartado', titulo: 'Cabaña dada de baja', detalle: 'Cabaña 9' })

    const ajustes = useSettingsStore()
    await ajustes.init()
    await ajustes.updateContactInfo({ phone1: '+56 9 0000 0000' })
    expect(aviso.value).toMatchObject({ tipo: 'exito', titulo: 'Datos de contacto guardados' })
  })
})
