<script setup lang="ts">
import { RotateCw } from 'lucide-vue-next'
import BaseAlert from './BaseAlert.vue'
import BaseButton from './BaseButton.vue'

// Avisos del último paso: sin internet o error al enviar (con reintento).
defineProps<{
  sinConexion: boolean
  error: string
  enviando?: boolean
}>()

defineEmits<{ (e: 'reintentar'): void }>()
</script>

<template>
  <div role="status" aria-live="polite">
    <BaseAlert v-if="sinConexion" variant="warning" title="Sin conexión a internet">
      Necesitas internet para enviar la solicitud. Tus datos siguen guardados; envíala cuando vuelva la conexión.
    </BaseAlert>

    <BaseAlert v-else-if="error" variant="danger" title="No se pudo enviar la solicitud">
      <p>{{ error }}</p>
      <BaseButton
        variant="outline"
        size="md"
        class="mt-3"
        :loading="enviando"
        @click="$emit('reintentar')"
      >
        <RotateCw class="w-4 h-4 mr-1.5 stroke-[2.5]" aria-hidden="true" />
        Reintentar
      </BaseButton>
    </BaseAlert>
  </div>
</template>
