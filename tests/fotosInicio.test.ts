import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales, usarRepositorios } from '../src/lib/repositories'
import { descartarAviso } from '../src/lib/avisos'
import { useSettingsStore } from '../src/stores/settingsStore'
import { FOTOS_INICIO_ORIGINALES, FOTOS_INICIO_VACIAS, TARJETAS_INICIO, fotoDeInicio, tieneFotoPropia } from '../src/services/fotosInicio'

let mem: ReturnType<typeof crearAlmacenamientoEnMemoria>

function preparar(inicial: Record<string, unknown> = {}) {
  mem = crearAlmacenamientoEnMemoria(inicial)
  usarRepositorios(crearRepositoriosLocales(mem))
  setActivePinia(createPinia())
  descartarAviso()
}

describe('fotos del inicio — servicio (SCRUM-271)', () => {
  it('hay una foto provisoria para cada una de las cinco tarjetas', () => {
    expect(TARJETAS_INICIO.map(t => t.clave)).toEqual(['cabana', 'camping', 'restaurante', 'piscina', 'evento'])
    for (const { clave } of TARJETAS_INICIO) expect(FOTOS_INICIO_ORIGINALES[clave]).toMatch(/^https:/)
  })

  it('sin foto subida (o vacía) se usa la provisoria', () => {
    expect(fotoDeInicio(undefined, 'cabana')).toBe(FOTOS_INICIO_ORIGINALES.cabana)
    expect(fotoDeInicio(FOTOS_INICIO_VACIAS, 'camping')).toBe(FOTOS_INICIO_ORIGINALES.camping)
    expect(fotoDeInicio({ piscina: '   ' }, 'piscina')).toBe(FOTOS_INICIO_ORIGINALES.piscina)
    expect(tieneFotoPropia(FOTOS_INICIO_VACIAS, 'cabana')).toBe(false)
  })

  it('con foto subida se usa esa', () => {
    expect(fotoDeInicio({ evento: 'data:image/jpeg;base64,AAA' }, 'evento')).toBe('data:image/jpeg;base64,AAA')
    expect(tieneFotoPropia({ evento: 'data:image/jpeg;base64,AAA' }, 'evento')).toBe(true)
  })
})

describe('fotos del inicio — store', () => {
  beforeEach(() => preparar())

  it('al comienzo todas las tarjetas muestran la foto provisoria', async () => {
    const store = useSettingsStore()
    await store.init()
    for (const { clave } of TARJETAS_INICIO) expect(store.fotoInicio(clave)).toBe(FOTOS_INICIO_ORIGINALES[clave])
  })

  it('cambiar la foto de una tarjeta solo afecta a esa y queda guardada', async () => {
    const store = useSettingsStore()
    await store.init()
    expect(await store.cambiarFotoInicio('camping', 'data:image/jpeg;base64,XYZ')).toBeNull()
    expect(store.fotoInicio('camping')).toBe('data:image/jpeg;base64,XYZ')
    expect(store.fotoInicio('cabana')).toBe(FOTOS_INICIO_ORIGINALES.cabana)
    expect(mem.leer<any>('fotos_inicio', null).camping).toBe('data:image/jpeg;base64,XYZ')
  })

  it('"Volver a la original" restaura la provisoria', async () => {
    const store = useSettingsStore()
    await store.init()
    await store.cambiarFotoInicio('piscina', 'data:image/jpeg;base64,XYZ')
    expect(await store.cambiarFotoInicio('piscina', '')).toBeNull()
    expect(store.fotoInicio('piscina')).toBe(FOTOS_INICIO_ORIGINALES.piscina)
  })

  it('lo guardado antes de tener las cinco claves se completa', async () => {
    preparar({ fotos_inicio: { cabana: 'data:image/jpeg;base64,AAA' } })
    const store = useSettingsStore()
    await store.init()
    expect(store.fotoInicio('cabana')).toBe('data:image/jpeg;base64,AAA')
    expect(store.fotoInicio('evento')).toBe(FOTOS_INICIO_ORIGINALES.evento)
  })

  it('si no se puede guardar, la foto anterior sigue y devuelve el error', async () => {
    const store = useSettingsStore()
    await store.init()
    mem.estado.fallar = true
    const mensaje = await store.cambiarFotoInicio('cabana', 'data:image/jpeg;base64,XYZ')
    expect(mensaje).toBeTruthy()
    expect(store.fotoInicio('cabana')).toBe(FOTOS_INICIO_ORIGINALES.cabana)
  })
})
