// src/lib/repositories/authRepository.ts
// Administradores y sesión. Con Supabase (SCRUM-248) es Supabase Auth (ver ./supabase/autenticacion.ts). La versión
// local es AUTENTICACIÓN DE PROTOTIPO (contraseñas en texto plano en el navegador) y solo se usa sin Supabase:
// en desarrollo sin `.env` y en las pruebas.

import type { AdminUser, AdminUserWithPassword } from '../../types/domain'
import { DEFAULT_ADMINS } from '../../data/seed'
import { generateUUID } from '../id'
import { todayISO } from '../dates'
import type { Almacenamiento } from '../persistence'
import { almacenamientoLocal } from '../persistence'
import { ColeccionLocal } from './coleccionLocal'

export interface AuthRepository {
  /** Los administradores. Con Supabase, sin sesión de administrador la lista llega vacía. */
  listarAdmins(): Promise<AdminUser[]>
  /** Inicia sesión. Devuelve el administrador, o null si el correo o la contraseña no son correctos. */
  iniciarSesion(email: string, contrasena: string): Promise<AdminUser | null>
  /** El administrador con sesión iniciada, o null. */
  getSession(): Promise<AdminUser | null>
  cerrarSesion(): Promise<void>
  /** Da de alta a un administrador. */
  crearAdmin(nombre: string, email: string, contrasena: string): Promise<AdminUser>
}

function sinContrasena(a: AdminUserWithPassword): AdminUser {
  return { id: a.id, name: a.name, email: a.email, role: a.role, createdAt: a.createdAt }
}

export class LocalAuthRepository implements AuthRepository {
  private readonly admins: ColeccionLocal<AdminUserWithPassword>
  private readonly almacenamiento: Almacenamiento

  constructor(almacenamiento: Almacenamiento = almacenamientoLocal) {
    this.almacenamiento = almacenamiento
    this.admins = new ColeccionLocal<AdminUserWithPassword>('admin_list', almacenamiento, {
      semilla: () => DEFAULT_ADMINS,
      entidad: 'el administrador'
    })
  }

  async listarAdmins(): Promise<AdminUser[]> {
    return (await this.admins.list()).map(sinContrasena)
  }

  async iniciarSesion(email: string, contrasena: string): Promise<AdminUser | null> {
    const normalizado = email.toLowerCase().trim()
    const encontrado = (await this.admins.list()).find(u => u.email.toLowerCase() === normalizado && u.passwordHash === contrasena)
    if (!encontrado) return null
    const usuario = sinContrasena(encontrado)
    this.almacenamiento.escribir('admin_user', usuario)
    return usuario
  }

  async getSession(): Promise<AdminUser | null> {
    const sesion = this.almacenamiento.leer<AdminUser | null>('admin_user', null)
    // La sesión de un administrador que ya no existe se cierra
    if (sesion && !(await this.admins.list()).some(a => a.id === sesion.id)) {
      this.almacenamiento.borrar('admin_user')
      return null
    }
    return sesion
  }

  async cerrarSesion(): Promise<void> {
    this.almacenamiento.borrar('admin_user')
  }

  async crearAdmin(nombre: string, email: string, contrasena: string): Promise<AdminUser> {
    const nuevo: AdminUserWithPassword = {
      id: generateUUID(),
      name: nombre.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: contrasena,
      role: 'admin',
      createdAt: todayISO()
    }
    await this.admins.create(nuevo)
    return sinContrasena(nuevo)
  }
}
