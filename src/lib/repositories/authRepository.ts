// src/lib/repositories/authRepository.ts
// Administradores y sesión. AUTENTICACIÓN DE PROTOTIPO (contraseñas en texto plano en el navegador):
// con Supabase Auth (SCRUM-248) este repositorio desaparece.

import type { AdminUser, AdminUserWithPassword } from '../../types/domain'
import { DEFAULT_ADMINS } from '../../data/seed'
import type { Almacenamiento } from '../persistence'
import { almacenamientoLocal } from '../persistence'
import { ColeccionLocal } from './coleccionLocal'
import type { Repositorio } from './repositorio'

export interface AuthRepository {
  admins: Repositorio<AdminUserWithPassword>
  /** El administrador con sesión iniciada, o null. */
  getSession(): Promise<AdminUser | null>
  saveSession(usuario: AdminUser): Promise<void>
  clearSession(): Promise<void>
}

export class LocalAuthRepository implements AuthRepository {
  readonly admins: Repositorio<AdminUserWithPassword>
  private readonly almacenamiento: Almacenamiento

  constructor(almacenamiento: Almacenamiento = almacenamientoLocal) {
    this.almacenamiento = almacenamiento
    this.admins = new ColeccionLocal<AdminUserWithPassword>('admin_list', almacenamiento, {
      semilla: () => DEFAULT_ADMINS,
      entidad: 'el administrador'
    })
  }

  async getSession(): Promise<AdminUser | null> {
    return this.almacenamiento.leer<AdminUser | null>('admin_user', null)
  }

  async saveSession(usuario: AdminUser): Promise<void> {
    this.almacenamiento.escribir('admin_user', usuario)
  }

  async clearSession(): Promise<void> {
    this.almacenamiento.borrar('admin_user')
  }
}
