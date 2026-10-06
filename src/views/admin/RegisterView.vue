<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-vue-next'
import { useAuthStore } from '../../stores/authStore'
import BaseButton from '../../components/ui/BaseButton.vue'
import BaseAlert from '../../components/ui/BaseAlert.vue'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const isPasswordMatch = computed(() => {
  return password.value.length > 0 && password.value === confirmPassword.value
})

const isFormValid = computed(() => {
  return (
    name.value.trim().length >= 3 &&
    email.value.trim().length >= 5 &&
    password.value.length >= 6 &&
    isPasswordMatch.value
  )
})

async function handleRegister() {
  if (!isFormValid.value) return

  const success = await authStore.register(
    name.value,
    email.value,
    password.value
  )

  if (success) {
    router.push({ name: 'admin-dashboard' })
  }
}

function handleGoToLogin() {
  router.push({ name: 'admin-login' })
}

function handleBackToHome() {
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="min-h-screen bg-[#f2f5f0] text-brand-dark flex flex-col justify-between max-w-md mx-auto relative p-4 font-sans pb-10">
    
    <!-- ENCABEZADO Y LOGO -->
    <header class="pt-4 pb-2 text-center space-y-2">
      <div class="w-14 h-14 rounded-full bg-white border-2 border-brand-border shadow-xs flex items-center justify-center p-1 mx-auto overflow-hidden">
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
          Registro Administrador
        </span>
        <h1 class="text-xl font-black text-brand-dark tracking-tight pt-1">
          Crear Cuenta de Acceso
        </h1>
        <p class="text-xs font-semibold text-gray-500">
          Ingresa tus datos para registrarte como administrador del sistema
        </p>
      </div>
    </header>

    <!-- FORMULARIO DE REGISTRO (Nombre, Correo, Contraseña) -->
    <main class="grow flex flex-col justify-center space-y-4 my-2">
      
      <!-- Alerta de Error de Registro -->
      <BaseAlert v-if="authStore.authError" variant="danger" title="Error de Registro">
        {{ authStore.authError }}
      </BaseAlert>

      <form @submit.prevent="handleRegister" class="bg-white p-5 rounded-3xl border-2 border-brand-border shadow-sm space-y-3.5">
        
        <!-- Nombre Completo -->
        <div class="space-y-1">
          <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <User class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Nombre Completo *
          </label>
          <input 
            type="text"
            v-model="name"
            required
            placeholder="Ej: Benjamín Pérez"
            class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
          />
        </div>

        <!-- Correo Electrónico -->
        <div class="space-y-1">
          <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Mail class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Correo Electrónico *
          </label>
          <input 
            type="email"
            v-model="email"
            required
            placeholder="admin@troncosderepil.cl"
            class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
          />
        </div>

        <!-- Contraseña -->
        <div class="space-y-1">
          <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
            <Lock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Contraseña (Mín. 6 caracteres) *
          </label>
          <div class="relative">
            <input 
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              required
              minlength="6"
              placeholder="••••••••"
              class="w-full p-3 pr-10 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-sm focus:bg-white focus:border-brand-dark focus:outline-none transition-colors touch-target"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark p-1"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4 stroke-[2.5]" />
              <Eye v-else class="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <!-- Confirmar Contraseña -->
        <div class="space-y-1">
          <label class="block text-xs font-extrabold text-gray-700 uppercase tracking-wider flex items-center justify-between">
            <span class="flex items-center gap-1.5">
              <Lock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              Confirmar Contraseña *
            </span>
            <span v-if="password && isPasswordMatch" class="text-emerald-600 font-bold text-[10px] flex items-center gap-1">
              <CheckCircle2 class="w-3 h-3 stroke-[2.5]" />
              Coinciden
            </span>
          </label>

          <div class="relative">
            <input 
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="confirmPassword"
              required
              placeholder="••••••••"
              :class="[
                'w-full p-3 pr-10 rounded-xl border-2 bg-brand-light font-bold text-sm focus:bg-white focus:outline-none transition-colors touch-target',
                confirmPassword && !isPasswordMatch ? 'border-rose-500 bg-rose-50' : 'border-brand-border focus:border-brand-dark'
              ]"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark p-1"
            >
              <EyeOff v-if="showConfirmPassword" class="w-4 h-4 stroke-[2.5]" />
              <Eye v-else class="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <p v-if="confirmPassword && !isPasswordMatch" class="text-[11px] font-bold text-rose-600 pt-0.5">
            Las contraseñas no coinciden.
          </p>
        </div>

        <!-- Botón de Registro -->
        <div class="pt-2">
          <BaseButton 
            variant="primary" 
            size="lg" 
            fullWidth 
            type="submit"
            :disabled="authStore.isLoading || !isFormValid"
          >
            <UserPlus class="w-5 h-5 mr-1.5 stroke-[2.5]" />
            <span>{{ authStore.isLoading ? 'Registrando...' : 'Crear Cuenta Administrador' }}</span>
          </BaseButton>
        </div>

      </form>

    </main>

    <!-- ENLACES DE RETORNO -->
    <footer class="space-y-2 pt-2">
      <button 
        type="button"
        @click="handleGoToLogin"
        class="w-full text-center text-xs font-black text-brand-accent hover:underline p-2 flex items-center justify-center gap-1"
      >
        <ShieldCheck class="w-4 h-4 stroke-[2.5]" />
        <span>¿Ya tienes cuenta? Iniciar Sesión</span>
      </button>

      <BaseButton variant="outline" size="lg" fullWidth @click="handleBackToHome">
        <ArrowLeft class="w-5 h-5 mr-1.5 stroke-[2.5]" />
        Volver al Menú Público
      </BaseButton>
    </footer>

  </div>
</template>