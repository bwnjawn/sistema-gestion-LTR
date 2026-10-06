import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/ClientLayout.vue'),
    children: [
      {
        path: '',
        name: 'client-reservation',
        component: () => import('../views/client/ClientReservationView.vue')
      },
      {
        path: 'cabana/paso-1',
        name: 'cabana-step1',
        component: () => import('../views/client/cabana/CabanaStep1View.vue')
      },
      {
        path: 'cabana/paso-2',
        name: 'cabana-step2',
        component: () => import('../views/client/cabana/CabanaStep2View.vue')
      },
      {
        path: 'cabana/paso-3',
        name: 'cabana-step3',
        component: () => import('../views/client/cabana/CabanaStep3View.vue')
      },
      {
        path: 'cabana/paso-4',
        name: 'cabana-step4',
        component: () => import('../views/client/cabana/CabanaStep4View.vue')
      },
      {
        path: 'restaurante/paso-1',
        name: 'restaurant-step1',
        component: () => import('../views/client/restaurante/RestaurantStep1View.vue')
      },
      {
        path: 'restaurante/paso-2',
        name: 'restaurant-step2',
        component: () => import('../views/client/restaurante/RestaurantStep2View.vue')
      },
      {
        path: 'restaurante/paso-3',
        name: 'restaurant-step3',
        component: () => import('../views/client/restaurante/RestaurantStep3View.vue')
      },
      {
        path: 'restaurante/paso-4',
        name: 'restaurant-step4',
        component: () => import('../views/client/restaurante/RestaurantStep4View.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: () => import('../views/admin/AdminDashboardView.vue')
      },
      {
        path: 'solicitudes',
        name: 'admin-requests',
        component: () => import('../views/admin/AdminDashboardView.vue')
      },
      {
        path: 'catalogo',
        name: 'admin-catalog',
        component: () => import('../views/admin/AdminDashboardView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router