<script setup lang="ts">
import { Clock, LogIn, LogOut } from 'lucide-vue-next'

// Muestra de forma destacada la hora de ingreso y de salida del servicio.
defineProps<{
  ingreso: string
  salida: string
  titulo?: string
  // En el camping por el día la salida ocurre el mismo día
  salidaMismoDia?: boolean
}>()
</script>

<template>
  <div class="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-3.5 space-y-2.5">
    <div class="flex items-center gap-2 text-emerald-950">
      <Clock class="w-5 h-5 text-emerald-700 stroke-[2.5]" />
      <h3 class="text-sm font-black">{{ titulo ?? 'Horarios' }}</h3>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div class="bg-white rounded-xl border border-emerald-200 p-2.5">
        <span class="flex items-center gap-1 text-sm font-extrabold text-gray-600">
          <LogIn class="w-4 h-4 stroke-[2.5]" /> Ingreso
        </span>
        <span class="text-xl font-black text-brand-dark block leading-tight">{{ ingreso }} hrs</span>
      </div>
      <div class="bg-white rounded-xl border border-emerald-200 p-2.5">
        <span class="flex items-center gap-1 text-sm font-extrabold text-gray-600">
          <LogOut class="w-4 h-4 stroke-[2.5]" /> Salida
        </span>
        <span class="text-xl font-black text-brand-dark block leading-tight">{{ salida }} hrs</span>
        <span v-if="salidaMismoDia" class="text-sm font-bold text-gray-600">Mismo día</span>
      </div>
    </div>
  </div>
</template>
