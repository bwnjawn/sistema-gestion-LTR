<template>
  <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-gray-300 shadow-sm pt-[env(safe-area-inset-top,0px)]">
    <div class="max-w-md mx-auto w-full px-4 min-h-14 py-1 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <button
          type="button"
          @click="goDashboard"
          class="shrink-0 w-9 h-9 rounded-full overflow-hidden border border-brand-border active:scale-95 transition-transform"
          aria-label="Ir al inicio del panel"
        >
          <img src="/images/logo-negro.png" alt="" class="w-full h-full object-cover" />
        </button>
        <div class="min-w-0">
          <h1 class="text-xl font-bold text-brand-dark leading-tight line-clamp-2">{{ titulo }}</h1>
          <p v-if="mostrarActualizacion" class="text-sm text-gray-700 leading-tight truncate" aria-live="polite">{{ textoActualizacion }}</p>
        </div>
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

      <div class="flex items-center gap-1 shrink-0">
        <!-- Vuelve a pedir los datos; los cambios de otros dispositivos también llegan solos (SCRUM-273) -->
        <button
          v-if="mostrarActualizacion"
          type="button"
          :disabled="actualizacion.actualizando"
          :aria-label="`Actualizar. ${textoActualizacion}`"
          title="Actualizar"
          class="w-10 h-10 flex items-center justify-center text-gray-600 active:scale-90 transition-transform disabled:opacity-60"
          @click="actualizar"
        >
          <RefreshCw :class="['w-5 h-5', actualizacion.actualizando ? 'animate-spin motion-reduce:animate-none' : '']" />
        </button>

        <DropdownMenu
          :items="menuCuenta"
          :trigger-icon="CircleUser"
          aria-label="Cuenta"
          @select="alElegir"
        />
      </div>
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
      <p class="max-w-md mx-auto px-4 py-2 flex items-center gap-2 text-base font-bold">
        <WifiOff class="w-4 h-4 stroke-[2.5] shrink-0" aria-hidden="true" />
        Sin conexión a internet. Ves los últimos datos guardados; para hacer cambios necesitas conexión.
      </p>
    </div>

    <!-- Cambios hechos sin conexión que aún no llegaron al servidor (SCRUM-250) -->
    <AvisoCambiosSinSincronizar />
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleHelp, CircleUser, LogOut, RefreshCw, Type, WifiOff } from 'lucide-vue-next'
import { useActualizacionStore } from '../../stores/actualizacionStore'
import { useAuthStore } from '../../stores/authStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { usePreferenciasStore } from '../../stores/preferenciasStore'
import DropdownMenu, { type DropdownItem } from './DropdownMenu.vue'
import ModalAyuda from './ModalAyuda.vue'
import AvisoCambiosSinSincronizar from '../admin/AvisoCambiosSinSincronizar.vue'
import { AYUDAS_ADMIN } from '../admin/ayudasAdmin'
import { textoHaceCuanto } from '../../services/actualizacion'

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

// Botón "Actualizar" y la hora de la última actualización: solo en las secciones que lo piden (meta.actualizable)
// y con Supabase, que es cuando hay otros dispositivos que cambian los datos
const actualizacion = useActualizacionStore()
const mostrarActualizacion = computed(() => route.meta.actualizable === true && actualizacion.disponible)
const ahora = ref(Date.now())
let reloj: ReturnType<typeof setInterval> | undefined
onMounted(() => { reloj = setInterval(() => { ahora.value = Date.now() }, 30000) })
onBeforeUnmount(() => clearInterval(reloj))
const textoActualizacion = computed(() =>
  actualizacion.error ? 'No se pudo actualizar' : textoHaceCuanto(actualizacion.ultimaVez, ahora.value)
)
const actualizar = () => {
  ahora.value = Date.now()
  void actualizacion.refrescarTodo()
}

// El tamaño de la letra es de este dispositivo y solo lo cambia el administrador (SCRUM-276)
const preferencias = usePreferenciasStore()
const menuCuenta = computed<DropdownItem[]>(() => [
  { key: 'letra-normal', label: 'Letra normal', icon: Type, activo: preferencias.tamanoLetra === 'normal' },
  { key: 'letra-grande', label: 'Letra grande', icon: Type, activo: preferencias.tamanoLetra === 'grande' },
  { key: 'salir', label: 'Cerrar sesión', icon: LogOut, danger: true }
])

const goDashboard = () => {
  router.push({ name: 'admin-dashboard' })
}

const alElegir = async (clave: string) => {
  if (clave === 'letra-normal' || clave === 'letra-grande') {
    await preferencias.cambiarTamanoLetra(clave === 'letra-grande' ? 'grande' : 'normal')
    return
  }
  if (clave !== 'salir') return
  // Con cambios sin sincronizar no se cierra la sesión (se perderían): el store avisa por qué
  if (await authStore.logout()) router.push({ name: 'admin-login' })
}
</script>
