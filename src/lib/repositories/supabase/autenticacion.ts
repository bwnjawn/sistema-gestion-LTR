// src/lib/repositories/supabase/autenticacion.ts
// Administradores con Supabase Auth: las contraseñas las guarda Supabase, no la app. Un usuario es administrador
// si tiene una fila en `perfiles_admin` (con su rol); sin ella, aunque la contraseña sea correcta, no entra.

import type { AdminUser } from '../../../types/domain'
import { ErrorDeAlmacenamiento } from '../../errores'
import { supabase } from '../../supabase'
import type { AuthRepository } from '../authRepository'
import { datosOLanzar, traducirError } from './errores'

interface FilaPerfil {
  id: string
  nombre: string | null
  rol: AdminUser['role']
  correo: string | null
  creado_en: string
}

function usuarioDePerfil(p: FilaPerfil, correoDeSesion?: string): AdminUser {
  return {
    id: p.id,
    email: p.correo ?? correoDeSesion ?? '',
    ...(p.nombre ? { name: p.nombre } : {}),
    role: p.rol,
    createdAt: p.creado_en.slice(0, 10)
  }
}

export class SupabaseAuthRepository implements AuthRepository {
  /** El perfil de administrador de un usuario, o null si es un usuario sin permiso de administrador. */
  private async perfil(id: string, correo?: string): Promise<AdminUser | null> {
    const fila = datosOLanzar(
      await supabase().from('perfiles_admin').select('id, nombre, rol, correo, creado_en').eq('id', id).maybeSingle(),
      'No se pudo verificar la cuenta.'
    ) as FilaPerfil | null
    return fila ? usuarioDePerfil(fila, correo) : null
  }

  async listarAdmins(): Promise<AdminUser[]> {
    const { data } = await supabase().auth.getSession()
    if (!data.session) return []
    const filas = datosOLanzar(
      await supabase().from('perfiles_admin').select('id, nombre, rol, correo, creado_en').order('creado_en'),
      'No se pudo cargar a los administradores.'
    ) as FilaPerfil[]
    return filas.map(f => usuarioDePerfil(f))
  }

  async iniciarSesion(email: string, contrasena: string): Promise<AdminUser | null> {
    const { data, error } = await supabase().auth.signInWithPassword({ email: email.trim(), password: contrasena })
    if (error) {
      // 400: el correo o la contraseña no son correctos
      if (error.status === 400 || /invalid login credentials/i.test(error.message)) return null
      throw traducirError(error, 'No se pudo iniciar sesión. Inténtalo de nuevo.')
    }
    const usuario = await this.perfil(data.user.id, data.user.email ?? undefined)
    if (!usuario) {
      await supabase().auth.signOut()
      throw new ErrorDeAlmacenamiento('desconocida', 'Esta cuenta no tiene permiso de administrador.')
    }
    return usuario
  }

  async getSession(): Promise<AdminUser | null> {
    const { data } = await supabase().auth.getSession()
    const usuario = data.session?.user
    if (!usuario) return null
    const perfil = await this.perfil(usuario.id, usuario.email ?? undefined)
    if (!perfil) {
      await supabase().auth.signOut()
      return null
    }
    return perfil
  }

  async cerrarSesion(): Promise<void> {
    const { error } = await supabase().auth.signOut()
    if (error) throw traducirError(error, 'No se pudo cerrar la sesión.')
  }

  async crearAdmin(): Promise<AdminUser> {
    // Crear una cuenta exige permisos que el navegador no debe tener (clave secreta de Supabase)
    throw new ErrorDeAlmacenamiento(
      'desconocida',
      'Por ahora los administradores se crean desde el panel de Supabase (Authentication > Users). Pronto se podrá hacer desde aquí.'
    )
  }
}
