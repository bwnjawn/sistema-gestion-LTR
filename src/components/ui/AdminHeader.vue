<template>
  <EncabezadoFijo class="bg-white/95 backdrop-blur-md border-b-2 border-gray-300 shadow-sm">
    <div class="max-w-md mx-auto w-full px-4 h-14 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <button
          type="button"
          @click="goDashboard"
          class="shrink-0 w-9 h-9 rounded-full overflow-hidden border border-brand-border active:scale-95 transition-transform"
          aria-label="Ir al inicio del panel"
        >
          <img src="/images/logo-negro.png" alt="" class="w-full h-full object-cover" />
        </button>
        <h1 class="text-xl font-black text-brand-dark leading-tight truncate">{{ titulo }}</h1>
      </div>

      <DropdownMenu
        :items="menuCuenta"
        :trigger-icon="CircleUser"
        aria-label="Cuenta"
        @select="alElegir"
      />
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
  </EncabezadoFijo>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleUser, LogOut, WifiOff } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'
import DropdownMenu, { type DropdownItem } from './DropdownMenu.vue'
import EncabezadoFijo from './EncabezadoFijo.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// El título lo declara cada ruta en el router (meta.titulo)
const titulo = computed(() => (route.meta.titulo as string | undefined) ?? 'Administración')

const menuCuenta: DropdownItem[] = [
  { key: 'salir', label: 'Cerrar sesión', icon: LogOut, danger: true }
]

const goDashboard = () => {
  router.push({ name: 'admin-dashboard' })
}

const alElegir = async (clave: string) => {
  if (clave !== 'salir') return
  await authStore.logout()
  router.push({ name: 'admin-login' })
}
</script>
