// Pruebas de integración contra la base de Supabase REAL, con los mismos repositorios que usa la app.
// Por defecto se saltan. Para correrlas (desde la carpeta del proyecto, con `.env` completo):
//
//   VITE_PROBAR_SUPABASE=1 npx vitest run tests/integracion
//
// Las de administrador además necesitan una cuenta de administrador de prueba:
//
//   PRUEBA_ADMIN_CORREO=... PRUEBA_ADMIN_CLAVE=... (junto con la variable anterior)
//
// Crean solicitudes cuyo cliente empieza con "PRUEBA-INTEGRACION" y las dejan en la base: se borran después con
//   delete from reservas where cliente_nombre like 'PRUEBA-INTEGRACION%';

import { createPinia, setActivePinia } from 'pinia'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { DEFAULT_CABINS, DEFAULT_CONTACT_PLACEHOLDER } from './datos'
import { addDays, todayISO } from '../../src/lib/dates'
import { inicializarAplicacion } from '../../src/lib/arranque'
import { generateUUID } from '../../src/lib/id'
import { repositorios, usarRepositorios } from '../../src/lib/repositories'
import { crearRepositoriosSupabase } from '../../src/lib/repositories/supabase'
import { supabase, supabaseConfigurado } from '../../src/lib/supabase'
import { useAuthStore } from '../../src/stores/authStore'
import { useCatalogStore } from '../../src/stores/catalogStore'
import { useDisponibilidadStore } from '../../src/stores/disponibilidadStore'
import { useRequestsStore } from '../../src/stores/requestsStore'
import { useReservationStore } from '../../src/stores/reservationStore'
import { useSettingsStore } from '../../src/stores/settingsStore'
import type { ReservationRequest } from '../../src/types/domain'

const activo = process.env.VITE_PROBAR_SUPABASE === '1' && supabaseConfigurado
const hayAdmin = activo && !!process.env.PRUEBA_ADMIN_CORREO && !!process.env.PRUEBA_ADMIN_CLAVE

const repos = activo ? crearRepositoriosSupabase() : (null as unknown as ReturnType<typeof crearRepositoriosSupabase>)
const NOMBRE = 'PRUEBA-INTEGRACION'
// Un teléfono distinto por ejecución, para no chocar con el límite de solicitudes por hora
const telefono = () => `+56 9 ${String(Math.floor(1000 + Math.random() * 8999))} ${String(Math.floor(1000 + Math.random() * 8999))}`

function solicitudDeCabana(nombre: string, entrada: string, salida: string, personas = 2): ReservationRequest {
  return {
    id: generateUUID(),
    requestCode: 'SOL-LOCAL',
    clientName: `${NOMBRE} ${nombre}`,
    clientPhone: telefono(),
    type: 'cabana',
    resourceName: 'Cabaña 6',
    date: entrada,
    guestsCount: personas,
    totalAmount: 1,
    depositRequired: 1,
    payments: [],
    status: 'pending',
    createdAt: new Date().toISOString(),
    details: {
      resourceId: DEFAULT_CABINS[0].id,
      startDate: entrada,
      endDate: salida,
      comments: 'Prueba de integración',
      origin: 'cliente'
    }
  }
}

