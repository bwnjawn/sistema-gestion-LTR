<template>
  <!-- En PC (desde 1024 px) el menú va a la izquierda y el contenido se ensancha (SCRUM-278) -->
  <div class="min-h-screen bg-brand-light flex flex-col pb-contenido-nav lg:pb-0 lg:pl-64">
    <!-- Menú lateral: solo se ve en PC -->
    <AdminMenuLateral />

    <!-- Encabezado de Admin Unificado -->
    <AdminHeader />

    <!-- Vistas Hijas del Panel de Administración -->
    <main class="p-4 grow w-full max-w-md lg:max-w-[1680px] mx-auto lg:px-10 lg:py-8">
      <router-view />
    </main>

    <!-- Botón Fijo "Nueva Reserva": abre el flujo del cliente en modo administrador (SCRUM-56). En PC está en el menú lateral. -->
    <button
      type="button"
      @click="goToClientBooking"
      class="lg:hidden fixed bottom-sobre-nav right-4 bg-[#25636B] hover:bg-[#1c4c52] text-white font-black py-2.5 px-4 rounded-full shadow-xl border-2 border-brand-border flex items-center gap-2 z-40 transition-transform active:scale-95 touch-target"
      title="Cargar una nueva reserva con el flujo del cliente"
    >
      <Plus class="w-5 h-5 stroke-[3]" />
      <span class="text-xs font-black">Nueva Reserva</span>
    </button>

    <!-- Barra de Navegación Inferior Admin Unificada (solo teléfono) -->
    <AdminBottomNav />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import AdminHeader from '../components/ui/AdminHeader.vue'
import AdminBottomNav from '../components/admin/AdminBottomNav.vue'
import AdminMenuLateral from '../components/admin/AdminMenuLateral.vue'

const router = useRouter()

const goToClientBooking = () => {
  router.push({ name: 'admin-nueva-reserva' })
}
</script>
