// src/lib/repositories/supabase/autenticacion.ts
// Administradores con Supabase Auth: las contraseñas las guarda Supabase, no la app. Un usuario es administrador
// si tiene una fila en `perfiles_admin` (con su rol); sin ella, aunque la contraseña sea correcta, no entra.

import type { AdminUser } from '../../../types/domain'
import { borrarSinConexion, guardarSinConexion, leerSinConexion } from '../../almacenSinConexion'
import { conTiempoLimite } from '../../conTiempoLimite'
import { ErrorDeAlmacenamiento, esErrorDeRed } from '../../errores'
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

const CLAVE_PERFIL = 'admin_perfil'
/** Renovar una sesión caducada sin señal puede tardar más de 25 s: se espera poco y se sigue con lo guardado. */
const TIEMPO_SESION_MS = 4000

/** Hay una sesión guardada en el navegador (supabase-js la borra si el servidor la rechaza de verdad). */
function haySesionGuardada(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i) ?? ''
      if (/^sb-.+-auth-token$/.test(clave)) return true
    }
  } catch {
    // sin acceso al almacenamiento del navegador
  }
  return false
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
    // Sin señal esta consulta puede quedar esperando la renovación de la sesión: se corta pronto (SCRUM-250)
    const { data } = await conTiempoLimite(supabase().auth.getSession(), TIEMPO_SESION_MS)
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
    void guardarSinConexion(CLAVE_PERFIL, usuario).catch(() => {})
    return usuario
  }

  /**
   * El administrador de la sesión guardada. Sin señal (SCRUM-250) no se puede verificar en el servidor: si hubo un
   * administrador con sesión en este dispositivo, se sigue con su perfil guardado y se trabaja con la copia local;
   * los cambios se envían al volver la conexión, ya con la sesión renovada.
   */
  async getSession(): Promise<AdminUser | null> {
    let usuario: { id: string; email?: string | null } | undefined
    try {
      const { data } = await conTiempoLimite(supabase().auth.getSession(), TIEMPO_SESION_MS)
      usuario = data.session?.user
    } catch (e) {
      if (!esErrorDeRed(e)) throw e
      return this.perfilSinConexion()
    }
    // Sin sesión utilizable pero con una guardada: no se pudo renovar por falta de señal
    if (!usuario) return haySesionGuardada() ? this.perfilSinConexion() : null
    let perfil: AdminUser | null
    try {
      perfil = await this.perfil(usuario.id, usuario.email ?? undefined)
    } catch (e) {
      if (!esErrorDeRed(e)) throw e
      return this.perfilSinConexion()
    }
    if (!perfil) {
      await supabase().auth.signOut()
      await borrarSinConexion(CLAVE_PERFIL)
      return null
    }
    void guardarSinConexion(CLAVE_PERFIL, perfil).catch(() => {})
    return perfil
  }

  private async perfilSinConexion(): Promise<AdminUser | null> {
    if (!haySesionGuardada()) return null
    return (await leerSinConexion<AdminUser>(CLAVE_PERFIL)) ?? null
  }

  async cerrarSesion(): Promise<void> {
    await borrarSinConexion(CLAVE_PERFIL)
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
