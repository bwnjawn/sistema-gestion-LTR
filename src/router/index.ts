import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/client/HomeView.vue'
import ContactView from '../views/client/ContactView.vue'

// Cabañas
import CabanaStep1View from '../views/client/cabana/CabanaStep1View.vue'
import CabanaStep2View from '../views/client/cabana/CabanaStep2View.vue'
import CabanaStep3View from '../views/client/cabana/CabanaStep3View.vue'
import CabanaStep4View from '../views/client/cabana/CabanaStep4View.vue'

// Restaurante
import RestaurantStep1View from '../views/client/restaurante/RestaurantStep1View.vue'
import RestaurantStep2View from '../views/client/restaurante/RestaurantStep2View.vue'
import RestaurantStep3View from '../views/client/restaurante/RestaurantStep3View.vue'
import RestaurantStep4View from '../views/client/restaurante/RestaurantStep4View.vue'

// Camping
import CampingStep1View from '../views/client/camping/CampingStep1View.vue'
import CampingStep2View from '../views/client/camping/CampingStep2View.vue'
import CampingStep3View from '../views/client/camping/CampingStep3View.vue'
import CampingStep4View from '../views/client/camping/CampingStep4View.vue'

// Administración
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/contacto',
    name: 'contact',
    component: ContactView
  },
  // Rutas Cabañas
  {
    path: '/cabanas/paso-1',
    name: 'cabana-step1',
    component: CabanaStep1View
  },
  {
    path: '/cabanas/paso-2',
    name: 'cabana-step2',
    component: CabanaStep2View
  },
  {
    path: '/cabanas/paso-3',
    name: 'cabana-step3',
    component: CabanaStep3View
  },
  {
    path: '/cabanas/paso-4',
    name: 'cabana-step4',
    component: CabanaStep4View
  },
  // Rutas Restaurante
  {
    path: '/restaurante/paso-1',
    name: 'restaurant-step1',
    component: RestaurantStep1View
  },
  {
    path: '/restaurante/paso-2',
    name: 'restaurant-step2',
    component: RestaurantStep2View
  },
  {
    path: '/restaurante/paso-3',
    name: 'restaurant-step3',
    component: RestaurantStep3View
  },
  {
    path: '/restaurante/paso-4',
    name: 'restaurant-step4',
    component: RestaurantStep4View
  },
  // Rutas Camping
  {
    path: '/camping/paso-1',
    name: 'camping-step1',
    component: CampingStep1View
  },
  {
    path: '/camping/paso-2',
    name: 'camping-step2',
    component: CampingStep2View
  },
  {
    path: '/camping/paso-3',
    name: 'camping-step3',
    component: CampingStep3View
  },
  {
    path: '/camping/paso-4',
    name: 'camping-step4',
    component: CampingStep4View
  },
  // Panel Administrador
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminDashboardView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router