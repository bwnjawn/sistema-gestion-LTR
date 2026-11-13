// src/stores/authStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AdminUser, AdminUserWithPassword } from '../types/domain'
import { generateUUID } from '../lib/id'
import { todayISO } from '../lib/dates'
import { repositorios } from '../lib/repositories'
import { persistirConReversion } from '../lib/persistirConReversion'
import { mensajeDeError } from '../lib/errores'

export type { AdminUser, AdminUserWithPassword }

export const MIN_CONTRASENA = 8

// AUTENTICACIÓN DE PROTOTIPO: las contraseñas se guardan en texto plano en el navegador y
// viajan dentro del código. Sirve para una demo cerrada; la autenticación real llega con
// Supabase Auth (SCRUM-248), que reemplaza este store. No reutilices aquí una contraseña
// que uses en otro sitio.

export const useAuthStore = defineStore('auth', () => {
  const adminsList = ref<AdminUserWithPassword[]>([])
  const currentUser = ref<AdminUser | null>(null)

  const isLoading = ref(false)
  const authError = ref<string | null>(null)
  const isAuthenticated = computed(() => !!currentUser.value)

  /** Carga los administradores y la sesión guardada. Se llama una vez al arrancar la app. */
  async function init(): Promise<void> {
    const repo = repositorios().auth
    adminsList.value = await repo.admins.list()
    const sesion = await repo.getSession()
    // La sesión de un administrador que ya no existe se cierra.
    if (sesion && !adminsList.value.some(a => a.id === sesion.id)) {
      currentUser.value = null
      await repo.clearSession()
    } else {
      currentUser.value = sesion
    }
  }

  /**
   * Inicio de sesión asíncrono
   */
  async function login(email: string, passwordHash: string): Promise<boolean> {
    isLoading.value = true
    authError.value = null
    await new Promise(resolve => setTimeout(resolve, 300))

    try {
      const foundUser = adminsList.value.find(
        u => u.email.toLowerCase() === email.toLowerCase().trim() && u.passwordHash === passwordHash
      )

      if (foundUser) {
        const sessionUser: AdminUser = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.role,
          createdAt: foundUser.createdAt
        }
        await persistirConReversion({
          aplicar: () => { currentUser.value = sessionUser },
          revertir: () => { currentUser.value = null },
          persistir: () => repositorios().auth.saveSession(sessionUser),
          mensaje: 'No se pudo guardar la sesión.'
        })
        isLoading.value = false
        return true
      } else {
        authError.value = 'Correo o contraseña incorrectos. Revisa las credenciales.'
        isLoading.value = false
        return false
      }
    } catch (e) {
      authError.value = mensajeDeError(e, 'Ocurrió un error inesperado al intentar iniciar sesión.')
      isLoading.value = false
      return false
    }
  }

  /**
   * Alta de un nuevo administrador. Solo la puede hacer quien ya inició sesión, y no cambia
   * la sesión actual: quien la crea sigue siendo el mismo usuario.
   */
  async function register(
    name: string,
    email: string,
    passwordHash: string
  ): Promise<boolean> {
    isLoading.value = true
    authError.value = null

    if (!currentUser.value) {
      authError.value = 'Solo un administrador con sesión iniciada puede crear otras cuentas.'
      isLoading.value = false
      return false
    }
    if (passwordHash.length < MIN_CONTRASENA) {
      authError.value = `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`
      isLoading.value = false
      return false
    }

    await new Promise(resolve => setTimeout(resolve, 400))

    try {
      const normalizedEmail = email.toLowerCase().trim()
      const exists = adminsList.value.some(u => u.email.toLowerCase() === normalizedEmail)

      if (exists) {
        authError.value = 'Ya existe un administrador registrado con este correo electrónico.'
        isLoading.value = false
        return false
      }

      const todayDate: string = todayISO()
      const newAdmin: AdminUserWithPassword = {
        id: generateUUID(),
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
        createdAt: todayDate
      }

      await persistirConReversion({
        aplicar: () => { adminsList.value.push(newAdmin) },
        revertir: () => { adminsList.value = adminsList.value.filter(a => a.id !== newAdmin.id) },
        persistir: () => repositorios().auth.admins.create(newAdmin),
        mensaje: 'No se pudo registrar al administrador.'
      })
      isLoading.value = false
      return true
    } catch (e) {
      authError.value = mensajeDeError(e, 'Error al registrar el nuevo usuario administrador.')
      isLoading.value = false
      return false
    }
  }

  /**
   * Cierre de sesión
   */
  async function logout(): Promise<void> {
    currentUser.value = null
    await repositorios().auth.clearSession()
  }

  return {
    adminsList,
    currentUser,
    isLoading,
    authError,
    isAuthenticated,
    init,
    login,
    register,
    logout
  }
})