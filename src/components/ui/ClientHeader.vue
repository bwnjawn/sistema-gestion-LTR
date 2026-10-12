<script setup lang="ts">
import { Phone, WifiOff } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'

const settingsStore = useSettingsStore()
</script>

<template>
  <header class="bg-white border-b-2 border-brand-border sticky top-0 z-40 px-4 py-3 shadow-2xs">
    <div class="max-w-md mx-auto flex items-center justify-between">
      <!-- Logo e Identificación -->
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 rounded-xl bg-brand-dark text-white flex items-center justify-center font-black text-xs border border-brand-border">
          TR
        </div>
        <div>
          <h1 class="text-xs font-black text-brand-dark leading-tight">Los Troncos de Repil</h1>
          <span class="text-[10px] font-bold text-gray-500 block leading-none">Reservas Online</span>
        </div>
      </div>

      <!-- Acciones de Cabecera -->
      <div class="flex items-center gap-2">
        <!-- Indicador Offline -->
        <span v-if="!settingsStore.isConnected" class="flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-1 rounded-lg border border-amber-300">
          <WifiOff class="w-3 h-3" /> Offline
        </span>

        <!-- Botón Llamar -->
        <a
          :href="'tel:' + settingsStore.phone1Clean"
          class="p-2 rounded-xl bg-brand-light border border-brand-border text-brand-dark hover:bg-gray-100 active:scale-95 transition-all flex items-center gap-1 text-xs font-black"
          title="Llamar directamente"
        >
          <Phone class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
          <span class="hidden sm:inline">Contacto</span>
        </a>
      </div>
    </div>
  </header>
</template>