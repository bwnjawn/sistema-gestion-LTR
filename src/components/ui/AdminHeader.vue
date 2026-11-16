<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-gray-300 shadow-sm pt-[env(safe-area-inset-top,0px)]">
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
        <!-- Solo el círculo del "?" se ve; el área de toque de 40 px es transparente -->
        <button
          v-if="ayuda"
          type="button"
          @click="ayudaAbierta = true"
          aria-label="Ayuda de esta sección"
          title="Ayuda de esta sección"
          class="shrink-0 -ml-1.5 w-10 h-10 flex items-center justify-center text-gray-600 active:scale-90 transition-transform"
        >
          <CircleHelp class="w-5 h-5" />
        </button>
      </div>

      <DropdownMenu
        :items="menuCuenta"
        :trigger-icon="CircleUser"
        aria-label="Cuenta"
        @select="alElegir"
      />
    </div>

    <ModalAyuda v-if="ayuda" :abierto="ayudaAbierta" :titulo="ayuda.titulo" @cerrar="ayudaAbierta = false">
      <component :is="ayuda.contenido" />
    </ModalAyuda>

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
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleHelp, CircleUser, LogOut, WifiOff } from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'
import DropdownMenu, { type DropdownItem } from './DropdownMenu.vue'
import ModalAyuda from './ModalAyuda.vue'
import { AYUDAS_ADMIN } from '../admin/ayudasAdmin'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

// El título lo declara cada ruta en el router (meta.titulo)
const titulo = computed(() => (route.meta.titulo as string | undefined) ?? 'Administración')

// Ayuda de la sección actual, si su ruta declara `meta.ayuda`
const ayuda = computed(() => AYUDAS_ADMIN[route.meta.ayuda as string] ?? null)
const ayudaAbierta = ref(false)
watch(() => route.fullPath, () => { ayudaAbierta.value = false })

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
