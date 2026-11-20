<script setup lang="ts">
// Envuelve una vista del panel mientras llegan los datos del administrador tras iniciar sesión (SCRUM-258):
// con los datos listos muestra la vista; cargando, su esqueleto (y a los 8 segundos "Está tardando más de lo
// normal" con Reintentar); si falló, el motivo con Reintentar.
import { computed } from 'vue'
import BaseButton from '../ui/BaseButton.vue'
import { useAvisoDeEspera } from '../../lib/avisoDeEspera'
import { useAuthStore } from '../../stores/authStore'

const auth = useAuthStore()
const cargando = computed(() => auth.datosAdmin === 'cargando')
const { tardando } = useAvisoDeEspera(cargando)
</script>

<template>
  <slot v-if="auth.datosAdmin === 'listo'" />
  <div v-else class="max-w-md mx-auto w-full pb-28 space-y-3">
    <div v-if="auth.datosAdmin === 'error'" class="border-2 border-status-danger bg-rose-50 rounded-2xl p-3 space-y-2" role="alert">
      <p class="text-base font-bold text-rose-950">{{ auth.errorDatosAdmin || 'No se pudieron cargar los datos.' }} Revisa tu conexión e inténtalo de nuevo.</p>
      <BaseButton variant="outline" size="md" class="!text-base" @click="auth.cargarDatosAdmin()">Reintentar</BaseButton>
    </div>
    <template v-else>
      <div v-if="tardando" class="border-2 border-amber-500 bg-amber-50 rounded-2xl p-3 space-y-2" role="status">
        <p class="text-base font-bold text-amber-950">Está tardando más de lo normal. Puedes seguir esperando o reintentar.</p>
        <BaseButton variant="outline" size="md" class="!text-base" @click="auth.cargarDatosAdmin()">Reintentar</BaseButton>
      </div>
      <div role="status" aria-busy="true" aria-label="Cargando">
        <slot name="esqueleto" />
      </div>
    </template>
  </div>
</template>
