<script setup lang="ts">
// Ajustes → Datos del negocio: contacto y transferencia (lo que ve el cliente en la app). Los horarios están en el Catálogo.
import { ref } from 'vue'
import { Phone, MapPin, Mail, Globe, Instagram, Landmark } from 'lucide-vue-next'
import { useSettingsStore } from '../../../stores/settingsStore'
import AdminContactEditModal from '../../../components/admin/AdminContactEditModal.vue'
import AdminTransferEditModal from '../../../components/admin/AdminTransferEditModal.vue'
import AjustesVolver from '../../../components/admin/AjustesVolver.vue'

const settingsStore = useSettingsStore()

const showContactModal = ref(false)
const showTransferModal = ref(false)
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-20">
    <AjustesVolver />

    <div class="bg-white p-4 sm:p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <h3 class="text-base font-bold text-brand-dark">Datos de contacto</h3>
        </div>
        <button type="button" @click="showContactModal = true" class="py-1.5 px-3 bg-brand-light border border-brand-border text-brand-dark font-bold text-sm rounded-xl hover:bg-gray-100">
          Editar
        </button>
      </div>

      <div class="space-y-2 text-base text-gray-700 bg-brand-light p-3 rounded-2xl border border-brand-border">
        <div class="flex items-center gap-2">
          <Phone class="w-3.5 h-3.5 text-gray-700" />
          <span>{{ settingsStore.contactInfo.phone1 }}<template v-if="settingsStore.contactInfo.phone2"> y {{ settingsStore.contactInfo.phone2 }}</template></span>
        </div>
        <div class="flex items-center gap-2">
          <Mail class="w-3.5 h-3.5 text-gray-700" />
          <span>{{ settingsStore.contactInfo.email }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Globe class="w-3.5 h-3.5 text-gray-700" />
          <span>{{ settingsStore.contactInfo.websiteDisplay }}</span>
        </div>
        <div class="flex items-center gap-2">
          <Instagram class="w-3.5 h-3.5 text-gray-700" />
          <span>{{ settingsStore.contactInfo.instagramUser }}</span>
        </div>
        <div class="flex items-start gap-2 pt-1 border-t border-brand-border/60">
          <MapPin class="w-3.5 h-3.5 text-gray-700 shrink-0 mt-0.5" />
          <span class="leading-tight">{{ settingsStore.direccionDelLocal }}</span>
        </div>
      </div>
    </div>

    <div class="bg-white p-4 sm:p-5 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Landmark class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          <h3 class="text-base font-bold text-brand-dark">Datos de transferencia</h3>
        </div>
        <button type="button" @click="showTransferModal = true" class="py-1.5 px-3 bg-brand-light border border-brand-border text-brand-dark font-bold text-sm rounded-xl hover:bg-gray-100">
          Editar
        </button>
      </div>

      <div class="space-y-1 text-base text-gray-700 bg-brand-light p-3 rounded-2xl border border-brand-border">
        <p>{{ settingsStore.transferInfo.bank }} · {{ settingsStore.transferInfo.accountType }}</p>
        <p>Cuenta {{ settingsStore.transferInfo.accountNumber }}</p>
        <p>{{ settingsStore.transferInfo.holderName }} · {{ settingsStore.transferInfo.holderRut }}</p>
        <p class="text-gray-700">{{ settingsStore.transferInfo.email }}</p>
      </div>
    </div>

    <AdminContactEditModal :is-open="showContactModal" @close="showContactModal = false" />
    <AdminTransferEditModal :is-open="showTransferModal" @close="showTransferModal = false" />
  </div>
</template>
