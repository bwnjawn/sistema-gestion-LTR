// Secciones del panel del administrador: las comparten la barra inferior (teléfono) y el menú lateral (PC).
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRequestsStore } from '../stores/requestsStore'
import type { NombreIconoBarra } from '../components/ui/IconoBarra.vue'

export const SECCIONES_ADMIN: { name: string; path: string; icono: NombreIconoBarra }[] = [
  { name: 'Inicio', path: '/admin', icono: 'inicio' },
  { name: 'Solicitudes', path: '/admin/solicitudes', icono: 'solicitudes' },
  { name: 'Calendario', path: '/admin/calendario', icono: 'calendario' },
  { name: 'Catálogo', path: '/admin/catalogo', icono: 'catalogo' },
  { name: 'Ajustes', path: '/admin/ajustes', icono: 'ajustes' }
]

export function useMenuAdmin() {
  const route = useRoute()
  const router = useRouter()
  const requestsStore = useRequestsStore()

  // Solicitudes pendientes por resolver: el número que se muestra junto a Solicitudes
  const pendientes = computed(() => requestsStore.requests.filter(r => r.status === 'pending').length)
  const textoPendientes = computed(() => (pendientes.value > 99 ? '99+' : String(pendientes.value)))

  function estaActiva(path: string) {
    if (path === '/admin') {
      return route.path === '/admin' || route.path === '/admin/' || route.path === '/admin/dashboard'
    }
    return route.path.startsWith(path)
  }

  function ir(path: string) {
    router.push(path)
  }

  return { secciones: SECCIONES_ADMIN, pendientes, textoPendientes, estaActiva, ir }
}
