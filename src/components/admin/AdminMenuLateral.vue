<script setup lang="ts">
// Menú lateral del panel en pantallas de PC (desde 1024 px, SCRUM-278). En el teléfono no se ve:
// ahí se usa la barra inferior (`AdminBottomNav`). Ícono + texto, para que no haya que adivinar.
import { Plus } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useMenuAdmin } from '../../composables/useMenuAdmin'
import IconoBarra from '../ui/IconoBarra.vue'

const router = useRouter()
const { secciones, pendientes, textoPendientes, estaActiva, ir } = useMenuAdmin()

function nuevaReserva() {
  router.push({ name: 'admin-nueva-reserva' })
}
</script>

<template>
  <aside class="hidden lg:flex fixed inset-y-0 left-0 w-64 z-40 flex-col gap-1 bg-white border-r border-gray-200 px-3.5 py-5">
    <button
      type="button"
      class="flex items-center gap-3 px-2 pb-5 text-left"
      aria-label="Ir al inicio del panel"
      @click="ir('/admin')"
    >
      <img src="/images/logo-negro.png" alt="" class="w-10 h-10 rounded-xl border border-gray-200 object-cover shrink-0" />
      <span class="min-w-0">
        <span class="block text-base font-bold text-brand-dark leading-tight">Los Troncos de Repil</span>
        <span class="block text-sm text-gray-600">Panel de administración</span>
      </span>
    </button>

    <nav aria-label="Secciones del panel" class="flex flex-col gap-1">
      <button
        v-for="item in secciones"
        :key="item.path"
        type="button"
        :aria-current="estaActiva(item.path) ? 'page' : undefined"
        :class="[
          'flex items-center gap-3 w-full px-3 py-3 rounded-xl text-base text-left transition-colors',
          estaActiva(item.path) ? 'bg-emerald-50 text-brand-dark font-bold' : 'text-gray-700 hover:bg-gray-100'
        ]"
        @click="ir(item.path)"
      >
        <span class="shrink-0 [&_svg]:w-6 [&_svg]:h-6"><IconoBarra :nombre="item.icono" :activo="estaActiva(item.path)" /></span>
        <span>{{ item.name }}</span>
        <span
          v-if="item.icono === 'solicitudes' && pendientes > 0"
          class="ml-auto min-w-6 px-2 rounded-full bg-status-danger text-white text-sm font-bold leading-6 text-center"
          :aria-label="`${pendientes} pendientes`"
        >{{ textoPendientes }}</span>
      </button>
    </nav>

    <div class="grow"></div>

    <!-- Cargar una reserva con el flujo del cliente (SCRUM-56) -->
    <button
      type="button"
      class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-accent hover:bg-[#1c4c52] text-white font-bold transition-colors"
      title="Cargar una nueva reserva con el flujo del cliente"
      @click="nuevaReserva"
    >
      <Plus class="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
      Nueva reserva
    </button>
  </aside>
</template>
