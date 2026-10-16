// src/lib/repositories/authRepository.ts

import type { AdminUser } from '../../types/domain'
import { getStorageItem, setStorageItem } from '../persistence'

export interface AuthRepository {
  getAdminList<T>(fallback: T): Promise<T>
  saveAdminList<T>(list: T): Promise<void>
  getCurrentSessionUser(): Promise<AdminUser | null>
  saveCurrentSessionUser(user: AdminUser | null): Promise<void>
  clearSession(): Promise<void>
}

export class LocalAuthRepository implements AuthRepository {
  async getAdminList<T>(fallback: T): Promise<T> {
    return getStorageItem('admin_list', fallback)
  }

  async saveAdminList<T>(list: T): Promise<void> {
    setStorageItem('admin_list', list)
  }

  async getCurrentSessionUser(): Promise<AdminUser | null> {
    return getStorageItem('admin_user', null)
  }

  async saveCurrentSessionUser(user: AdminUser | null): Promise<void> {
    setStorageItem('admin_user', user)
  }

  async clearSession(): Promise<void> {
    localStorage.removeItem('ltr_reserva_admin_user')
  }
}

export const authRepository: AuthRepository = new LocalAuthRepository()