describe.skipIf(!activo)('Supabase real: lo que ve el público (sin sesión)', () => {
  it('lee los ajustes públicos con sus valores', async () => {
    const contacto = await repos.settings.get('contact_info', DEFAULT_CONTACT_PLACEHOLDER)
    expect(contacto.phone1).toBe('+56 9 8502 5056')
    const parametros = await repos.settings.get('parameters', { defaultDepositPercentage: 0 } as never)
    expect(parametros.defaultDepositPercentage).toBe(30)
    expect(parametros.capacityRules.maxCampingPeopleCapacity).toBe(150)
    const horarios = await repos.settings.get('cabin_schedules', { checkIn: '', checkOut: '', display: '' })
    expect(horarios.checkIn).toBe('15:00')
  })

  it('lee el catálogo activo: cabañas, camping, platos con sus acompañamientos y la lista global', async () => {
    const cabanas = await repos.cabins.list()
    expect(cabanas.map(c => c.name)).toEqual(['Cabaña 6', 'Cabaña 8'])
    expect(cabanas[0]).toMatchObject({ capacity: 6, pricePerNight: 65000, isActive: true, enMantencion: false })
    expect(cabanas[0].features).toEqual(['Cocina equipada', 'Estufa a leña', 'Estacionamiento', 'TV Cable'])

    const sitios = await repos.campingSites.list()
    expect(sitios).toHaveLength(2)
    expect(sitios.every(s => s.modality === 'ambos')).toBe(true)

    const platos = await repos.dishes.list()
    expect(platos).toHaveLength(6)
    const asado = platos.find(p => p.name.startsWith('Asado'))!
    expect(asado).toMatchObject({ price: 20000, mealType: 'almuerzo', sideMode: 'choice' })
    expect(asado.availableSides.sort()).toEqual(['Ensalada surtida', 'Papas al vapor', 'Puré de papas'])
    expect(platos.find(p => p.name.startsWith('Chuletas'))).toMatchObject({ sideMode: 'fixed', fixedSide: 'Puré de papas y ensaladas', availableSides: [] })

    expect(await repos.globalSides.list()).toContain('Papas al vapor')
  })

  it('pide las fechas ocupadas sin datos personales', async () => {
    const desde = todayISO()
    const ocupadas = await repos.availability.fechasOcupadas(desde, addDays(desde, 60))
    expect(Object.keys(ocupadas).sort()).toEqual(['cabanas', 'camping', 'restaurante'])
    expect(JSON.stringify(ocupadas)).not.toMatch(/nombre|telefono|codigo|SOL-|ADM-/i)
  })

  it('no puede leer las solicitudes ni escribir en el catálogo', async () => {
    await expect(repos.requests.list()).rejects.toThrow()
    await expect(repos.cabins.update(DEFAULT_CABINS[0].id, { enMantencion: true })).rejects.toThrow()
    await expect(repos.settings.save('contact_info', { ...DEFAULT_CONTACT_PLACEHOLDER, phone1: 'hackeado' })).rejects.toThrow()
    const cabana = (await repos.cabins.list())[0]
    expect(cabana.enMantencion).toBe(false)
  })

  it('envía una solicitud de cabaña: el servidor asigna el código y calcula el precio, y reenviarla no la duplica', async () => {
    const entrada = addDays(todayISO(), 500)
    const solicitud = solicitudDeCabana('cliente', entrada, addDays(entrada, 2))
    const creada = await repos.requests.create(solicitud)
    expect(creada.requestCode).toMatch(/^SOL-\d{5}$/)
    expect(creada.requestCode).not.toBe('SOL-LOCAL')
    expect(creada).toMatchObject({ status: 'pending', totalAmount: 154700, depositRequired: 46410 })
    expect(creada.depositDueAt).toBeTruthy()

    const otraVez = await repos.requests.create(solicitud)
    expect(otraVez.requestCode).toBe(creada.requestCode)
  })

  it('una solicitud inválida vuelve con un mensaje claro en español', async () => {
    const entrada = addDays(todayISO(), 500)
    await expect(repos.requests.create(solicitudDeCabana('capacidad', entrada, addDays(entrada, 2), 7))).rejects.toThrow(/admite hasta 6 personas/)
    await expect(repos.requests.create(solicitudDeCabana('fecha', '2020-01-01', '2020-01-03'))).rejects.toThrow(/ya pasó/)
  })
})

describe.skipIf(!activo)('Supabase real: la app completa como cliente (stores y arranque)', () => {
  it('arranca sin sesión: carga ajustes, catálogo y disponibilidad, y no pide las solicitudes', async () => {
    usarRepositorios(null)
    setActivePinia(createPinia())
    expect(repositorios().modo).toBe('supabase')
    await inicializarAplicacion()

    expect(useSettingsStore().contactInfo.phone1).toBe('+56 9 8502 5056')
    expect(useSettingsStore().defaultDepositPercentage).toBe(30)
    expect(useSettingsStore().limitesAforo).toEqual({ restaurantePersonas: 200, campingPersonas: 150 })
    expect(useCatalogStore().cabins.map(c => c.name)).toEqual(['Cabaña 6', 'Cabaña 8'])
    expect(useDisponibilidadStore().isReady).toBe(true)
    expect(useAuthStore().isAuthenticated).toBe(false)
    expect(useRequestsStore().requests).toEqual([])
    expect(useRequestsStore().isReady).toBe(false)
  })

  it('envía una solicitud de cabaña desde el borrador y muestra el código que asignó el servidor', async () => {
    usarRepositorios(null)
    setActivePinia(createPinia())
    await inicializarAplicacion()

    const reserva = useReservationStore()
    const entrada = addDays(todayISO(), 600)
    reserva.resetStore()
    reserva.selectedService = 'cabana'
    reserva.checkInDate = entrada
    reserva.checkOutDate = addDays(entrada, 3)
    reserva.guestsCount = 3
    reserva.selectedCabinId = DEFAULT_CABINS[1].id
    reserva.clientName = `${NOMBRE} flujo completo`
    reserva.clientPhone = telefono()
    expect(reserva.priceBreakdown?.totalWithIva).toBe(428400)

    const codigo = await reserva.submitReservationRequest()
    expect(codigo).toMatch(/^SOL-\d{5}$/)
    expect(reserva.solicitudEnviada).toBe(true)
    const guardada = useRequestsStore().requests.find(r => r.requestCode === codigo)
    expect(guardada).toMatchObject({ status: 'pending', totalAmount: 428400, resourceName: 'Cabaña 8' })
  })
})

