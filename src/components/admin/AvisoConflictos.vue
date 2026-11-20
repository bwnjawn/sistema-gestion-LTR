<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { TriangleAlert } from 'lucide-vue-next'
import { useRequestsStore } from '../../stores/requestsStore'

// Aviso del Inicio del panel: reservas que alguien confirmó sin conexión y que chocaron con otra al sincronizar
// (SCRUM-250). Quedaron pendientes, sin perderse; un administrador debe moverlas o rechazarlas.
const router = useRouter()
const solicitudes = useRequestsStore()
const enConflicto = computed(() => solicitudes.requests.filter(r => r.enConflicto && r.status === 'pending'))
const texto = computed(() =>
  enConflicto.value.length === 1 ? '1 reserva en conflicto, por resolver' : `${enConflicto.value.length} reservas en conflicto, por resolver`
)
</script>

<template>
  <button
    v-if="enConflicto.length > 0"
    type="button"
    role="alert"
    class="w-full text-left bg-rose-50 border-2 border-status-danger rounded-3xl p-4 text-rose-950 active:scale-98 transition-transform"
    @click="router.push('/admin/solicitudes?estado=pending')"
  >
    <span class="flex items-center gap-2 text-base font-black">
      <TriangleAlert class="w-5 h-5 stroke-[2.5] shrink-0" aria-hidden="true" />
      {{ texto }}
    </span>
    <span class="block text-sm font-bold mt-1">
      Se confirmaron sin conexión y chocan con otra reserva. No se perdieron: quedaron pendientes. Contacta al cliente y muévelas de fecha o recházalas.
    </span>
  </button>
</template>
