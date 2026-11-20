import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { effectScope, nextTick, ref } from 'vue'
import { crearAlmacenamientoEnMemoria } from '../src/lib/persistence'
import { crearRepositoriosLocales, usarRepositorios, type Repositorios } from '../src/lib/repositories'
import { ErrorDeAlmacenamiento } from '../src/lib/errores'
import { ESPERA_AVISO_CARGA_MS, useAvisoDeEspera } from '../src/lib/avisoDeEspera'
import { useAuthStore } from '../src/stores/authStore'
import { useRequestsStore } from '../src/stores/requestsStore'

describe('el aviso de espera de 8 segundos (SCRUM-258)', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('espera 8 segundos antes de decir que tarda, y solo mientras carga', async () => {
    const cargando = ref(true)
    const scope = effectScope()
    const { tardando } = scope.run(() => useAvisoDeEspera(cargando))!
    vi.advanceTimersByTime(ESPERA_AVISO_CARGA_MS - 100)
    expect(tardando.value).toBe(false)
    vi.advanceTimersByTime(200)
    expect(tardando.value).toBe(true)
    cargando.value = false
    await nextTick()
    expect(tardando.value).toBe(false)
    scope.stop()
  })

  it('una carga nueva (Reintentar) vuelve a contar desde cero', async () => {
    const cargando = ref(true)
    const scope = effectScope()
    const { tardando } = scope.run(() => useAvisoDeEspera(cargando))!
    vi.advanceTimersByTime(ESPERA_AVISO_CARGA_MS + 1)
    expect(tardando.value).toBe(true)
    cargando.value = false
    await nextTick()
    cargando.value = true
    await nextTick()
    expect(tardando.value).toBe(false)
    vi.advanceTimersByTime(ESPERA_AVISO_CARGA_MS - 100)
    expect(tardando.value).toBe(false)
    vi.advanceTimersByTime(200)
    expect(tardando.value).toBe(true)
    scope.stop()
  })

  it('al cerrarse la vista no queda el reloj corriendo', () => {
    const scope = effectScope()
    const { tardando } = scope.run(() => useAvisoDeEspera(ref(true)))!
    scope.stop()
    vi.advanceTimersByTime(ESPERA_AVISO_CARGA_MS * 2)
    expect(tardando.value).toBe(false)
  })
})

describe('tras iniciar sesión el panel se abre y los datos llegan por detrás (SCRUM-258)', () => {
  let repos: Repositorios
  let fallar: boolean
  let liberar: (() => void) | null

  beforeEach(() => {
    fallar = false
    liberar = null
    const base = crearRepositoriosLocales(crearAlmacenamientoEnMemoria())
    repos = {
      ...base,
      requests: Object.assign(Object.create(base.requests), {
        list: () =>
          new Promise((resolver, rechazar) => {
            liberar = () => (fallar ? rechazar(new ErrorDeAlmacenamiento('red', 'Sin conexión.')) : resolver(base.requests.list()))
          })
      })
    }
    usarRepositorios(repos)
    setActivePinia(createPinia())
  })

  const entrar = () => useAuthStore().login('dueno1@troncosderepil.cl', 'UucfZdqLKjRD')

  it('login responde antes de tener los datos y el estado pasa de cargando a listo', async () => {
    const auth = useAuthStore()
    expect(auth.datosAdmin).toBe('listo')
    expect(await entrar()).toBe(true)
    expect(auth.datosAdmin).toBe('cargando')
    await vi.waitFor(() => expect(liberar).not.toBeNull())
    liberar!()
    await vi.waitFor(() => expect(auth.datosAdmin).toBe('listo'))
    expect(useRequestsStore().isReady).toBe(true)
  })

  it('si la carga falla queda en error con el motivo, y Reintentar la vuelve a pedir', async () => {
    const auth = useAuthStore()
    fallar = true
    await entrar()
    await vi.waitFor(() => expect(liberar).not.toBeNull())
    liberar!()
    await vi.waitFor(() => expect(auth.datosAdmin).toBe('error'))
    expect(auth.errorDatosAdmin).toBeTruthy()
    expect(auth.isAuthenticated).toBe(true)

    fallar = false
    liberar = null
    const reintento = auth.cargarDatosAdmin()
    expect(auth.datosAdmin).toBe('cargando')
    expect(auth.errorDatosAdmin).toBeNull()
    await vi.waitFor(() => expect(liberar).not.toBeNull())
    liberar!()
    await reintento
    expect(auth.datosAdmin).toBe('listo')
  })

  it('cerrar sesión deja el estado limpio', async () => {
    const auth = useAuthStore()
    fallar = true
    await entrar()
    await vi.waitFor(() => expect(liberar).not.toBeNull())
    liberar!()
    await vi.waitFor(() => expect(auth.datosAdmin).toBe('error'))
    await auth.logout()
    expect(auth.datosAdmin).toBe('listo')
    expect(auth.errorDatosAdmin).toBeNull()
  })
})
