import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales, usarRepositorios } from '../src/lib/repositories'
import { LocalPreferenciasRepository } from '../src/lib/repositories/preferenciasRepository'
import { ESCALA_LETRA_GRANDE, escalaDeLetra, normalizarTamanoLetra } from '../src/services/preferencias'
import { usePreferenciasStore } from '../src/stores/preferenciasStore'
import { useAuthStore } from '../src/stores/authStore'
import { DEFAULT_ADMINS } from '../src/data/seed'

describe('tamaño de la letra (SCRUM-276)', () => {
  it('el tamaño inicial es normal y lo desconocido vuelve a normal', () => {
    expect(normalizarTamanoLetra(undefined)).toBe('normal')
    expect(normalizarTamanoLetra('enorme')).toBe('normal')
    expect(normalizarTamanoLetra('grande')).toBe('grande')
  })

  it('solo el administrador con sesión ve la letra grande: el cliente siempre ve la normal', () => {
    expect(escalaDeLetra('grande', true)).toBe(ESCALA_LETRA_GRANDE)
    expect(escalaDeLetra('grande', false)).toBe('')
    expect(escalaDeLetra('normal', true)).toBe('')
  })

  it('el repositorio guarda y lee la preferencia de este dispositivo', async () => {
    const repo = new LocalPreferenciasRepository(crearAlmacenamientoEnMemoria())
    expect(await repo.leerTamanoLetra()).toBe('normal')
    await repo.guardarTamanoLetra('grande')
    expect(await repo.leerTamanoLetra()).toBe('grande')
  })

  describe('store', () => {
    let mem: ReturnType<typeof crearAlmacenamientoEnMemoria>
    beforeEach(() => {
      mem = crearAlmacenamientoEnMemoria()
      usarRepositorios(crearRepositoriosLocales(mem))
      setActivePinia(createPinia())
    })

    it('empieza en normal, lo elegido se recuerda y la escala depende de la sesión', async () => {
      const prefs = usePreferenciasStore()
      await prefs.iniciar()
      expect(prefs.tamanoLetra).toBe('normal')

      await prefs.cambiarTamanoLetra('grande')
      expect(mem.leer('tamano_letra', 'normal')).toBe('grande')
      // Sin sesión de administrador no se agranda nada
      expect(prefs.escala).toBe('')

      useAuthStore().currentUser = { ...DEFAULT_ADMINS[0] }
      expect(prefs.escala).toBe(ESCALA_LETRA_GRANDE)

      await prefs.cambiarTamanoLetra('normal')
      expect(prefs.escala).toBe('')
    })

    it('en la zona del administrador (también sin sesión) vale la letra elegida, y fuera de ella no', async () => {
      const prefs = usePreferenciasStore()
      await prefs.iniciar()
      await prefs.cambiarTamanoLetra('grande')
      expect(prefs.escala).toBe('')
      prefs.definirAreaAdmin(true)
      expect(prefs.escala).toBe(ESCALA_LETRA_GRANDE)
      prefs.definirAreaAdmin(false)
      expect(prefs.escala).toBe('')
    })

    it('al abrir la app recupera lo que se eligió antes', async () => {
      mem.escribir('tamano_letra', 'grande')
      const prefs = usePreferenciasStore()
      await prefs.iniciar()
      expect(prefs.tamanoLetra).toBe('grande')
    })
  })
})
