<template>
  <div class="min-h-screen bg-brand-light flex flex-col pb-24">
    <!-- Encabezado de Admin Unificado -->
    <AdminHeader />

    <!-- Vistas Hijas del Panel de Administración -->
    <main class="p-4 grow w-full max-w-md mx-auto">
      <router-view />
    </main>

    <!-- Botón Fijo "Nueva Reserva" (Abre la vista pública del cliente '/') -->
    <button
      type="button"
      @click="goToClientBooking"
      class="fixed bottom-20 right-4 bg-[#25636B] hover:bg-[#1c4c52] text-white font-black py-2.5 px-4 rounded-full shadow-xl border-2 border-brand-border flex items-center gap-2 z-40 transition-transform active:scale-95 touch-target"
      title="Ingresar nueva reserva desde el portal cliente"
    >
      <Plus class="w-5 h-5 stroke-[3]" />
      <span class="text-xs font-black">Nueva Reserva</span>
    </button>

    <!-- Barra de Navegación Inferior Admin Unificada -->
    <AdminBottomNav />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Plus } from 'lucide-vue-next'
import AdminHeader from '../components/ui/AdminHeader.vue'
import AdminBottomNav from '../components/ui/AdminBottomNav.vue'

const router = useRouter()

const goToClientBooking = () => {
  router.push({ name: 'home' })
}
</script>