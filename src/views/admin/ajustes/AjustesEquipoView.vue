<script setup lang="ts">
// Ajustes → Equipo: quiénes tienen acceso al panel de administración.
import { useRouter } from 'vue-router'
import { ShieldCheck, UserPlus } from 'lucide-vue-next'
import { useAuthStore } from '../../../stores/authStore'
import AjustesVolver from '../../../components/admin/AjustesVolver.vue'

const authStore = useAuthStore()
const router = useRouter()
</script>

<template>
  <div class="space-y-4 max-w-md lg:max-w-none mx-auto w-full pb-20 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start">
    <AjustesVolver class="lg:col-span-full" />

    <div class="bg-white p-4 sm:p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <ShieldCheck class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <h3 class="text-base font-bold text-brand-dark">Administradores</h3>
        </div>
        <button type="button" @click="router.push({ name: 'admin-register' })" class="py-1.5 px-3 bg-brand-light border border-brand-border text-brand-dark font-bold text-sm rounded-xl hover:bg-gray-100 flex items-center gap-1">
          <UserPlus class="w-3.5 h-3.5 stroke-[2.5]" /> Agregar
        </button>
      </div>
      <ul class="space-y-1.5 text-base text-gray-700 bg-brand-light p-3 rounded-2xl border border-brand-border">
        <li v-for="admin in authStore.adminsList" :key="admin.id" class="flex flex-wrap justify-between gap-x-3 gap-y-0.5">
          <span class="text-brand-dark">{{ admin.name }}</span>
          <span class="text-gray-700 break-all">{{ admin.email }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>
