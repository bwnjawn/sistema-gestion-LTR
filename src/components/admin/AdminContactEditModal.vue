<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Save, Phone, Mail, MapPin, Globe } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import BaseButton from '../ui/BaseButton.vue'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const settingsStore = useSettingsStore()

const form = ref({
  phone1: settingsStore.contactInfo.phone1 || '',
  phone2: settingsStore.contactInfo.phone2 || '',
  email: settingsStore.contactInfo.email || '',
  address: settingsStore.contactInfo.address || '',
  websiteDisplay: settingsStore.contactInfo.websiteDisplay || '',
  instagramUser: settingsStore.contactInfo.instagramUser || ''
})

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    form.value = {
      phone1: settingsStore.contactInfo.phone1 || '',
      phone2: settingsStore.contactInfo.phone2 || '',
      email: settingsStore.contactInfo.email || '',
      address: settingsStore.contactInfo.address || '',
      websiteDisplay: settingsStore.contactInfo.websiteDisplay || '',
      instagramUser: settingsStore.contactInfo.instagramUser || ''
    }
  }
})

function handleSave() {
  settingsStore.updateContactInfo({
    phone1: form.value.phone1,
    phone2: form.value.phone2,
    email: form.value.email,
    address: form.value.address,
    websiteDisplay: form.value.websiteDisplay,
    instagramUser: form.value.instagramUser
  })
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl p-5 max-w-sm w-full border-2 border-brand-border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
      
      <!-- Encabezado del Modal -->
      <div class="flex items-center justify-between border-b border-gray-100 pb-2">
        <h3 class="text-sm font-black text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
          <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
          Editar Información de Contacto
        </h3>
        <button type="button" @click="emit('close')" class="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
          <X class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSave" class="space-y-3 text-xs font-bold">
        <div>
          <label class="block text-gray-700 mb-1 flex items-center gap-1.5">
            <Phone class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Teléfono Principal (Teléfono 1)
          </label>
          <input 
            v-model="form.phone1" 
            type="text" 
            class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" 
          />
        </div>

        <div>
          <label class="block text-gray-700 mb-1 flex items-center gap-1.5">
            <Phone class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Teléfono Secundario (Teléfono 2)
          </label>
          <input 
            v-model="form.phone2" 
            type="text" 
            class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" 
          />
        </div>

        <div>
          <label class="block text-gray-700 mb-1 flex items-center gap-1.5">
            <Mail class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Correo Electrónico
          </label>
          <input 
            v-model="form.email" 
            type="email" 
            class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" 
          />
        </div>

        <div>
          <label class="block text-gray-700 mb-1 flex items-center gap-1.5">
            <MapPin class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Dirección Completa
          </label>
          <input 
            v-model="form.address" 
            type="text" 
            class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" 
          />
        </div>

        <div>
          <label class="block text-gray-700 mb-1 flex items-center gap-1.5">
            <Globe class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Sitio Web
          </label>
          <input 
            v-model="form.websiteDisplay" 
            type="text" 
            class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" 
          />
        </div>

        <div>
          <label class="block text-gray-700 mb-1 flex items-center gap-1.5">
            <Globe class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
            Usuario Instagram
          </label>
          <input 
            v-model="form.instagramUser" 
            type="text" 
            class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" 
          />
        </div>

        <div class="flex gap-2 pt-2">
          <BaseButton variant="outline" class="flex-1" type="button" @click="emit('close')">
            Cancelar
          </BaseButton>
          <BaseButton variant="primary" class="flex-1" type="submit">
            <Save class="w-4 h-4 mr-1 stroke-[2.5]" /> Guardar
          </BaseButton>
        </div>
      </form>

    </div>
  </div>
</template>