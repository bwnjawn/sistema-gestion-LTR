import { describe, expect, it } from 'vitest'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { migrateLegacyData } from '../src/lib/migrarDatosLocales'
import { DEFAULT_ADMINS } from '../src/data/seed'
import { DEFAULT_CONTACT } from '../src/data/ajustesPorDefecto'

const SOLICITUD_ANTIGUA = {
  id: 'x',
  requestCode: 'SOL-555',
  clientName: 'A',
  clientPhone: '+56911111111',
  type: 'cabaña',
  status: 'confirmada',
  resourceName: 'Cabaña 6',
  date: '2026-12-01',
  timeOrDuration: '2026-12-03',
  guestsCount: 2,
  totalAmount: 100,
  depositAmount: 30,
  createdAt: '2026-11-01T00:00:00.000Z',
  details: { resourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' }
}

describe('migrateLegacyData (SCRUM-246)', () => {
  it('no escribe nada si no hay nada guardado', () => {
    const mem = crearAlmacenamientoEnMemoria()
    expect(migrateLegacyData(mem).cambios).toEqual([])
    expect(mem.datos.size).toBe(0)
  })

  it('lleva las solicitudes antiguas al formato vigente', () => {
    const mem = crearAlmacenamientoEnMemoria({ requests: [SOLICITUD_ANTIGUA] })
    expect(migrateLegacyData(mem).cambios).toContain('requests')
    const [req] = mem.leer<any[]>('requests', [])
    expect(req).toMatchObject({
      type: 'cabana',
      status: 'confirmed',
      depositRequired: 30,
      details: { startDate: '2026-12-01', endDate: '2026-12-03' }
    })
    expect(req.depositAmount).toBeUndefined()
  })

  it('es idempotente: la segunda vez no cambia nada', () => {
    const mem = crearAlmacenamientoEnMemoria({ requests: [SOLICITUD_ANTIGUA] })
    migrateLegacyData(mem)
    expect(migrateLegacyData(mem).cambios).toEqual([])
  })

  it('migra los platos con id antiguo y el catálogo sin isActive', () => {
    const mem = crearAlmacenamientoEnMemoria({
      dishes: [
        {
          id: 'g6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77',
          name: 'Plato',
          price: 5000,
          mealCategory: 'Almuerzo',
          hasSelectableSides: false
        }
      ],
      cabins: [{ id: 'c1', name: 'C', capacity: 2, pricePerNight: 1, images: ['a.jpg'] }]
    })
    migrateLegacyData(mem)
    expect(mem.leer<any[]>('dishes', [])[0]).toMatchObject({ id: 'a6fecb99-9c0b-4ef8-bb6d-6bb9bd380a77', mealType: 'almuerzo', isActive: true })
    expect(mem.leer<any[]>('cabins', [])[0]).toMatchObject({ mainImage: 'a.jpg', isActive: true })
  })

  it('borra la clave sobrante de los acompañamientos y conserva los datos reales', () => {
    const mem = crearAlmacenamientoEnMemoria({ global_sides: ['Arroz'], global_side_dishes: ['Copia vieja'] })
    expect(migrateLegacyData(mem).cambios).toContain('global_side_dishes')
    expect(mem.existe('global_side_dishes')).toBe(false)
    expect(mem.leer('global_sides', [])).toEqual(['Arroz'])
  })

  it('el contacto con valores de fábrica antiguos se actualiza y lo que editó el admin no se toca', () => {
    const mem = crearAlmacenamientoEnMemoria({
      contact_info: { ...DEFAULT_CONTACT, phone2: '+56 9 9588 3385', phone1: '+56 9 7777 7777' }
    })
    migrateLegacyData(mem)
    const contacto = mem.leer<any>('contact_info', null)
    expect(contacto.phone2).toBe(DEFAULT_CONTACT.phone2)
    expect(contacto.phone1).toBe('+56 9 7777 7777')
  })

  it('descarta al administrador con la contraseña antigua, repone los de fábrica y cierra su sesión', () => {
    const mem = crearAlmacenamientoEnMemoria({
      admin_list: [{ id: 'viejo', name: 'Viejo', email: 'v@x.cl', passwordHash: 'admin123', role: 'admin' }],
      admin_user: { id: 'viejo', email: 'v@x.cl', role: 'admin' }
    })
    const { cambios } = migrateLegacyData(mem)
    expect(cambios).toEqual(expect.arrayContaining(['admin_list', 'admin_user']))
    expect(mem.leer<any[]>('admin_list', []).map(a => a.id)).toEqual(DEFAULT_ADMINS.map(a => a.id))
    expect(mem.existe('admin_user')).toBe(false)
  })

  it('una sesión de un administrador vigente se conserva', () => {
    const mem = crearAlmacenamientoEnMemoria({ admin_user: { id: DEFAULT_ADMINS[0].id, email: DEFAULT_ADMINS[0].email, role: 'owner' } })
    migrateLegacyData(mem)
    expect(mem.existe('admin_user')).toBe(true)
  })
})
