import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales, usarRepositorios } from '../src/lib/repositories'
import { avisoDeError, descartarAviso } from '../src/lib/avisos'
import { useCatalogStore } from '../src/stores/catalogStore'
import { useRequestsStore } from '../src/stores/requestsStore'
import { useSettingsStore } from '../src/stores/settingsStore'
import { useAuthStore } from '../src/stores/authStore'
import { useDisponibilidadStore } from '../src/stores/disponibilidadStore'
import { addDays, todayISO } from '../src/lib/dates'
import { DEFAULT_ADMINS, DEFAULT_CABINS } from '../src/data/seed'
import { DEFAULT_CONTACT } from '../src/data/ajustesPorDefecto'

let mem: ReturnType<typeof crearAlmacenamientoEnMemoria>

function preparar(inicial: Record<string, unknown> = {}) {
  mem = crearAlmacenamientoEnMemoria(inicial)
  usarRepositorios(crearRepositoriosLocales(mem))
  setActivePinia(createPinia())
  descartarAviso()
}

const borrador = () => ({
  requestCode: 'SOL-100',
  clientName: 'Ana',
  clientPhone: '+56 9 1234 5678',
  type: 'restaurante' as const,
  resourceName: 'Restaurante',
  date: '2027-03-10',
  guestsCount: 4,
  totalAmount: 40000,
  depositRequired: 12000,
  payments: [],
  details: { startDate: '2027-03-10', selectedMealTypes: ['almuerzo'] }
})

describe('catalogStore con repositorio (SCRUM-246)', () => {
  beforeEach(() => preparar())

  it('init carga el catálogo desde el repositorio', async () => {
    const store = useCatalogStore()
    expect(store.cabins).toEqual([])
    await store.init()
    expect(store.cabins.map(c => c.id)).toEqual(DEFAULT_CABINS.map(c => c.id))
    expect(store.isReady).toBe(true)
  })

  it('agregar una cabaña la guarda por el repositorio, sin watchers', async () => {
    const store = useCatalogStore()
    await store.init()
    const nueva = await store.addCabin({ name: 'Cabaña 9', capacity: 3, pricePerNight: 70000 })
    expect(store.cabins.some(c => c.id === nueva.id)).toBe(true)
    const guardadas = mem.leer<any[]>('cabins', [])
    expect(guardadas.some(c => c.id === nueva.id)).toBe(true)
  })

  it('si no se puede guardar, la cabaña nueva desaparece, se avisa y el error sube', async () => {
    const store = useCatalogStore()
    await store.init()
    mem.estado.fallar = true
    await expect(store.addCabin({ name: 'Cabaña 9' })).rejects.toThrow()
    expect(store.cabins).toHaveLength(DEFAULT_CABINS.length)
    expect(store.error).toContain('almacenamiento')
    expect(avisoDeError.value).toContain('almacenamiento')
  })

  it('si no se puede guardar un cambio, vuelve al valor anterior', async () => {
    const store = useCatalogStore()
    await store.init()
    const id = DEFAULT_CABINS[0].id
    const antes = store.cabins.find(c => c.id === id)!.pricePerNight
    mem.estado.fallar = true
    await store.updateCabin(id, { pricePerNight: 1 })
    expect(store.cabins.find(c => c.id === id)!.pricePerNight).toBe(antes)
    expect(store.error).toBeTruthy()
  })

  it('dar de baja una cabaña la oculta pero la conserva guardada', async () => {
    const store = useCatalogStore()
    await store.init()
    const id = DEFAULT_CABINS[0].id
    await store.deleteCabin(id)
    expect(store.cabins.some(c => c.id === id)).toBe(false)
    expect(store.todasLasCabanas.some(c => c.id === id)).toBe(true)
    expect(mem.leer<any[]>('cabins', []).find(c => c.id === id).isActive).toBe(false)
  })
})

