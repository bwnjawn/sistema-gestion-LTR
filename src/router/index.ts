// src/router/index.ts

import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useReservationStore } from '../stores/reservationStore'
import { isClientContactValid } from '../services/wizard'

const routes = [
  // ==========================================
  // RUTAS PÚBLICAS (CLIENTE)
  // ==========================================
  { path: '/', name: 'home', component: () => import('../views/client/HomeView.vue') },
  { path: '/contacto', name: 'contact', component: () => import('../views/client/ContactView.vue') },

  // Flujo de reserva: comparten el encabezado con atrás, título del servicio, paso y salir
  {
    path: '/reservar',
    component: () => import('../layouts/ReservaLayout.vue'),
    children: [
    // Flujo Reserva Cabaña
    { path: '/cabana/paso1', name: 'cabana-step1', meta: { servicio: 'cabana', paso: 1 }, component: () => import('../views/client/cabana/CabanaStep1View.vue') },
    { path: '/cabana/paso2', name: 'cabana-step2', meta: { servicio: 'cabana', paso: 2 }, component: () => import('../views/client/cabana/CabanaStep2View.vue') },
    { path: '/cabana/paso3', name: 'cabana-step3', meta: { servicio: 'cabana', paso: 3 }, component: () => import('../views/client/cabana/CabanaStep3View.vue') },
    { path: '/cabana/paso4', name: 'cabana-step4', meta: { servicio: 'cabana', paso: 4 }, component: () => import('../views/client/cabana/CabanaStep4View.vue') },

    // Flujo Reserva Camping
    { path: '/camping/paso1', name: 'camping-step1', meta: { servicio: 'camping', paso: 1 }, component: () => import('../views/client/camping/CampingStep1View.vue') },
    { path: '/camping/paso2', name: 'camping-step2', meta: { servicio: 'camping', paso: 2 }, component: () => import('../views/client/camping/CampingStep2View.vue') },
    { path: '/camping/paso3', name: 'camping-step3', meta: { servicio: 'camping', paso: 3 }, component: () => import('../views/client/camping/CampingStep3View.vue') },
    { path: '/camping/paso4', name: 'camping-step4', meta: { servicio: 'camping', paso: 4 }, component: () => import('../views/client/camping/CampingStep4View.vue') },

    // Flujo Reserva Restaurante
    { path: '/restaurante/paso1', name: 'restaurant-step1', meta: { servicio: 'restaurante', paso: 1 }, component: () => import('../views/client/restaurante/RestaurantStep1View.vue') },
    { path: '/restaurante/paso2', name: 'restaurant-step2', meta: { servicio: 'restaurante', paso: 2 }, component: () => import('../views/client/restaurante/RestaurantStep2View.vue') },
    { path: '/restaurante/paso3', name: 'restaurant-step3', meta: { servicio: 'restaurante', paso: 3 }, component: () => import('../views/client/restaurante/RestaurantStep3View.vue') },
    { path: '/restaurante/paso4', name: 'restaurant-step4', meta: { servicio: 'restaurante', paso: 4 }, component: () => import('../views/client/restaurante/RestaurantStep4View.vue') },
    ]
  },

  // ==========================================
  // RUTAS DE AUTENTICACIÓN
  // ==========================================
  { path: '/admin/login', name: 'admin-login', component: () => import('../views/admin/LoginView.vue') },
  // Crear administradores exige una sesión de administrador (ver SCRUM-242).
  { path: '/admin/registro', name: 'admin-register', component: () => import('../views/admin/RegisterView.vue'), meta: { requiresAuth: true } },

  // ==========================================
  // RUTAS DE ADMINISTRACIÓN PROTEGIDAS
  // ==========================================
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: { name: 'admin-dashboard' } },
      { path: 'dashboard', name: 'admin-dashboard', meta: { titulo: 'Inicio' }, component: () => import('../views/admin/AdminDashboardView.vue') },
      { path: 'solicitudes', name: 'admin-solicitudes', meta: { titulo: 'Solicitudes' }, component: () => import('../views/admin/AdminRequestsView.vue') },
      { path: 'calendario', name: 'admin-calendar', meta: { titulo: 'Calendario' }, component: () => import('../views/admin/AdminCalendarView.vue') },
      { path: 'catalogo', name: 'admin-catalog', meta: { titulo: 'Catálogo' }, component: () => import('../views/admin/AdminCatalogEditView.vue') },
      { path: 'ajustes', name: 'admin-settings', meta: { titulo: 'Ajustes' }, component: () => import('../views/admin/AdminSettingsView.vue') },
      // Rutas antiguas
      { path: 'editar', redirect: { name: 'admin-catalog' } },
      { path: 'mas', redirect: { name: 'admin-settings' } }
    ]
  },

  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // Cada vista nueva empieza arriba; al volver atrás se conserva la posición
  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
  routes
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  const reservationStore = useReservationStore()

  // Guard de autenticación para administración
  if (to.matched.some(record => record.meta.requiresAuth) && !authStore.isAuthenticated) {
    return next({ name: 'admin-login' })
  }

  if (to.name === 'admin-login' && authStore.isAuthenticated) {
    return next({ name: 'admin-dashboard' })
  }

  // Guards de navegación para wizard Cabaña
  if (to.name === 'cabana-step2' && (!reservationStore.checkInDate || !reservationStore.checkOutDate)) {
    return next({ name: 'cabana-step1' })
  }
  if (to.name === 'cabana-step3' && !reservationStore.selectedCabinId) {
    return next({ name: 'cabana-step1' })
  }
  if (to.name === 'cabana-step4' && !isClientContactValid(reservationStore.clientName, reservationStore.clientPhone)) {
    return next({ name: 'cabana-step1' })
  }

  // Guards de navegación para wizard Camping
  if (to.name === 'camping-step2' && !reservationStore.checkInDate) {
    return next({ name: 'camping-step1' })
  }
  if (to.name === 'camping-step3' && !reservationStore.selectedCampingId) {
    return next({ name: 'camping-step1' })
  }
  if (to.name === 'camping-step4' && !isClientContactValid(reservationStore.clientName, reservationStore.clientPhone)) {
    return next({ name: 'camping-step1' })
  }

  // Guards de navegación para wizard Restaurante
  if (to.name === 'restaurant-step2' && (!reservationStore.checkInDate || reservationStore.selectedMealTypes.length === 0)) {
    return next({ name: 'restaurant-step1' })
  }
  if (to.name === 'restaurant-step3' && reservationStore.selectedMeals.length === 0) {
    return next({ name: 'restaurant-step1' })
  }
  if (to.name === 'restaurant-step4' && !isClientContactValid(reservationStore.clientName, reservationStore.clientPhone)) {
    return next({ name: 'restaurant-step1' })
  }

  next()
})

