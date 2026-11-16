// src/lib/arranque.ts
// Arranque de la aplicación (SCRUM-246): primero se llevan los datos guardados al formato vigente y luego
// cada store carga lo suyo desde su repositorio. La app no se monta hasta que todo está cargado.
//
// Con Supabase el público no puede leer las solicitudes: se cargan solo cuando hay un administrador con sesión
// (al arrancar con la sesión guardada, o al iniciar sesión) y se descartan al cerrarla.

import { migrateLegacyData } from './migrarDatosLocales'
import { repositorios } from './repositories'
import { useAuthStore } from '../stores/authStore'
import { useCatalogStore } from '../stores/catalogStore'
import { useDisponibilidadStore } from '../stores/disponibilidadStore'
import { useRequestsStore } from '../stores/requestsStore'
import { useSettingsStore } from '../stores/settingsStore'

/**
 * Migra lo guardado y carga todos los stores. Lanza el error si algo no se pudo cargar
 * (con Supabase: sin conexión o base caída); quien llama muestra la pantalla de error.
 */
export async function inicializarAplicacion(): Promise<void> {
  if (repositorios().modo === 'local') migrateLegacyData()
  const auth = useAuthStore()
  // La sesión primero: de ella depende qué datos se pueden leer
  await auth.init()
  await Promise.all([
    useSettingsStore().init(),
    useCatalogStore().init(),
    useDisponibilidadStore().init(),
    // Sin Supabase el cliente y el administrador comparten el navegador, así que siempre se cargan
    repositorios().modo === 'local' || auth.isAuthenticated ? useRequestsStore().init() : Promise.resolve()
  ])
}

/** Lo que solo ve un administrador: todas las solicitudes y el catálogo completo (también lo dado de baja). */
export async function cargarDatosDeAdministrador(): Promise<void> {
  await Promise.all([useRequestsStore().init(), useCatalogStore().init()])
}

/** Al cerrar la sesión no queda en pantalla nada que el público no pueda ver. */
export async function descartarDatosDeAdministrador(): Promise<void> {
  if (repositorios().modo === 'local') return
  useRequestsStore().requests = []
  await useCatalogStore().init()
}
