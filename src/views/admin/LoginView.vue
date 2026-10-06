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
  KeyRound,
  AlertCircle
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseAlert from '../../components/ui/BaseAlert.vue'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

// Rellena los datos de prueba rápidamente con un toque
function fillDemoCredentials(demoEmail: string) {
  email.value = demoEmail
  password.value = 'admin123'
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

function handleGoToRegister() {
  router.push({ name: 'admin-register' })
}
</script>

<template>
  <div class="min-h-screen bg-[#f2f5f0] text-brand-dark flex flex-col justify-between max-w-md mx-auto relative p-4 font-sans">
    
    <!-- ENCABEZADO Y LOGO -->
    <header class="pt-6 pb-2 text-center space-y-3">
      <div class="w-16 h-16 rounded-full bg-white border-2 border-brand-border shadow-xs flex items-center justify-center p-1 mx-auto overflow-hidden">
        <img 
          src="/images/logo.png" 
          alt="Logo Los Troncos de Repil" 
          class="w-full h-full object-cover rounded-full"
          @error="(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=200&q=80' }"
        />
      </div>

      <div>
        <span class="inline-flex items-center gap-1.5 bg-brand-dark text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-2xs">
          <ShieldCheck class="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
          Acceso Administrativo
        </span>
        <h1 class="text-2xl font-black text-brand-dark tracking-tight pt-1">
          Los Troncos de Repil
        </h1>
        <p class="text-xs font-semibold text-gray-500">
          Inicia sesión para gestionar reservas y servicios
        </p>
      </div>
    </header>

    <!-- FORMULARIO DE INICIO DE SESIÓN -->
    <main class="grow flex flex-col justify-center space-y-4 my-4">
      
      <!-- Mensaje de Error si la autenticación falla -->
      <BaseAlert v-if="authStore.authError" variant="danger" title="Error de Acceso">
        {{ authStore.authError }}
      </BaseAlert>

      <form @submit.prevent="handleLogin" class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-4">
        
        <!-- Campo Correo -->
        <div class="space-y-1.5">
          <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
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
          <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
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
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark p-1 rounded-lg touch-target flex items-center justify-center"
              title="Mostrar/Ocultar contraseña"
            >
              <EyeOff v-if="showPassword" class="w-5 h-5 stroke-[2.5]" />
              <Eye v-else class="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <!-- Botón de Ingresar -->
        <div class="pt-2">
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

      <!-- BOTONES RÁPIDOS DE PRUEBA (SOLO PARA DESARROLLO / FACILIDAD DE ACCESO) -->
      <div class="bg-brand-light/80 p-3.5 rounded-2xl border border-brand-border space-y-2">
        <span class="text-[10px] font-black text-gray-500 uppercase tracking-wider block text-center">
          Credenciales Rápidas de Prueba
        </span>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            @click="fillDemoCredentials('dueno1@troncosderepil.cl')"
            class="py-2 px-2 rounded-xl bg-white border border-brand-border text-[11px] font-black text-brand-dark hover:bg-gray-100 touch-target active:scale-95 transition-transform truncate"
          >
            Dueño 1
          </button>
          <button
            type="button"
            @click="fillDemoCredentials('dueno2@troncosderepil.cl')"
            class="py-2 px-2 rounded-xl bg-white border border-brand-border text-[11px] font-black text-brand-dark hover:bg-gray-100 touch-target active:scale-95 transition-transform truncate"
          >
            Dueño 2
          </button>
        </div>
      </div>

    </main>

    <!-- PIE Y ENLACES DE NAVEGACIÓN -->
    <footer class="space-y-2 pt-2">
      <button 
        type="button"
        @click="handleGoToRegister"
        class="w-full text-center text-xs font-black text-brand-accent hover:underline p-2 flex items-center justify-center gap-1"
      >
        <KeyRound class="w-4 h-4 stroke-[2.5]" />
        <span>¿Nuevo administrador? Crear cuenta</span>
      </button>

      <BaseButton variant="outline" size="lg" fullWidth @click="handleBackToHome">
        <ArrowLeft class="w-5 h-5 mr-1.5 stroke-[2.5]" />
        Volver al Menú Público
      </BaseButton>
    </footer>

  </div>
</template>