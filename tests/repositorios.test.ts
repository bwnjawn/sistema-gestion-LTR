import { describe, expect, it } from 'vitest'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales } from '../src/lib/repositories'
import { ErrorDeAlmacenamiento, ErrorNoEncontrado } from '../src/lib/errores'
import { DEFAULT_ADMINS, DEFAULT_CABINS, DEFAULT_GLOBAL_SIDES } from '../src/data/seed'
import { DEFAULT_CONTACT } from '../src/data/ajustesPorDefecto'
import type { Cabin, Payment, ReservationRequest } from '../src/types/domain'

function nuevaCabana(id: string): Cabin {
  return {
    id,
    name: 'Cabaña de prueba',
    capacity: 4,
    pricePerNight: 50000,
    isActive: true
  }
}

function solicitud(id: string, desde: string, hasta?: string): ReservationRequest {
  return {
    id,
    requestCode: `SOL-${id}`,
    clientName: 'Ana',
    clientPhone: '+56 9 1234 5678',
    type: hasta ? 'cabana' : 'restaurante',
    resourceName: 'x',
    date: desde,
    guestsCount: 2,
    totalAmount: 1000,
    depositRequired: 300,
    payments: [],
    status: 'pending',
    createdAt: '2027-01-01T00:00:00.000Z',
    details: { startDate: desde, endDate: hasta ?? '' }
  }
}

function pago(id: string): Payment {
  return { id, amount: 100, method: 'efectivo', paidOn: '2027-01-02', createdAt: '2027-01-02T00:00:00.000Z' }
}

describe('repositorio local por entidad (SCRUM-246)', () => {
  it('sin nada guardado entrega la semilla y no la guarda hasta el primer cambio', async () => {
    const mem = crearAlmacenamientoEnMemoria()
    const repos = crearRepositoriosLocales(mem)
    const cabanas = await repos.cabins.list()
    expect(cabanas.map(c => c.id)).toEqual(DEFAULT_CABINS.map(c => c.id))
    expect(mem.existe('cabins')).toBe(false)
  })

  it('la semilla nunca se comparte por referencia: modificar el resultado no la cambia', async () => {
    const repos = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    const primera = await repos.cabins.list()
    primera[0].name = 'Cambiada'
    expect((await repos.cabins.list())[0].name).toBe(DEFAULT_CABINS[0].name)
    expect(DEFAULT_CABINS[0].name).not.toBe('Cambiada')
  })

  it('create, getById, update y remove', async () => {
    const repos = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    await repos.cabins.create(nuevaCabana('c-1'))
    expect((await repos.cabins.getById('c-1'))?.name).toBe('Cabaña de prueba')

    const actualizada = await repos.cabins.update('c-1', { capacity: 6 })
    expect(actualizada).toMatchObject({ id: 'c-1', capacity: 6, name: 'Cabaña de prueba' })
    expect((await repos.cabins.getById('c-1'))?.capacity).toBe(6)

    await repos.cabins.remove('c-1')
    expect(await repos.cabins.getById('c-1')).toBeUndefined()
    // las de la semilla siguen ahí
    expect((await repos.cabins.list()).length).toBe(DEFAULT_CABINS.length)
  })

  it('actualizar algo que no existe lanza ErrorNoEncontrado y repetir un id es un error', async () => {
    const repos = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    await expect(repos.cabins.update('no-existe', { capacity: 1 })).rejects.toBeInstanceOf(ErrorNoEncontrado)
    await repos.cabins.create(nuevaCabana('c-1'))
    await expect(repos.cabins.create(nuevaCabana('c-1'))).rejects.toThrow()
  })

  it('si el almacenamiento falla, lanza ErrorDeAlmacenamiento y no guarda nada', async () => {
    const mem = crearAlmacenamientoEnMemoria()
    const repos = crearRepositoriosLocales(mem)
    mem.estado.fallar = true
    await expect(repos.cabins.create(nuevaCabana('c-1'))).rejects.toBeInstanceOf(ErrorDeAlmacenamiento)
    expect(mem.existe('cabins')).toBe(false)
  })

  it('los acompañamientos globales usan una sola clave y no repiten nombres', async () => {
    const mem = crearAlmacenamientoEnMemoria()
    const repos = crearRepositoriosLocales(mem)
    expect(await repos.globalSides.list()).toEqual(DEFAULT_GLOBAL_SIDES)
    await repos.globalSides.add('Quinoa')
    const lista = await repos.globalSides.add('Quinoa')
    expect(lista.filter(s => s === 'Quinoa')).toHaveLength(1)
    expect(mem.existe('global_sides')).toBe(true)
    expect(mem.existe('global_side_dishes')).toBe(false)
    expect(await repos.globalSides.remove('Quinoa')).not.toContain('Quinoa')
  })
})

describe('repositorio de solicitudes y pagos', () => {
  it('la solicitud nueva entra primera', async () => {
    const repos = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    await repos.requests.create(solicitud('a', '2027-03-10'))
    await repos.requests.create(solicitud('b', '2027-03-11'))
    expect((await repos.requests.list()).map(r => r.id)).toEqual(['b', 'a'])
  })

  it('listByRange devuelve solo las que tocan el rango, con estadías de varios días incluidas', async () => {
    const repos = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    await repos.requests.create(solicitud('dia', '2027-03-10'))
    await repos.requests.create(solicitud('estadia', '2027-03-08', '2027-03-12'))
    await repos.requests.create(solicitud('lejos', '2027-05-01'))
    const marzo = await repos.requests.listByRange('2027-03-10', '2027-03-31')
    expect(marzo.map(r => r.id).sort()).toEqual(['dia', 'estadia'])
    expect(await repos.requests.listByRange('2027-04-01', '2027-04-30')).toEqual([])
  })

  it('los pagos se agregan y se quitan sobre la solicitud', async () => {
    const repos = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    await repos.requests.create(solicitud('a', '2027-03-10'))
    await repos.payments.add('a', pago('p1'))
    await repos.payments.add('a', pago('p2'))
    expect((await repos.payments.listByRequest('a')).map(p => p.id)).toEqual(['p1', 'p2'])
    await repos.payments.remove('a', 'p1')
    expect((await repos.requests.getById('a'))?.payments.map(p => p.id)).toEqual(['p2'])
    await expect(repos.payments.add('no-existe', pago('p3'))).rejects.toBeInstanceOf(ErrorNoEncontrado)
  })
})

describe('repositorio de ajustes y de administradores', () => {
  it('entrega el valor por defecto hasta que se guarda y luego lo guardado', async () => {
    const repos = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    expect(await repos.settings.get('contact_info', DEFAULT_CONTACT)).toEqual(DEFAULT_CONTACT)
    await repos.settings.save('contact_info', { ...DEFAULT_CONTACT, phone1: '+56 9 1111 1111' })
    expect((await repos.settings.get('contact_info', DEFAULT_CONTACT)).phone1).toBe('+56 9 1111 1111')
  })

  it('los administradores parten de la semilla y la sesión se guarda y se borra', async () => {
    const repos = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    expect((await repos.auth.admins.list()).map(a => a.email)).toEqual(DEFAULT_ADMINS.map(a => a.email))
    expect(await repos.auth.getSession()).toBeNull()
    await repos.auth.saveSession({ id: 'x', email: 'a@b.cl', role: 'admin' })
    expect((await repos.auth.getSession())?.id).toBe('x')
    await repos.auth.clearSession()
    expect(await repos.auth.getSession()).toBeNull()
  })
})
