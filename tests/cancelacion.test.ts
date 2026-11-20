import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales, usarRepositorios } from '../src/lib/repositories'
import { descartarAviso } from '../src/lib/avisos'
import { addDays, todayISO } from '../src/lib/dates'
import { puedeCancelarse } from '../src/services/requests'
import { buildAsuntoCancelacion, buildMensajeCancelacion } from '../src/services/mensajesCliente'
import { hojaRegistros } from '../src/services/exportacion'
import { filterRequests } from '../src/services/requestFilters'
import { isCabinStayBlocked } from '../src/services/availability'
import { useRequestsStore } from '../src/stores/requestsStore'
import { useDisponibilidadStore } from '../src/stores/disponibilidadStore'
import { DEFAULT_CABINS } from '../src/data/seed'
import type { ReservationRequest } from '../src/types/domain'

const CABANA = DEFAULT_CABINS[0].id
const soloEsa = [DEFAULT_CABINS[0]]
// Fechas relativas a hoy: la disponibilidad solo mira los próximos dos años
const DIA = (n: number) => addDays(todayISO(), n)

const reserva = (extra: Partial<ReservationRequest> = {}): Omit<ReservationRequest, 'id' | 'status' | 'createdAt'> => ({
  requestCode: 'SOL-1',
  clientName: 'Ana',
  clientPhone: '+56 9 1234 5678',
  type: 'cabana',
  resourceName: DEFAULT_CABINS[0].name,
  date: DIA(10),
  guestsCount: 2,
  totalAmount: 100000,
  depositRequired: 30000,
  payments: [],
  details: { resourceId: CABANA, startDate: DIA(10), endDate: DIA(12) },
  ...extra
})

describe('cancelar una reserva confirmada (SCRUM-284)', () => {
  let mem: ReturnType<typeof crearAlmacenamientoEnMemoria>
  beforeEach(() => {
    mem = crearAlmacenamientoEnMemoria()
    usarRepositorios(crearRepositoriosLocales(mem))
    setActivePinia(createPinia())
    descartarAviso()
  })

  it('solo una confirmada se cancela', () => {
    expect(puedeCancelarse({ status: 'confirmed' })).toBe(true)
    expect(puedeCancelarse({ status: 'pending' })).toBe(false)
    expect(puedeCancelarse({ status: 'rejected' })).toBe(false)
    expect(puedeCancelarse({ status: 'cancelled' })).toBe(false)
  })

  it('pasa a "Cancelada", se guarda y sigue en el historial con sus pagos', async () => {
    const store = useRequestsStore()
    await store.init()
    const creada = await store.addRequest(reserva(), 'confirmed')
    await store.registerPayment(creada.id, { amount: 30000, method: 'transferencia' })

    expect(await store.cancelConfirmedRequest(creada.id)).toBe(true)
    const guardada = store.requests.find(r => r.id === creada.id)!
    expect(guardada.status).toBe('cancelled')
    expect(guardada.payments).toHaveLength(1)
    // Quedó guardada, no solo en pantalla
    const enAlmacen = mem.leer<ReservationRequest[]>('requests', []).find(r => r.id === creada.id)!
    expect(enAlmacen.status).toBe('cancelled')
    expect(enAlmacen.payments).toHaveLength(1)
  })

  it('libera las fechas: la cabaña vuelve a estar disponible en el calendario del cliente', async () => {
    const store = useRequestsStore()
    const disponibilidad = useDisponibilidadStore()
    await store.init()
    const creada = await store.addRequest(reserva(), 'confirmed')
    await disponibilidad.cargar()
    // Mientras está confirmada, las noches quedan ocupadas para el público y para el panel
    expect(disponibilidad.ocupadas.cabanas.filter(n => n.cabinId === CABANA).map(n => n.noche)).toEqual([DIA(10), DIA(11)])
    expect(isCabinStayBlocked(DIA(10), DIA(12), 2, soloEsa, store.requests)).toBe(true)

    await store.cancelConfirmedRequest(creada.id)
    await disponibilidad.cargar()
    expect(disponibilidad.ocupadas.cabanas.filter(n => n.cabinId === CABANA)).toEqual([])
    expect(isCabinStayBlocked(DIA(10), DIA(12), 2, soloEsa, store.requests)).toBe(false)
  })

  it('una pendiente no se cancela (se rechaza) y una ya cancelada no se vuelve a cancelar', async () => {
    const store = useRequestsStore()
    await store.init()
    const pendiente = await store.addRequest(reserva({ requestCode: 'SOL-2' }), 'pending')
    expect(await store.cancelConfirmedRequest(pendiente.id)).toBe(false)
    expect(store.requests.find(r => r.id === pendiente.id)!.status).toBe('pending')

    const confirmada = await store.addRequest(reserva({ requestCode: 'SOL-3', details: { resourceId: CABANA, startDate: DIA(20), endDate: DIA(22) }, date: DIA(20) }), 'confirmed')
    expect(await store.cancelConfirmedRequest(confirmada.id)).toBe(true)
    expect(await store.cancelConfirmedRequest(confirmada.id)).toBe(false)
  })

  it('la cancelada aparece en el filtro de descartadas y en el Excel', async () => {
    const store = useRequestsStore()
    await store.init()
    const creada = await store.addRequest(reserva(), 'confirmed')
    await store.cancelConfirmedRequest(creada.id)
    const descartadas = filterRequests(store.requests, { status: 'discarded', type: 'all', query: '' })
    expect(descartadas.map(r => r.id)).toContain(creada.id)
    const hoja = hojaRegistros(store.requests, 19)
    expect(JSON.stringify(hoja.filas)).toContain('Cancelada')
  })

  it('si no se puede guardar, la reserva sigue confirmada y se avisa', async () => {
    const store = useRequestsStore()
    await store.init()
    const creada = await store.addRequest(reserva(), 'confirmed')
    mem.estado.fallar = true
    expect(await store.cancelConfirmedRequest(creada.id)).toBe(false)
    expect(store.requests.find(r => r.id === creada.id)!.status).toBe('confirmed')
  })

  it('el mensaje al cliente no promete devoluciones: solo ofrece conversar el abono si lo hubo', () => {
    const sinAbono = { ...reserva(), id: 'x', status: 'cancelled', createdAt: '2099-01-01' } as ReservationRequest
    const conAbono = { ...sinAbono, payments: [{ id: 'p', amount: 30000, method: 'transferencia', paidOn: '2099-01-02' }] } as ReservationRequest
    expect(buildMensajeCancelacion(sinAbono)).toContain('Ana')
    expect(buildMensajeCancelacion(sinAbono)).not.toContain('abono')
    expect(buildMensajeCancelacion(conAbono)).toContain('abono')
    expect(buildMensajeCancelacion(conAbono)).not.toMatch(/devol/i)
    expect(buildAsuntoCancelacion(sinAbono)).toContain('SOL-1')
  })
})
