import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const routes = [
  // ==========================================
  // RUTAS PÚBLICAS (CLIENTE)
  // ==========================================
  {
    path: '/',
    name: 'home',
    component: () => import('../views/client/HomeView.vue')
  },
  {
    path: '/contacto',
    name: 'contact',
    component: () => import('../views/client/ContactView.vue')
  },
  // Flujo Reserva Cabaña
  {
    path: '/cabana/paso1',
    name: 'cabana-step1',
    component: () => import('../views/client/cabana/CabanaStep1View.vue')
  },
  {
    path: '/cabana/paso2',
    name: 'cabana-step2',
    component: () => import('../views/client/cabana/CabanaStep2View.vue')
  },
  {
    path: '/cabana/paso3',
    name: 'cabana-step3',
    component: () => import('../views/client/cabana/CabanaStep3View.vue')
  },
  {
    path: '/cabana/paso4',
    name: 'cabana-step4',
    component: () => import('../views/client/cabana/CabanaStep4View.vue')
  },
  // Flujo Reserva Camping
  {
    path: '/camping/paso1',
    name: 'camping-step1',
    component: () => import('../views/client/camping/CampingStep1View.vue')
  },
  {
    path: '/camping/paso2',
    name: 'camping-step2',
    component: () => import('../views/client/camping/CampingStep2View.vue')
  },
  {
    path: '/camping/paso3',
    name: 'camping-step3',
    component: () => import('../views/client/camping/CampingStep3View.vue')
  },
  {
    path: '/camping/paso4',
    name: 'camping-step4',
    component: () => import('../views/client/camping/CampingStep4View.vue')
  },
  // Flujo Reserva Restaurante
  {
    path: '/restaurante/paso1',
    name: 'restaurant-step1',
    component: () => import('../views/client/restaurante/RestaurantStep1View.vue')
  },
  {
    path: '/restaurante/paso2',
    name: 'restaurant-step2',
    component: () => import('../views/client/restaurante/RestaurantStep2View.vue')
  },
  {
    path: '/restaurante/paso3',
    name: 'restaurant-step3',
    component: () => import('../views/client/restaurante/RestaurantStep3View.vue')
  },
  {
    path: '/restaurante/paso4',
    name: 'restaurant-step4',
    component: () => import('../views/client/restaurante/RestaurantStep4View.vue')
  },
  // ==========================================
  // RUTAS DE AUTENTICACIÓN (Sin Layout de Admin)
  // ==========================================
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('../views/admin/LoginView.vue')
  },
  {
    path: '/admin/registro',
    name: 'admin-register',
    component: () => import('../views/admin/RegisterView.vue')
  },
  // ==========================================
  // RUTAS DE ADMINISTRACIÓN PROTEGIDAS (AdminLayout)
  // ==========================================
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true }, // Protección para todo el grupo de rutas hijas
    children: [
      {
        path: '',
        redirect: { name: 'admin-dashboard' }
      },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('../views/admin/AdminDashboardView.vue')
      },
      {
        path: 'calendario',
        name: 'admin-calendar',
        component: () => import('../views/admin/AdminCalendarView.vue')
      },
      {
        path: 'solicitudes',
        name: 'admin-requests',
        component: () => import('../views/admin/AdminDashboardView.vue')
      },
      {
        path: 'editar',
        name: 'admin-edit',
        component: () => import('../views/admin/AdminCatalogEditView.vue')
      },
      {
        path: 'catalogo',
        name: 'admin-catalog',
        component: () => import('../views/admin/AdminCatalogEditView.vue')
      },
      {
        path: 'mas',
        name: 'admin-more',
        component: () => import('../views/admin/AdminDashboardView.vue')
      }
    ]
  },
  // Redirección por defecto si la ruta no existe
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'home' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// GUARDIÁN DE NAVEGACIÓN (Protección de rutas administrativas con authStore)
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()
  
  // 1. Si la ruta requiere autenticación y el usuario NO está autenticado
  if (to.matched.some(record => record.meta.requiresAuth) && !authStore.isAuthenticated) {
    next({ name: 'admin-login' })
  }
  // 2. Si el usuario ya inició sesión e intenta ir a Login/Registro, redirigir al Dashboard
  else if ((to.name === 'admin-login' || to.name === 'admin-register') && authStore.isAuthenticated) {
    next({ name: 'admin-dashboard' })
  }
  // 3. Continuar la navegación normal
  else {
    next()
  }
})

export default router