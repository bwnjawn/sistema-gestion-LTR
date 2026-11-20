import { describe, expect, it } from 'vitest'
import { claveVapidABytes, resolverEstadoAvisos, type CapacidadesDeAvisos } from '../src/services/avisosPush'
import { armarAviso, describirFechas } from '../supabase/functions/avisar-solicitud/mensaje'

const base: CapacidadesDeAvisos = {
  hayClave: true,
  hayServiceWorker: true,
  hayPush: true,
  hayNotificaciones: true,
  permiso: 'default',
  esIos: false,
  instalada: false,
  suscrito: false
}

describe('estado de los avisos push (SCRUM-68)', () => {
  it('sin clave del servidor no está disponible', () => {
    expect(resolverEstadoAvisos({ ...base, hayClave: false })).toBe('no-disponible')
  })

  it('en iPhone sin instalar pide instalar la app, aunque el navegador no ofrezca push', () => {
    expect(resolverEstadoAvisos({ ...base, esIos: true, hayPush: false, hayNotificaciones: false })).toBe('instalar-app')
  })

  it('en iPhone con la app instalada se puede activar', () => {
    expect(resolverEstadoAvisos({ ...base, esIos: true, instalada: true })).toBe('desactivado')
  })

  it('un navegador sin push ni notificaciones no está disponible', () => {
    expect(resolverEstadoAvisos({ ...base, hayPush: false })).toBe('no-disponible')
    expect(resolverEstadoAvisos({ ...base, hayNotificaciones: false, permiso: 'no-soportado' })).toBe('no-disponible')
  })

  it('con el permiso denegado está bloqueado', () => {
    expect(resolverEstadoAvisos({ ...base, permiso: 'denied' })).toBe('bloqueado')
  })

  it('activado solo si hay permiso Y suscripción', () => {
    expect(resolverEstadoAvisos({ ...base, permiso: 'granted', suscrito: true })).toBe('activado')
    expect(resolverEstadoAvisos({ ...base, permiso: 'granted', suscrito: false })).toBe('desactivado')
    expect(resolverEstadoAvisos({ ...base, permiso: 'default', suscrito: true })).toBe('desactivado')
  })

  it('convierte la clave VAPID de base64 para URL a bytes', () => {
    // "hola" en base64 es aG9sYQ==; en la variante para URL va sin relleno
    expect(Array.from(claveVapidABytes('aG9sYQ'))).toEqual([104, 111, 108, 97])
    // Los caracteres - y _ equivalen a + y /
    expect(Array.from(claveVapidABytes('-_8'))).toEqual([251, 255])
  })
})

describe('texto del aviso de solicitud nueva (SCRUM-68)', () => {
  const datos = {
    id: 'a1b2c3d4-0000-4000-8000-000000000001',
    codigo: 'SOL-00003',
    tipo: 'cabana',
    clienteNombre: 'Juan Pérez',
    fechaInicio: '2027-01-12',
    fechaFin: '2027-01-14',
    personas: 4
  }

  it('arma título, cuerpo y enlace a la solicitud', () => {
    expect(armarAviso(datos)).toEqual({
      titulo: 'Nueva solicitud · Cabaña',
      cuerpo: 'Juan Pérez · 12 al 14 de enero · 4 personas',
      url: '/admin/solicitudes?solicitud=a1b2c3d4-0000-4000-8000-000000000001',
      etiqueta: 'solicitud-a1b2c3d4-0000-4000-8000-000000000001'
    })
  })

  it('no incluye datos de contacto ni dinero', () => {
    const aviso = armarAviso({ ...datos, clienteNombre: 'Ana' })
    const texto = `${aviso.titulo} ${aviso.cuerpo}`
    expect(texto).not.toMatch(/\+56|@|\$|\d{6,}/)
  })

  it('una persona va en singular y un solo día sin rango', () => {
    expect(armarAviso({ ...datos, personas: 1, tipo: 'piscina', fechaFin: datos.fechaInicio }).cuerpo).toBe('Juan Pérez · 12 de enero · 1 persona')
  })

  it('un rango entre dos meses nombra los dos', () => {
    expect(describirFechas('2027-01-30', '2027-02-02')).toBe('30 de enero al 2 de febrero')
  })

  it('un tipo desconocido usa un título genérico', () => {
    expect(armarAviso({ ...datos, tipo: 'otro' }).titulo).toBe('Nueva solicitud · Solicitud')
  })
})
