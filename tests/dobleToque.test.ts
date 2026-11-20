import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales, usarRepositorios } from '../src/lib/repositories'
import { useRequestsStore } from '../src/stores/requestsStore'
import { useEnvioSolicitud } from '../src/composables/useEnvioSolicitud'
import type { ReservationRequest } from '../src/types/domain'

const reserva = (): Omit<ReservationRequest, 'id' | 'status' | 'createdAt'> => ({
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
  details: { startDate: '2099-03-10', selectedMealTypes: ['almuerzo'], origin: 'admin' }
})

describe('ningún doble toque duplica pagos ni solicitudes (SCRUM-258)', () => {
  beforeEach(() => {
    usarRepositorios(crearRepositoriosLocales(crearAlmacenamientoEnMemoria()))
    setActivePinia(createPinia())
  })

  it('dos toques seguidos en "Guardar pago" registran un solo pago', async () => {
    const store = useRequestsStore()
    const creada = await store.addRequest(reserva(), 'confirmed')
    const pago = { amount: 5000, method: 'transferencia' as const, paidOn: '2099-01-01', notes: '' }

    const [primero, segundo] = await Promise.all([store.registerPayment(creada.id, pago), store.registerPayment(creada.id, pago)])

    expect(primero.ok).toBe(true)
    expect(segundo.ok).toBe(false)
    expect(store.requests.find(r => r.id === creada.id)?.payments).toHaveLength(1)
  })

  it('después de terminar el primero, un pago nuevo sí se puede registrar', async () => {
    const store = useRequestsStore()
    const creada = await store.addRequest(reserva(), 'confirmed')
    const pago = { amount: 5000, method: 'transferencia' as const, paidOn: '2099-01-01', notes: '' }
    await store.registerPayment(creada.id, pago)
    expect((await store.registerPayment(creada.id, pago)).ok).toBe(true)
    expect(store.requests.find(r => r.id === creada.id)?.payments).toHaveLength(2)
  })

  it('dos toques seguidos en "Enviar solicitud" ejecutan el envío una sola vez', async () => {
    const { enviar, isSubmitting } = useEnvioSolicitud()
    let envios = 0
    let liberar!: () => void
    const espera = new Promise<void>(r => { liberar = r })
    const accion = async () => { envios++; await espera }

    const a = enviar(accion)
    const b = enviar(accion)
    expect(isSubmitting.value).toBe(true)
    liberar()
    await Promise.all([a, b])

    expect(envios).toBe(1)
    expect(isSubmitting.value).toBe(false)
  })
})