describe.skipIf(!hayAdmin)('Supabase real: el administrador (con sesión)', () => {
  // Fechas lejanas y distintas en cada ejecución, para no chocar con lo que dejó una corrida anterior
  const lejos = (extra: number) => addDays(todayISO(), 800 + Math.floor(Math.random() * 3000) + extra)

  afterAll(async () => {
    // Borra todo lo que crearon las pruebas (solo un administrador puede) y cierra la sesión.
    // La última prueba cierra la sesión a propósito, así que se vuelve a iniciar para limpiar.
    await repos.auth.iniciarSesion(process.env.PRUEBA_ADMIN_CORREO!, process.env.PRUEBA_ADMIN_CLAVE!)
    for (const r of await repos.requests.list()) {
      if (r.clientName.startsWith(NOMBRE)) await repos.requests.remove(r.id)
    }
    await repos.auth.cerrarSesion()
  })

  it('no entra con una contraseña equivocada y sí con la correcta', async () => {
    expect(await repos.auth.iniciarSesion(process.env.PRUEBA_ADMIN_CORREO!, 'contraseña-equivocada-123')).toBeNull()
    const usuario = await repos.auth.iniciarSesion(process.env.PRUEBA_ADMIN_CORREO!, process.env.PRUEBA_ADMIN_CLAVE!)
    expect(usuario).toMatchObject({ email: process.env.PRUEBA_ADMIN_CORREO, role: 'admin' })
    expect((await repos.auth.getSession())?.id).toBe(usuario!.id)
    expect((await repos.auth.listarAdmins()).length).toBeGreaterThan(0)
  })

  it('crear otro administrador desde la app no está disponible y lo explica', async () => {
    await expect(repos.auth.crearAdmin('X', 'x@x.cl', 'abcdefgh')).rejects.toThrow(/panel de Supabase/)
  })

  it('ve las solicitudes, confirma una y la fecha pasa a verse ocupada para el público', async () => {
    const entrada = lejos(0)
    const salida = addDays(entrada, 2)
    const creada = await repos.requests.create(solicitudDeCabana('para confirmar', entrada, salida))

    const lista = await repos.requests.list()
    const propia = lista.find(r => r.id === creada.id)!
    expect(propia).toMatchObject({ requestCode: creada.requestCode, resourceName: 'Cabaña 6', status: 'pending', guestsCount: 2 })
    expect(propia.details).toMatchObject({ startDate: entrada, endDate: salida, schedule: { checkIn: '15:00', checkOut: '11:00' } })

    const confirmada = await repos.requests.update(creada.id, { status: 'confirmed', depositDueAt: undefined })
    expect(confirmada.status).toBe('confirmed')
    expect(confirmada.requestCode).toBe(creada.requestCode)

    const ocupadas = await repos.availability.fechasOcupadas(entrada, salida)
    expect(ocupadas.cabanas.filter(n => n.cabinId === DEFAULT_CABINS[0].id).map(n => n.noche)).toEqual([entrada, addDays(entrada, 1)])
  })

  it('con dos solicitudes cruzadas, confirmar la segunda se rechaza con un mensaje claro y un cliente ya no puede pedir esas fechas', async () => {
    const entrada = lejos(0)
    const primera = await repos.requests.create(solicitudDeCabana('primera', entrada, addDays(entrada, 2)))
    const segunda = await repos.requests.create(solicitudDeCabana('segunda', addDays(entrada, 1), addDays(entrada, 3)))
    expect([primera.status, segunda.status]).toEqual(['pending', 'pending'])

    await repos.requests.update(primera.id, { status: 'confirmed' })
    await expect(repos.requests.update(segunda.id, { status: 'confirmed' })).rejects.toThrow(/Ya hay una reserva confirmada/)
    expect((await repos.requests.getById(segunda.id))?.status).toBe('pending')

    // Con la primera confirmada, el servidor ya no acepta nuevas solicitudes en esas noches
    await expect(repos.requests.create(solicitudDeCabana('tercera', addDays(entrada, 1), addDays(entrada, 3)))).rejects.toThrow(/ya está reservada/)
  })

  it('carga una reserva como administrador: la base asigna el código ADM- y guarda el evento especial', async () => {
    const entrada = lejos(0)
    const base = solicitudDeCabana('admin', entrada, addDays(entrada, 1))
    const reserva: ReservationRequest = {
      ...base,
      requestCode: 'ADM-LOCAL',
      status: 'confirmed',
      totalAmount: 65000,
      depositRequired: 0,
      details: { ...base.details, origin: 'admin', isSpecialEvent: true, pricing: { subtotal: 65000, ivaAmount: 0, ivaPercentage: 0, depositPercentage: 0, nights: 1 } }
    }
    const creada = await repos.requests.create(reserva)
    expect(creada.requestCode).toMatch(/^ADM-\d{5}$/)
    expect(creada).toMatchObject({ status: 'confirmed', totalAmount: 65000 })
    expect(creada.details?.isSpecialEvent).toBe(true)
  })

  it('avisa en tiempo real cuando cambia una reserva (SCRUM-273)', async () => {
    let avisos = 0
    const parar = repos.requests.escucharCambios(() => { avisos++ })
    // El primer aviso es la conexión en vivo ya establecida
    await vi.waitFor(() => expect(avisos).toBeGreaterThanOrEqual(1), { timeout: 10000, interval: 100 })
    const antes = avisos
    const entrada = lejos(0)
    await repos.requests.create(solicitudDeCabana('tiempo real', entrada, addDays(entrada, 1)))
    await vi.waitFor(() => expect(avisos).toBeGreaterThan(antes), { timeout: 10000, interval: 100 })
    parar()
  })

  it('registra y quita pagos', async () => {
    const entrada = lejos(0)
    const creada = await repos.requests.create(solicitudDeCabana('pagos', entrada, addDays(entrada, 2)))
    const pago = { id: generateUUID(), amount: 20000, method: 'transferencia' as const, paidOn: todayISO(), notes: 'Abono de prueba', createdAt: new Date().toISOString() }
    await repos.payments.add(creada.id, pago)
    const conPago = await repos.requests.getById(creada.id)
    expect(conPago?.payments).toHaveLength(1)
    expect(conPago?.payments[0]).toMatchObject({ id: pago.id, amount: 20000, method: 'transferencia', notes: 'Abono de prueba' })
    expect((await repos.payments.listByRequest(creada.id)).map(p => p.id)).toEqual([pago.id])
    await repos.payments.remove(creada.id, pago.id)
    expect((await repos.requests.getById(creada.id))?.payments).toHaveLength(0)
  })

  it('cambia el catálogo y los ajustes, y lo deja como estaba', async () => {
    const cabana = (await repos.cabins.list())[0]
    const cambiada = await repos.cabins.update(cabana.id, { enMantencion: true })
    expect(cambiada.enMantencion).toBe(true)
    expect((await repos.cabins.getById(cabana.id))?.enMantencion).toBe(true)
    await repos.cabins.update(cabana.id, { enMantencion: false })

    const contacto = await repos.settings.get('contact_info', DEFAULT_CONTACT_PLACEHOLDER)
    await repos.settings.save('contact_info', { ...contacto, address: 'Dirección de prueba' })
    const otra = crearRepositoriosSupabase() // sin memoria: lee de la base
    expect((await otra.settings.get('contact_info', DEFAULT_CONTACT_PLACEHOLDER)).address).toBe('Dirección de prueba')
    await repos.settings.save('contact_info', contacto)
  })

  it('un plato nuevo con acompañamientos se crea, se lee y se da de baja', async () => {
    const id = generateUUID()
    const plato = await repos.dishes.create({
      id, name: `${NOMBRE} plato`, price: 9999, mealType: 'almuerzo', sideMode: 'choice',
      availableSides: ['Papas al vapor', `${NOMBRE} acompañamiento nuevo`], isActive: true
    })
    expect(plato.availableSides.sort()).toEqual(['Papas al vapor', `${NOMBRE} acompañamiento nuevo`].sort())
    const sinLado = await repos.dishes.update(id, { availableSides: ['Papas al vapor'] })
    expect(sinLado.availableSides).toEqual(['Papas al vapor'])
    await repos.dishes.update(id, { isActive: false })
    await repos.globalSides.remove(`${NOMBRE} acompañamiento nuevo`)
  })

  it('al cerrar la sesión vuelve a ser público: ya no lee solicitudes', async () => {
    await repos.auth.cerrarSesion()
    expect(await repos.auth.getSession()).toBeNull()
    await expect(repos.requests.list()).rejects.toThrow()
    expect(await repos.auth.listarAdmins()).toEqual([])
  })
})