// Cliente y administrador se instalan como dos apps distintas: según la ruta
// se cambia el manifest, el ícono y el nombre que iOS lee al "Agregar a inicio".
function aplicarIdentidadDeApp(esAdmin: boolean) {
  const poner = (selector: string, crear: () => HTMLElement, atributo: string, valor: string) => {
    let el = document.head.querySelector<HTMLElement>(selector)
    if (!el) {
      el = crear()
      document.head.appendChild(el)
    }
    el.setAttribute(atributo, valor)
  }
  const enlace = (rel: string) => () => {
    const link = document.createElement('link')
    link.rel = rel
    return link
  }
  const meta = (nombre: string) => () => {
    const m = document.createElement('meta')
    m.name = nombre
    return m
  }

  poner('link[rel="manifest"]', enlace('manifest'), 'href', esAdmin ? '/manifest-admin.webmanifest' : '/manifest.webmanifest')
  poner('link[rel="apple-touch-icon"]', enlace('apple-touch-icon'), 'href', esAdmin ? '/apple-touch-icon-admin.png' : '/apple-touch-icon.png')
  poner('meta[name="apple-mobile-web-app-title"]', meta('apple-mobile-web-app-title'), 'content', esAdmin ? 'Admin Troncos' : 'Los Troncos')
  poner('meta[name="theme-color"]', meta('theme-color'), 'content', esAdmin ? '#000000' : '#1E4620')
}

router.afterEach((to) => {
  aplicarIdentidadDeApp(to.path.startsWith('/admin'))
})

export default router