describe('requestsStore con repositorio', () => {
  beforeEach(() => preparar())

  it('agregar una solicitud la guarda y queda primera', async () => {
    const store = useRequestsStore()
    await store.init()
    const req = await store.addRequest(borrador())
    expect(store.requests[0].id).toBe(req.id)
    expect(mem.leer<any[]>('requests', [])[0].id).toBe(req.id)
  })

  it('si no se puede guardar, la solicitud no queda en pantalla', async () => {
    const store = useRequestsStore()
    await store.init()
    mem.estado.fallar = true
    await expect(store.addRequest(borrador())).rejects.toThrow()
    expect(store.requests).toHaveLength(0)
    expect(avisoDeError.value).toBeTruthy()
  })

  it('confirmar cambia el estado, quita el plazo y lo guarda', async () => {
    const store = useRequestsStore()
    await store.init()
    const req = await store.addRequest(borrador())
    expect(req.depositDueAt).toBeTruthy()
    expect(await store.confirmRequest(req.id)).toBe(true)
    expect(store.requests[0].status).toBe('confirmed')
    expect(store.requests[0].depositDueAt).toBeUndefined()
    const guardada = mem.leer<any[]>('requests', [])[0]
    expect(guardada.status).toBe('confirmed')
    expect(guardada.depositDueAt).toBeUndefined()
  })

  it('si falla al cambiar el estado, la solicitud sigue como estaba', async () => {
    const store = useRequestsStore()
    await store.init()
    const req = await store.addRequest(borrador())
    mem.estado.fallar = true
    expect(await store.updateRequestStatus(req.id, 'rejected')).toBe(false)
    expect(store.requests[0].status).toBe('pending')
  })

  it('registrar un pago lo guarda; si falla, se revierte y devuelve el motivo', async () => {
    const store = useRequestsStore()
    await store.init()
    const req = await store.addRequest(borrador())

    const bueno = await store.registerPayment(req.id, { amount: 12000, method: 'transferencia' })
    expect(bueno.ok).toBe(true)
    expect(store.requests[0].payments).toHaveLength(1)
    expect(mem.leer<any[]>('requests', [])[0].payments).toHaveLength(1)

    mem.estado.fallar = true
    const malo = await store.registerPayment(req.id, { amount: 1000, method: 'efectivo' })
    expect(malo.ok).toBe(false)
    expect(store.requests[0].payments).toHaveLength(1)
  })

  it('un pago que supera el saldo se rechaza sin tocar el almacenamiento', async () => {
    const store = useRequestsStore()
    await store.init()
    const req = await store.addRequest(borrador())
    const res = await store.registerPayment(req.id, { amount: 999999, method: 'efectivo' })
    expect(res.ok).toBe(false)
    expect(store.requests[0].payments).toHaveLength(0)
  })

  it('quitar un pago lo borra del almacenamiento y se revierte si falla', async () => {
    const store = useRequestsStore()
    await store.init()
    const req = await store.addRequest(borrador())
    await store.registerPayment(req.id, { amount: 5000, method: 'efectivo' })
    const idPago = store.requests[0].payments[0].id

    mem.estado.fallar = true
    await store.removePayment(req.id, idPago)
    expect(store.requests[0].payments).toHaveLength(1)

    mem.estado.fallar = false
    await store.removePayment(req.id, idPago)
    expect(store.requests[0].payments).toHaveLength(0)
    expect(mem.leer<any[]>('requests', [])[0].payments).toHaveLength(0)
  })
})

describe('settingsStore con repositorio', () => {
  beforeEach(() => preparar())

  it('init carga lo guardado y completa con los valores de fábrica', async () => {
    preparar({ contact_info: { ...DEFAULT_CONTACT, phone1: '+56 9 3333 3333' } })
    const store = useSettingsStore()
    await store.init()
    expect(store.contactInfo.phone1).toBe('+56 9 3333 3333')
    expect(store.poolEntryPrice).toBeGreaterThan(0)
  })

  it('guardar un ajuste lo escribe y devuelve true', async () => {
    const store = useSettingsStore()
    await store.init()
    expect(await store.updateContactInfo({ phone1: '+56 9 2222 2222' })).toBe(true)
    expect(mem.leer<any>('contact_info', null).phone1).toBe('+56 9 2222 2222')
  })

  it('si no se puede guardar, el ajuste vuelve a su valor y devuelve false', async () => {
    const store = useSettingsStore()
    await store.init()
    const antes = store.contactInfo.phone1
    mem.estado.fallar = true
    expect(await store.updateContactInfo({ phone1: '+56 9 2222 2222' })).toBe(false)
    expect(store.contactInfo.phone1).toBe(antes)
    expect(avisoDeError.value).toBeTruthy()
  })

  it('los parámetros y las reglas de aforo se guardan juntos en `parameters`', async () => {
    const store = useSettingsStore()
    await store.init()
    await store.updateParameters({ poolEntryPrice: 4500 })
    await store.updateCapacityRules({ maxCampingPeopleCapacity: 99 })
    const guardado = mem.leer<any>('parameters', null)
    expect(guardado.poolEntryPrice).toBe(4500)
    expect(guardado.capacityRules.maxCampingPeopleCapacity).toBe(99)
    expect(store.limitesAforo.campingPersonas).toBe(99)
  })

  it('los horarios de camping se guardan por su propia acción', async () => {
    const store = useSettingsStore()
    await store.init()
    const nuevos = { ...store.campingSchedules, diario: { ...store.campingSchedules.diario, checkIn: '10:00' } }
    expect(await store.updateCampingSchedules(nuevos)).toBe(true)
    expect(mem.leer<any>('camping_schedules', null).diario.checkIn).toBe('10:00')
  })
})

