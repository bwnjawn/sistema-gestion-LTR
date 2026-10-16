<script setup lang="ts">
import { ref } from 'vue'
import { Phone, Settings, MapPin, Mail, Globe, Instagram,Utensils, Wifi, WifiOff, Users, Percent } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import AdminContactEditModal from '../../components/admin/AdminContactEditModal.vue'
import CategorySchedulesModal from '../../components/admin/CategorySchedulesModal.vue'

const settingsStore = useSettingsStore()

const showContactModal = ref(false)
const showSchedulesModal = ref(false)
const isEditingParameters = ref(false)

const editDeposit = ref(settingsStore.defaultDepositPercentage)
const editIva = ref(settingsStore.ivaPercentage)
const editMargin = ref(settingsStore.marginPercentage)
const editMaxGroups = ref(settingsStore.capacityRules.maxRestaurantGroupsPerSlot)
const editMaxCamping = ref(settingsStore.capacityRules.maxCampingPeopleCapacity)

function openParametersEdit() {
  editDeposit.value = settingsStore.defaultDepositPercentage
  editIva.value = settingsStore.ivaPercentage
  editMargin.value = settingsStore.marginPercentage
  editMaxGroups.value = settingsStore.capacityRules.maxRestaurantGroupsPerSlot
  editMaxCamping.value = settingsStore.capacityRules.maxCampingPeopleCapacity
  isEditingParameters.value = true
}

async function saveParameters() {
  await settingsStore.updateParameters({
    defaultDepositPercentage: editDeposit.value,
    ivaPercentage: editIva.value,
    marginPercentage: editMargin.value
  })
  await settingsStore.updateCapacityRules({
    maxRestaurantGroupsPerSlot: editMaxGroups.value,
    maxCampingPeopleCapacity: editMaxCamping.value,
    marginPercentage: editMargin.value
  })
  isEditingParameters.value = false
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-20">
    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-1">
      <div class="flex items-center justify-between text-brand-accent">
        <div class="flex items-center gap-2">
          <Settings class="w-5 h-5 stroke-[2.5]" />
          <span class="text-xs font-black uppercase tracking-wider">Configuración General</span>
        </div>
        <span 
          :class="[
            'px-2.5 py-1 rounded-full text-[10px] font-black flex items-center gap-1 border',
            settingsStore.isConnected 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
              : 'bg-amber-50 text-amber-800 border-amber-300'
          ]"
        >
          <component :is="settingsStore.isConnected ? Wifi : WifiOff" class="w-3.5 h-3.5 stroke-[2.5]" />
          {{ settingsStore.isConnected ? 'En Línea' : 'Sin Conexión (Offline)' }}
        </span>
      </div>
      <h2 class="text-lg font-black text-brand-dark">Parámetros del Centro Turístico</h2>
      <p class="text-xs font-medium text-gray-600">
        Gestiona los datos de contacto público, regla de IVA, aforos y horarios operacionales.
      </p>
    </div>

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

    <div class="bg-white p-4 sm:p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Percent class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <h3 class="text-sm font-black text-brand-dark">Reglas Financieras y Aforos</h3>
        </div>
        <button type="button" @click="openParametersEdit" class="py-1.5 px-3 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-100">
          Editar
        </button>
      </div>

      <div class="grid grid-cols-3 gap-2 text-xs font-bold">
        <div class="p-2.5 bg-brand-light rounded-2xl border border-brand-border text-center space-y-0.5">
          <span class="text-[9px] text-gray-500 uppercase block">Abono Exigido</span>
          <span class="text-sm font-black text-brand-dark">{{ settingsStore.defaultDepositPercentage }}%</span>
        </div>
        <div class="p-2.5 bg-brand-light rounded-2xl border border-brand-border text-center space-y-0.5">
          <span class="text-[9px] text-gray-500 uppercase block">Tasa IVA</span>
          <span class="text-sm font-black text-brand-dark">{{ settingsStore.ivaPercentage }}%</span>
        </div>
        <div class="p-2.5 bg-brand-light rounded-2xl border border-brand-border text-center space-y-0.5">
          <span class="text-[9px] text-gray-500 uppercase block">Margen Aforo</span>
          <span class="text-sm font-black text-brand-dark">{{ settingsStore.marginPercentage }}%</span>
        </div>
      </div>

      <div class="space-y-2 text-xs font-bold text-gray-700 bg-gray-50 p-3 rounded-2xl border border-gray-200">
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1 text-brand-dark"><Utensils class="w-3.5 h-3.5 text-brand-accent" /> Máx. Grupos / Turno Restorán:</span>
          <span class="font-black text-brand-dark">{{ settingsStore.capacityRules.maxRestaurantGroupsPerSlot }} grupos</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="flex items-center gap-1 text-brand-dark"><Users class="w-3.5 h-3.5 text-brand-accent" /> Capacidad Máx. Camping:</span>
          <span class="font-black text-brand-dark">{{ settingsStore.capacityRules.maxCampingPeopleCapacity }} personas</span>
        </div>
      </div>
    </div>

    <!-- Modal de Edición de Parámetros -->
    <div v-if="isEditingParameters" class="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl p-5 max-w-sm w-full border-2 border-brand-border shadow-2xl space-y-4">
        <h3 class="text-base font-black text-brand-dark border-b border-gray-100 pb-2">Editar Reglas y Parámetros</h3>
        
        <div class="space-y-3 text-xs font-bold">
          <div>
            <label class="block text-gray-600 mb-1">% Abono Requerido:</label>
            <input type="number" v-model.number="editDeposit" min="0" max="100" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" />
          </div>
          <div>
            <label class="block text-gray-600 mb-1">% Tasa de IVA:</label>
            <input type="number" v-model.number="editIva" min="0" max="100" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" />
          </div>
          <div>
            <label class="block text-gray-600 mb-1">% Margen de Aforo:</label>
            <input type="number" v-model.number="editMargin" min="0" max="100" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" />
          </div>
          <div>
            <label class="block text-gray-600 mb-1">Máx. Grupos por Turno Restaurante:</label>
            <input type="number" v-model.number="editMaxGroups" min="1" max="50" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" />
          </div>
          <div>
            <label class="block text-gray-600 mb-1">Capacidad Máxima Camping (Personas):</label>
            <input type="number" v-model.number="editMaxCamping" min="1" max="1000" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" />
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button type="button" @click="isEditingParameters = false" class="flex-1 py-2.5 rounded-xl border border-brand-border font-black text-xs">Cancelar</button>
          <button type="button" @click="saveParameters" class="flex-1 py-2.5 rounded-xl bg-brand-dark text-white font-black text-xs">Guardar</button>
        </div>
      </div>
    </div>

    <AdminContactEditModal :is-open="showContactModal" @close="showContactModal = false" />
    <CategorySchedulesModal :is-open="showSchedulesModal" @close="showSchedulesModal = false" />
  </div>
</template>