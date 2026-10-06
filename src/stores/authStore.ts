import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin'
  createdAt: string
}

export interface AdminUserWithPassword extends AdminUser {
  passwordHash: string
}

export const useAuthStore = defineStore('auth', () => {
  // Cargar lista de administradores desde LocalStorage o usar valores por defecto
  const savedAdmins = JSON.parse(localStorage.getItem('ltr_admin_list') || 'null')
  
  const adminsList = ref<AdminUserWithPassword[]>(
    savedAdmins || [
      {
        id: 'usr-1',
        name: 'Dueño 1 (Principal)',
        email: 'dueno1@troncosderepil.cl',
        passwordHash: 'admin123',
        role: 'owner',
        createdAt: '2026-01-01'
      },
      {
        id: 'usr-2',
        name: 'Dueño 2 (Administración)',
        email: 'dueno2@troncosderepil.cl',
        passwordHash: 'admin123',
        role: 'owner',
        createdAt: '2026-01-01'
      }
    ]
  )

  // Estado del usuario autenticado en la sesión activa
  const currentUser = ref<AdminUser | null>(
    JSON.parse(localStorage.getItem('ltr_admin_user') || 'null')
  )
  const isLoading = ref(false)
  const authError = ref<string | null>(null)

  const isAuthenticated = computed(() => !!currentUser.value)

  function saveAdminsToStorage() {
    localStorage.setItem('ltr_admin_list', JSON.stringify(adminsList.value))
  }

  /**
   * Inicio de sesión asíncrono
   */
  async function login(email: string, passwordHash: string): Promise<boolean> {
    isLoading.value = true
    authError.value = null

    await new Promise(resolve => setTimeout(resolve, 500))

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
        localStorage.setItem('ltr_admin_user', JSON.stringify(sessionUser))
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
   * Registro de nuevo usuario administrador
   */
  async function register(
    name: string, 
    email: string, 
    passwordHash: string
  ): Promise<boolean> {
    isLoading.value = true
    authError.value = null

    await new Promise(resolve => setTimeout(resolve, 600))

    try {
      const normalizedEmail = email.toLowerCase().trim()
      const exists = adminsList.value.some(u => u.email.toLowerCase() === normalizedEmail)

      if (exists) {
        authError.value = 'Ya existe un administrador registrado con este correo electrónico.'
        isLoading.value = false
        return false
      }

      const todayDate: string = new Date().toISOString().substring(0, 10)

      const newAdmin: AdminUserWithPassword = {
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'admin',
        createdAt: todayDate
      }

      adminsList.value.push(newAdmin)
      saveAdminsToStorage()

      // Iniciar sesión automáticamente tras el registro exitoso
      const sessionUser: AdminUser = {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
        createdAt: newAdmin.createdAt
      }

      currentUser.value = sessionUser
      localStorage.setItem('ltr_admin_user', JSON.stringify(sessionUser))
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
  async function logout() {
    currentUser.value = null
    localStorage.removeItem('ltr_admin_user')
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
