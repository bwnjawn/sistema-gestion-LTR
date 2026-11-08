<template>
  <header class="bg-white border-b-2 border-gray-300 shadow-sm">
    <div class="max-w-md mx-auto w-full px-4 py-3 flex items-center justify-between gap-3">
      <button type="button" class="text-left min-w-0" @click="goDashboard" aria-label="Ir al inicio del panel">
        <span class="block text-lg font-black text-brand-dark leading-tight truncate">Los Troncos de Repil</span>
        <span class="block text-sm font-bold text-gray-700 leading-tight">Administración</span>
      </button>

      <button
        type="button"
        @click="handleLogout"
        class="shrink-0 inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border-2 border-brand-dark text-brand-dark text-sm font-black hover:bg-brand-light active:scale-95 transition-transform touch-target"
      >
        <LogOut class="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
        Salir
      </button>
    </div>

    <!-- Solo aparece cuando no hay internet -->
    <div
      v-if="!settingsStore.isConnected"
      role="status"
      class="bg-amber-100 border-t-2 border-amber-500 text-amber-950"
    >
      <p class="max-w-md mx-auto px-4 py-2 flex items-center gap-2 text-sm font-black">
        <WifiOff class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
        Sin conexión a internet. Los cambios se guardan solo en este dispositivo.
      </p>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LogOut, WifiOff } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'

const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const goDashboard = () => {
  router.push({ name: 'admin-dashboard' })
}

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'admin-login' })
}
</script>
