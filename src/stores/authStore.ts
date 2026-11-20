// src/stores/authStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AdminUser, AdminUserWithPassword } from '../types/domain'
import { repositorios } from '../lib/repositories'
import { mensajeDeError, esErrorDeRed } from '../lib/errores'
import { avisarError } from '../lib/avisos'
import { useCambiosAdminStore } from './cambiosAdminStore'
import { cargarDatosDeAdministrador, descartarDatosDeAdministrador } from '../lib/arranque'

export type { AdminUser, AdminUserWithPassword }

export const MIN_CONTRASENA = 8

/** Estado de la carga de lo que solo ve el administrador (solicitudes y catálogo completo) tras iniciar sesión. */
export type EstadoDatosAdmin = 'listo' | 'cargando' | 'error'

// Con Supabase las contraseñas las guarda Supabase Auth y la sesión se mantiene sola entre visitas. Sin Supabase
// (desarrollo sin configurar y pruebas) queda la AUTENTICACIÓN DE PROTOTIPO: contraseñas en texto plano en el
// navegador, solo para una demo cerrada.

export const useAuthStore = defineStore('auth', () => {
  const adminsList = ref<AdminUser[]>([])
  const currentUser = ref<AdminUser | null>(null)

  const isLoading = ref(false)
  const authError = ref<string | null>(null)
  /** Tras el inicio de sesión el panel se abre de inmediato y estos datos llegan por detrás (SCRUM-258). */
  const datosAdmin = ref<EstadoDatosAdmin>('listo')
  const errorDatosAdmin = ref<string | null>(null)
  const isAuthenticated = computed(() => !!currentUser.value)

  /** Carga a los administradores y la sesión guardada. Se llama una vez al arrancar la app. */
  async function init(): Promise<void> {
    const repo = repositorios().auth
    try {
      currentUser.value = await repo.getSession()
      adminsList.value = await repo.listarAdmins()
    } catch (e) {
      // Sin señal al abrir la app no se puede verificar la sesión: se sigue como público y el cliente puede usar
      // la copia guardada y enviar solicitudes (SCRUM-250). Cualquier otro error sigue siendo grave.
      if (!esErrorDeRed(e)) throw e
      console.warn('[Auth] Sin conexión al abrir: no se pudo verificar la sesión.', e)
    }
  }

  /**
   * Inicio de sesión asíncrono
   */
  async function login(email: string, contrasena: string): Promise<boolean> {
    isLoading.value = true
    authError.value = null

    try {
      const usuario = await repositorios().auth.iniciarSesion(email, contrasena)
      if (!usuario) {
        authError.value = 'Correo o contraseña incorrectos. Revisa las credenciales.'
        return false
      }
      currentUser.value = usuario
      adminsList.value = await repositorios().auth.listarAdmins()
      // El administrador ve lo que el público no: todas las solicitudes y el catálogo completo. No se espera:
      // el panel se abre con esqueletos y los datos llegan por detrás
      void cargarDatosAdmin()
      return true
    } catch (e) {
      authError.value = mensajeDeError(e, 'Ocurrió un error inesperado al intentar iniciar sesión.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /** Carga lo que solo ve el administrador. Si falla, el panel lo dice y deja reintentar con esta misma función. */
  async function cargarDatosAdmin(): Promise<void> {
    datosAdmin.value = 'cargando'
    errorDatosAdmin.value = null
    try {
      await cargarDatosDeAdministrador()
      datosAdmin.value = 'listo'
    } catch (e) {
      errorDatosAdmin.value = mensajeDeError(e, 'No se pudieron cargar las solicitudes.')
      datosAdmin.value = 'error'
    }
  }

  /**
   * Alta de un nuevo administrador. Solo la puede hacer quien ya inició sesión, y no cambia
   * la sesión actual: quien la crea sigue siendo el mismo usuario.
   */
  async function register(
    name: string,
    email: string,
    contrasena: string
  ): Promise<boolean> {
    isLoading.value = true
    authError.value = null

    if (!currentUser.value) {
      authError.value = 'Solo un administrador con sesión iniciada puede crear otras cuentas.'
      isLoading.value = false
      return false
    }
    if (contrasena.length < MIN_CONTRASENA) {
      authError.value = `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`
      isLoading.value = false
      return false
    }

    try {
      const normalizedEmail = email.toLowerCase().trim()
      if (adminsList.value.some(u => u.email.toLowerCase() === normalizedEmail)) {
        authError.value = 'Ya existe un administrador registrado con este correo electrónico.'
        return false
      }
      const nuevo = await repositorios().auth.crearAdmin(name, normalizedEmail, contrasena)
      adminsList.value = [...adminsList.value, nuevo]
      return true
    } catch (e) {
      authError.value = mensajeDeError(e, 'Error al registrar el nuevo usuario administrador.')
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Cierre de sesión
   */
  async function logout(): Promise<boolean> {
    // Al cerrar sesión se olvidan los datos del administrador: los cambios sin enviar se perderían (SCRUM-250)
    const sinEnviar = useCambiosAdminStore().pendientes.length
    if (sinEnviar > 0) {
      avisarError(`Tienes ${sinEnviar} ${sinEnviar === 1 ? 'cambio' : 'cambios'} sin sincronizar. Conéctate a internet y espera a que se envíen antes de cerrar sesión.`)
      return false
    }
    try {
      await repositorios().auth.cerrarSesion()
    } finally {
      currentUser.value = null
      adminsList.value = []
      datosAdmin.value = 'listo'
      errorDatosAdmin.value = null
      await descartarDatosDeAdministrador()
    }
    return true
  }

  return {
    adminsList,
    currentUser,
    isLoading,
    authError,
    datosAdmin,
    errorDatosAdmin,
    isAuthenticated,
    init,
    cargarDatosAdmin,
    login,
    register,
    logout
  }
})
