// src/stores/authStore.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AdminUser } from '../types/domain'
import { generateUUID } from '../lib/id'
import { todayISO } from '../lib/dates'
import { authRepository } from '../lib/repositories/authRepository'
import { getStorageItem, setStorageItem } from '../lib/persistence'

export type { AdminUser }

export const MIN_CONTRASENA = 8

export interface AdminUserWithPassword extends AdminUser {
  passwordHash: string
}

// AUTENTICACIÓN DE PROTOTIPO: las contraseñas se guardan en texto plano en el navegador y
// viajan dentro del código. Sirve para una demo cerrada; la autenticación real llega con
// Supabase Auth (SCRUM-248). No reutilices aquí una contraseña que uses en otro sitio.
const CONTRASENA_ANTIGUA = 'admin123'

const DEFAULT_ADMINS: AdminUserWithPassword[] = [
  {
    id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380c11',
    name: 'Dueño 1 (Principal)',
    email: 'dueno1@troncosderepil.cl',
    passwordHash: 'UucfZdqLKjRD',
    role: 'owner',
    createdAt: '2026-01-01'
  },
  {
    id: 'f2eebc99-9c0b-4ef8-bb6d-6bb9bd380c22',
    name: 'Dueño 2 (Administración)',
    email: 'dueno2@troncosderepil.cl',
    passwordHash: 'i64CA7dk9MaM',
    role: 'owner',
    createdAt: '2026-01-01'
  }
]

/**
 * Los administradores guardados con la contraseña antigua de ejemplo se descartan y se
 * reponen los de fábrica, para que ningún navegador conserve el acceso con 'admin123'.
 */
function sinContrasenaAntigua(lista: AdminUserWithPassword[]): AdminUserWithPassword[] {
  const vigentes = lista.filter(a => a.passwordHash !== CONTRASENA_ANTIGUA)
  const faltantes = DEFAULT_ADMINS.filter(d => !vigentes.some(a => a.id === d.id))
  return [...faltantes, ...vigentes]
}

export const useAuthStore = defineStore('auth', () => {
  const adminsList = ref<AdminUserWithPassword[]>(
    sinContrasenaAntigua(getStorageItem('admin_list', DEFAULT_ADMINS))
  )

  const currentUser = ref<AdminUser | null>(
    getStorageItem('admin_user', null)
  )

  const isLoading = ref(false)
  const authError = ref<string | null>(null)
  const isAuthenticated = computed(() => !!currentUser.value)

  function saveAdminsToStorage(): void {
    setStorageItem('admin_list', adminsList.value)
  }

  // Deja guardada la lista ya depurada (sin la contraseña antigua).
  saveAdminsToStorage()

  // La sesión de un administrador que ya no existe se cierra.
  if (currentUser.value && !adminsList.value.some(a => a.id === currentUser.value!.id)) {
    currentUser.value = null
    void authRepository.clearSession()
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
        currentUser.value = sessionUser
        await authRepository.saveCurrentSessionUser(sessionUser)
        isLoading.value = false
        return true
      } else {
        authError.value = 'Correo o contraseña incorrectos. Revisa las credenciales.'
        isLoading.value = false
        return false
      }
    } catch (e) {
      authError.value = 'Ocurrió un error inesperado al intentar iniciar sesión.'
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

      adminsList.value.push(newAdmin)
      saveAdminsToStorage()
      isLoading.value = false
      return true
    } catch (e) {
      authError.value = 'Error al registrar el nuevo usuario administrador.'
      isLoading.value = false
      return false
    }
  }

  /**
   * Cierre de sesión
   */
  async function logout(): Promise<void> {
    currentUser.value = null
    await authRepository.clearSession()
  }

  return {
    adminsList,
    currentUser,
    isLoading,
    authError,
    isAuthenticated,
    login,
    register,
    logout
  }
})