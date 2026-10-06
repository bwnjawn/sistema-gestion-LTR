<template>
  <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-[#e3eae1]/95 backdrop-blur-md border-t-2 border-brand-border p-2 shadow-2xl">
    <div class="grid grid-cols-5 gap-1">
      <button 
        v-for="item in navItems" 
        :key="item.routeName" 
        type="button" 
        @click="navigateTo(item.routeName)"
        :class="[
          'py-2 px-1 rounded-2xl font-black text-[10px] leading-tight flex flex-col items-center justify-center gap-1 border touch-target active:scale-95 transition-all relative',
          isActive(item.routeName)
            ? 'bg-[#c5d7be] text-brand-dark border-brand-border shadow-2xs font-black'
            : 'bg-white/60 hover:bg-white text-gray-600 border-brand-border/60 font-extrabold'
        ]"
      >
        <component :is="item.icon" class="w-4 h-4 stroke-[2.5]" />
        <span class="truncate max-w-full">{{ item.name }}</span>

        <!-- Badge numérico para Solicitudes pendientes -->
        <span 
          v-if="item.badge && item.badge > 0" 
          class="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-xs"
        >
          {{ item.badge }}
        </span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/adminStore'
import { 
  Home, 
  Calendar, 
  ClipboardList, 
  Edit3, 
  MoreHorizontal 
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const adminStore = useAdminStore()

const pendingRequestsCount = computed(() => adminStore.pendingRequests?.length || 0)

const navItems = computed(() => [
  { name: 'Inicio', routeName: 'admin-dashboard', icon: Home },
  { name: 'Calendario', routeName: 'admin-calendar', icon: Calendar },
  { name: 'Solicitudes', routeName: 'admin-requests', icon: ClipboardList, badge: pendingRequestsCount.value },
  { name: 'Editar', routeName: 'admin-edit', icon: Edit3 },
  { name: 'Más', routeName: 'admin-more', icon: MoreHorizontal }
])

const isActive = (routeName: string) => route.name === routeName

const navigateTo = (routeName: string) => {
  if (route.name !== routeName) {
    router.push({ name: routeName })
  }
}
</script>