<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft,
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseAlert from '../../components/ui/BaseAlert.vue'
import MarcoApp from '../../components/ui/MarcoApp.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

async function handleLogin() {
  if (!email.value || !password.value) return

  const success = await authStore.login(email.value, password.value)
  if (success) {
    router.push({ name: 'admin-dashboard' })
  }
}

function handleBackToHome() {
  router.push({ name: 'home' })
}

const LOGO_RESPALDO = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=200&q=80'
function logoRoto(e: Event) {
  (e.target as HTMLImageElement).src = LOGO_RESPALDO
}
</script>

<template>
  <!-- Teléfono: una columna compacta, arriba, con la altura justa de su contenido (sin estirarse hasta el borde de la
       pantalla, así el botón de abajo siempre queda a la vista). PC (desde 1024 px): panel de marca a la izquierda y el
       formulario a la derecha. Va dentro del marco de altura fija (MarcoApp, SCRUM-259). -->
  <MarcoApp class="bg-[#f2f5f0] text-brand-dark font-sans">
  <div class="flex flex-col lg:flex-row lg:min-h-screen">

    <!-- PANEL DE MARCA: solo en PC -->
    <aside class="hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col items-center justify-center gap-6 bg-brand-dark text-white p-12 text-center">
      <div class="w-28 h-28 rounded-full bg-white border-4 border-white/30 shadow-lg flex items-center justify-center p-1 overflow-hidden">
        <img src="/images/logo.png" alt="Logo Los Troncos de Repil" class="w-full h-full object-cover rounded-full" @error="logoRoto" />
      </div>
      <div class="space-y-3 max-w-sm">
        <span class="inline-flex items-center gap-1.5 bg-white/15 text-white text-sm font-bold px-3 py-1 rounded-full">
          <ShieldCheck class="w-4 h-4 text-emerald-300 stroke-[2.5]" />
          Acceso Administrativo
        </span>
        <h1 class="text-4xl font-bold tracking-tight">Los Troncos de Repil</h1>
        <p class="text-lg text-emerald-50/90">Gestiona reservas, calendario y servicios del centro turístico.</p>
      </div>
    </aside>

    <!-- COLUMNA DEL FORMULARIO -->
    <div class="grow flex flex-col items-center p-4 lg:p-12 lg:justify-center">
      <div class="w-full max-w-md flex flex-col gap-3 lg:gap-6">

        <!-- ENCABEZADO Y LOGO: solo en teléfono (en PC va en el panel de la izquierda) -->
        <header class="lg:hidden pt-2 text-center space-y-2">
          <div class="w-16 h-16 rounded-full bg-white border-2 border-brand-border shadow-xs flex items-center justify-center p-1 mx-auto overflow-hidden">
            <img src="/images/logo.png" alt="Logo Los Troncos de Repil" class="w-full h-full object-cover rounded-full" @error="logoRoto" />
          </div>

          <div>
            <span class="inline-flex items-center gap-1.5 bg-brand-dark text-white text-sm font-bold px-3 py-0.5 rounded-full shadow-2xs">
              <ShieldCheck class="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
              Acceso Administrativo
            </span>
            <h1 class="text-2xl font-bold text-brand-dark tracking-tight pt-1">
              Los Troncos de Repil
            </h1>
            <p class="text-base text-gray-700">
              Inicia sesión para gestionar reservas y servicios
            </p>
          </div>
        </header>

        <!-- Título del formulario: solo en PC -->
        <div class="hidden lg:block space-y-1">
          <h2 class="text-3xl font-bold text-brand-dark tracking-tight">Iniciar sesión</h2>
          <p class="text-base text-gray-700">Ingresa con tu cuenta de administrador.</p>
        </div>

        <!-- FORMULARIO DE INICIO DE SESIÓN -->
        <main class="space-y-3 lg:space-y-4">

          <!-- Mensaje de Error si la autenticación falla -->
          <BaseAlert v-if="authStore.authError" variant="danger" title="Error de Acceso">
            {{ authStore.authError }}
          </BaseAlert>

          <form @submit.prevent="handleLogin" class="bg-white p-5 lg:p-7 rounded-3xl border-2 border-brand-border shadow-sm space-y-4">

            <!-- Campo Correo -->
            <div class="space-y-1.5">
              <label class="text-sm text-gray-700 flex items-center gap-1.5">
                <Mail class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                Correo de Administrador
              </label>
              <input
                type="email"
                v-model="email"
                required
                placeholder="ejemplo@troncosderepil.cl"
                class="w-full p-3.5 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
              />
            </div>

            <!-- Campo Contraseña con Toggle Ojo -->
            <div class="space-y-1.5">
              <label class="text-sm text-gray-700 flex items-center gap-1.5">
                <Lock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                Contraseña
              </label>

              <div class="relative">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="password"
                  required
                  placeholder="••••••••"
                  class="w-full p-3.5 pr-12 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
                />
                <button
                  type="button"
                  @click="togglePasswordVisibility"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-brand-dark p-1 rounded-lg touch-target flex items-center justify-center"
                  title="Mostrar/Ocultar contraseña"
                >
                  <EyeOff v-if="showPassword" class="w-5 h-5 stroke-[2.5]" />
                  <Eye v-else class="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            <!-- Botón de Ingresar -->
            <div class="pt-1">
              <BaseButton
                variant="primary"
                size="lg"
                fullWidth
                type="submit"
                :disabled="authStore.isLoading || !email || !password"
              >
                <LogIn class="w-5 h-5 mr-1.5 stroke-[2.5]" />
                <span>{{ authStore.isLoading ? 'Verificando...' : 'Ingresar al Panel' }}</span>
              </BaseButton>
            </div>

          </form>

        </main>

        <!-- PIE Y ENLACES DE NAVEGACIÓN -->
        <footer>
          <BaseButton variant="outline" size="lg" fullWidth @click="handleBackToHome">
            <ArrowLeft class="w-5 h-5 mr-1.5 stroke-[2.5]" />
            Volver al Menú Público
          </BaseButton>
        </footer>

      </div>
    </div>

  </div>
  </MarcoApp>
</template>
