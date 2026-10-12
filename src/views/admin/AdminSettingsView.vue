<script setup lang="ts">
import { ref } from 'vue'
import { Phone, Clock, Settings, ShieldCheck, MapPin, Mail, Globe, Instagram, Home, Tent, Utensils } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import AdminContactEditModal from '../../components/admin/AdminContactEditModal.vue'
import CategorySchedulesModal from '../../components/admin/CategorySchedulesModal.vue'

const settingsStore = useSettingsStore()

const showContactModal = ref(false)
const showSchedulesModal = ref(false)
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-20">
    <!-- Header de Sección -->
    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-1">
      <div class="flex items-center gap-2 text-brand-accent">
        <Settings class="w-5 h-5 stroke-[2.5]" />
        <span class="text-xs font-black uppercase tracking-wider">Configuración General</span>
      </div>
      <h2 class="text-lg font-black text-brand-dark">Parámetros del Centro Turístico</h2>
      <p class="text-xs font-medium text-gray-600">
        Gestiona los datos de contacto público, reglas de reserva, aforos y horarios operacionales.
      </p>
    </div>

    <!-- Tarjeta: Información de Contacto -->
    <div class="bg-white p-4 sm:p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <h3 class="text-sm font-black text-brand-dark">Datos de Contacto</h3>
        </div>
        <button type="button" @click="showContactModal = true" class="py-1.5 px-3 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-100">
          Editar
        </button>
      </div>

      <div class="space-y-2 text-xs font-bold text-gray-700 bg-brand-light p-3 rounded-2xl border border-brand-border">
        <div class="flex items-center gap-2">
          <Phone class="w-3.5 h-3.5 text-gray-500" />
          <span>{{ settingsStore.contactInfo.phone1 }} / {{ settingsStore.contactInfo.phone2 }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Mail class="w-3.5 h-3.5 text-gray-500" />
          <span>{{ settingsStore.contactInfo.email }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Globe class="w-3.5 h-3.5 text-gray-500" />
          <span>{{ settingsStore.contactInfo.websiteDisplay }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Instagram class="w-3.5 h-3.5 text-gray-500" />
          <span>{{ settingsStore.contactInfo.instagramUser }}</span>
        </div>
        <div class="flex items-start gap-2 pt-1 border-t border-brand-border/60">
          <MapPin class="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
          <span class="leading-tight">{{ settingsStore.contactInfo.address }}</span>
        </div>
      </div>
    </div>

    <!-- Tarjeta: Reglas Operativas y Horarios -->
    <div class="bg-white p-4 sm:p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <h3 class="text-sm font-black text-brand-dark">Horarios y Porcentajes</h3>
        </div>
        <button type="button" @click="showSchedulesModal = true" class="py-1.5 px-3 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-100">
          Editar
        </button>
      </div>

      <div class="grid grid-cols-2 gap-2 text-xs font-bold">
        <div class="p-3 bg-brand-light rounded-2xl border border-brand-border space-y-0.5">
          <span class="text-[10px] text-gray-500 uppercase block">Abono Exigido</span>
          <span class="text-base font-black text-brand-dark">{{ settingsStore.parameters.defaultDepositPercentage }}%</span>
        </div>
        <div class="p-3 bg-brand-light rounded-2xl border border-brand-border space-y-0.5">
          <span class="text-[10px] text-gray-500 uppercase block">Margen Aforo</span>
          <span class="text-base font-black text-brand-dark">{{ settingsStore.parameters.marginPercentage }}%</span>
        </div>
      </div>

      <div class="space-y-2 text-xs font-bold text-gray-700 bg-gray-50 p-3 rounded-2xl border border-gray-200">
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1 text-brand-dark"><Home class="w-3.5 h-3.5 text-brand-accent" /> Cabañas:</span>
          <span>In {{ settingsStore.cabinSchedules.checkIn }} - Out {{ settingsStore.cabinSchedules.checkOut }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1 text-brand-dark"><Tent class="w-3.5 h-3.5 text-brand-accent" /> Camping Pernoctar:</span>
          <span>In {{ settingsStore.campingSchedules.pernoctar.checkIn }} - Out {{ settingsStore.campingSchedules.pernoctar.checkOut }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1 text-brand-dark"><Utensils class="w-3.5 h-3.5 text-brand-accent" /> Almuerzo:</span>
          <span>{{ settingsStore.restaurantSchedules.almuerzo.start }} a {{ settingsStore.restaurantSchedules.almuerzo.end }} hrs</span>
        </div>
      </div>
    </div>

    <!-- Modales -->
    <AdminContactEditModal :is-open="showContactModal" @close="showContactModal = false" />
    <CategorySchedulesModal :is-open="showSchedulesModal" @close="showSchedulesModal = false" />
  </div>
</template>