describe('authStore con repositorio', () => {
  beforeEach(() => preparar())

  it('init carga a los administradores de fábrica y no inicia sesión sola', async () => {
    const store = useAuthStore()
    await store.init()
    expect(store.adminsList.map(a => a.id)).toEqual(DEFAULT_ADMINS.map(a => a.id))
    expect(store.isAuthenticated).toBe(false)
  })

  it('una sesión guardada de un administrador que ya no existe se cierra al cargar', async () => {
    preparar({ admin_user: { id: 'fantasma', email: 'f@x.cl', role: 'admin' } })
    const store = useAuthStore()
    await store.init()
    expect(store.isAuthenticated).toBe(false)
    expect(mem.existe('admin_user')).toBe(false)
  })

  it('la sesión de un administrador vigente se recupera', async () => {
    const admin = DEFAULT_ADMINS[0]
    preparar({ admin_user: { id: admin.id, email: admin.email, role: admin.role } })
    const store = useAuthStore()
    await store.init()
    expect(store.currentUser?.id).toBe(admin.id)
  })
})

describe('disponibilidadStore (SCRUM-246)', () => {
  beforeEach(() => preparar())

  const cabana = () => {
    const entrada = addDays(todayISO(), 30)
    return {
      requestCode: 'SOL-200',
      clientName: 'Ana',
      clientPhone: '+56 9 1234 5678',
      type: 'cabana' as const,
      resourceName: 'Cabaña 6',
      date: entrada,
      guestsCount: 2,
      totalAmount: 100000,
      depositRequired: 30000,
      payments: [],
      details: { resourceId: DEFAULT_CABINS[0].id, startDate: entrada, endDate: addDays(entrada, 2) }
    }
  }

  it('al arrancar parte sin fechas ocupadas y queda lista', async () => {
    const store = useDisponibilidadStore()
    await store.init()
    expect(store.isReady).toBe(true)
    expect(store.ocupadas.cabanas).toEqual([])
  })

  it('una solicitud pendiente no bloquea, pero al confirmarla el calendario se actualiza solo', async () => {
    const solicitudes = useRequestsStore()
    const disponibilidad = useDisponibilidadStore()
    await solicitudes.init()
    await disponibilidad.init()

    const req = await solicitudes.addRequest(cabana())
    await disponibilidad.refrescar()
    const { entrada, salida } = { entrada: req.details!.startDate!, salida: req.details!.endDate! }
    expect(disponibilidad.consulta.cabanaLibre(DEFAULT_CABINS[0].id, entrada, salida)).toBe(true)

    await solicitudes.confirmRequest(req.id)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(disponibilidad.consulta.cabanaLibre(DEFAULT_CABINS[0].id, entrada, salida)).toBe(false)
  })

  it('cancelar una confirmada vuelve a liberar las fechas', async () => {
    const solicitudes = useRequestsStore()
    const disponibilidad = useDisponibilidadStore()
    await solicitudes.init()
    await disponibilidad.init()
    const req = await solicitudes.addRequest(cabana(), 'confirmed')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(disponibilidad.consulta.cabanaLibre(DEFAULT_CABINS[0].id, req.details!.startDate!, req.details!.endDate!)).toBe(false)

    await solicitudes.updateRequestStatus(req.id, 'cancelled')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(disponibilidad.consulta.cabanaLibre(DEFAULT_CABINS[0].id, req.details!.startDate!, req.details!.endDate!)).toBe(true)
  })

  it('si falla al refrescar no rompe nada y conserva lo último cargado', async () => {
    const disponibilidad = useDisponibilidadStore()
    await disponibilidad.init()
    usarRepositorios({
      ...crearRepositoriosLocales(mem),
      availability: { fechasOcupadas: async () => { throw new Error('sin conexión') } }
    })
    await expect(disponibilidad.refrescar()).resolves.toBeUndefined()
    expect(disponibilidad.error).toBeTruthy()
    expect(disponibilidad.ocupadas.cabanas).toEqual([])
  })
})
