// src/lib/migrarDatosLocales.ts
// Lleva lo guardado en el navegador con formatos anteriores al formato actual, UNA vez al arrancar y antes de
// que los repositorios lean. Así el resto del código solo conoce el formato vigente: no hay parches por
// valores antiguos ('cabaña', 'confirmada', 'pendiente'…) repartidos por la app (SCRUM-246).
//
// Solo existe para el almacenamiento local. En Supabase los datos nacen en el formato vigente.
// Es idempotente: si no hay nada que migrar, no escribe nada.

import { DEFAULT_ADMINS } from '../data/seed'
import { DEFAULT_CONTACT, DEFAULT_TRANSFER } from '../data/ajustesPorDefecto'
import { migrarIdsPlatos } from '../services/migracionIds'
import { normalizarCabana, normalizarLista, normalizarPlato, normalizarSitio } from '../services/migracionCatalogo'
import { normalizeRequest } from '../services/requests'
import type { AdminUser, AdminUserWithPassword, BusinessInfo, Cabin, CampingSite, Dish, ReservationRequest, TransferInfo } from '../types/domain'
import { almacenamientoLocal, type Almacenamiento } from './persistence'

const CONTRASENA_ANTIGUA = 'admin123'

// Valores de fábrica anteriores del contacto (mapa con coordenadas erróneas y sitio antiguo): si el navegador
// los tiene guardados, se reemplazan por los actuales. Lo que el admin editó a mano no se toca.
const CONTACTO_ANTIGUO: Partial<BusinessInfo> = {
  mapsUrl: 'https://maps.google.com/?q=-41.1500,-73.4167',
  iframeMapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30000!2d73.4167!3d41.1500',
  websiteUrl: 'https://www.lostroncosderepil.cl',
  phone2: '+56 9 9588 3385'
}

export function migrarContacto(guardado: BusinessInfo): BusinessInfo {
  const migrado = { ...guardado }
  if (migrado.mapsUrl === CONTACTO_ANTIGUO.mapsUrl) migrado.mapsUrl = DEFAULT_CONTACT.mapsUrl
  if (migrado.iframeMapUrl?.startsWith(CONTACTO_ANTIGUO.iframeMapUrl as string)) migrado.iframeMapUrl = DEFAULT_CONTACT.iframeMapUrl
  if (migrado.websiteUrl === CONTACTO_ANTIGUO.websiteUrl) {
    migrado.websiteUrl = DEFAULT_CONTACT.websiteUrl
    migrado.websiteDisplay = DEFAULT_CONTACT.websiteDisplay
  }
  if (migrado.phone2 === CONTACTO_ANTIGUO.phone2) migrado.phone2 = DEFAULT_CONTACT.phone2
  return migrado
}

/**
 * Los administradores guardados con la contraseña antigua de ejemplo se descartan y se reponen los de
 * fábrica, para que ningún navegador conserve el acceso con 'admin123'.
 */
export function sinContrasenaAntigua(lista: AdminUserWithPassword[]): AdminUserWithPassword[] {
  const vigentes = lista.filter(a => a.passwordHash !== CONTRASENA_ANTIGUA)
  const faltantes = DEFAULT_ADMINS.filter(d => !vigentes.some(a => a.id === d.id))
  return [...faltantes, ...vigentes]
}

export interface ResultadoMigracion {
  /** Claves que se reescribieron porque tenían un formato antiguo. */
  cambios: string[]
}

export function migrateLegacyData(almacenamiento: Almacenamiento = almacenamientoLocal): ResultadoMigracion {
  const cambios: string[] = []

  /** Lee la clave, la transforma y la vuelve a guardar solo si cambió. No crea claves que no existen. */
  function migrar<T>(clave: string, transformar: (valor: T) => T): void {
    if (!almacenamiento.existe(clave)) return
    const guardado = almacenamiento.leer<T | null>(clave, null)
    if (guardado === null) return
    const nuevo = transformar(guardado)
    if (JSON.stringify(nuevo) === JSON.stringify(guardado)) return
    almacenamiento.escribir(clave, nuevo)
    cambios.push(clave)
  }

  // Solicitudes: tipos y estados antiguos, `depositAmount`, `extraPaid`, fechas dentro de `details`, id de platos
  migrar<ReservationRequest[]>('requests', lista => lista.map(normalizeRequest))

  // Catálogo (SCRUM-245 y 247)
  migrar<Cabin[]>('cabins', lista => normalizarLista(lista, normalizarCabana))
  migrar<CampingSite[]>('camping_sites', lista => normalizarLista(lista, normalizarSitio))
  migrar<Dish[]>('dishes', lista => normalizarLista(migrarIdsPlatos(lista), normalizarPlato))

  // Acompañamientos globales: antes el repositorio escribía `global_side_dishes` y el store `global_sides`.
  // Los datos reales siempre estuvieron en `global_sides`; la otra clave era una copia sin uso.
  if (almacenamiento.existe('global_side_dishes')) {
    almacenamiento.borrar('global_side_dishes')
    cambios.push('global_side_dishes')
  }

  // Ajustes
  migrar<BusinessInfo>('contact_info', migrarContacto)
  migrar<TransferInfo>('transfer_info', guardado => ({ ...DEFAULT_TRANSFER, ...guardado }))

  // Administradores: fuera la contraseña antigua; una sesión de un administrador que ya no existe se cierra
  migrar<AdminUserWithPassword[]>('admin_list', sinContrasenaAntigua)
  const sesion = almacenamiento.leer<AdminUser | null>('admin_user', null)
  if (sesion) {
    const lista = almacenamiento.leer<AdminUserWithPassword[]>('admin_list', DEFAULT_ADMINS)
    if (!lista.some(a => a.id === sesion.id)) {
      almacenamiento.borrar('admin_user')
      cambios.push('admin_user')
    }
  }

  return { cambios }
}
