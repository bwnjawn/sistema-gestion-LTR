// src/lib/arranque.ts
// Arranque de la aplicación (SCRUM-246): primero se llevan los datos guardados al formato vigente y luego
// cada store carga lo suyo desde su repositorio. La app no se monta hasta que todo está cargado.

import { migrateLegacyData } from './migrarDatosLocales'
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
  migrateLegacyData()
  await Promise.all([
    useSettingsStore().init(),
    useCatalogStore().init(),
    useRequestsStore().init(),
    useDisponibilidadStore().init(),
    useAuthStore().init()
  ])
}
