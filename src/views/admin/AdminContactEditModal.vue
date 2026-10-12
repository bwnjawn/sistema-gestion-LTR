<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Save, Phone, Mail, Globe, Instagram, MapPin, Map } from 'lucide-vue-next'
import { useSettingsStore } from '../../stores/settingsStore'
import type { BusinessInfo } from '../../types/settings'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const settingsStore = useSettingsStore()

const form = ref<BusinessInfo>({
  phone1: '',
  phone2: '',
  email: '',
  websiteDisplay: '',
  websiteUrl: '',
  instagramUser: '',
  instagramUrl: '',
  address: '',
  mapsUrl: '',
  iframeMapUrl: ''
})

watch(() => props.isOpen, (open) => {
  if (open) {
    form.value = { ...settingsStore.contactInfo }
  }
}, { immediate: true })

function handleSave() {
  settingsStore.updateContactInfo(form.value)
  emit('close')
}

function close() {
  emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white w-full max-w-lg rounded-3xl border-2 border-brand-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="p-4 sm:p-5 border-b-2 border-brand-border bg-brand-light flex items-center justify-between">
        <div>
          <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">
            Información Institucional
          </span>
          <h3 class="text-lg font-black text-brand-dark leading-tight">
            Editar Datos de Contacto
          </h3>
        </div>
        <button type="button" @click="close" class="p-2 rounded-full bg-white border border-brand-border text-brand-dark hover:bg-gray-100">
          <X class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSave" class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-bold grow">
        <!-- Teléfonos -->
        <div class="space-y-2">
          <label class="block text-brand-dark font-black flex items-center gap-1.5">
            <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Teléfonos de Contacto
          </label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] text-gray-500 block mb-0.5">Teléfono Principal *</span>
              <input v-model="form.phone1" required type="text" placeholder="+56 9 8502 5056" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs" />
            </div>
            <div>
              <span class="text-[10px] text-gray-500 block mb-0.5">Teléfono Secundario</span>
              <input v-model="form.phone2" type="text" placeholder="+56 9 9588 3385" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs" />
            </div>
          </div>
        </div>

        <!-- Correo Electrónico -->
        <div>
          <label class="block text-brand-dark font-black flex items-center gap-1.5 mb-1">
            <Mail class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Correo Electrónico *
          </label>
          <input v-model="form.email" required type="email" placeholder="lostroncosderepil@gmail.com" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs" />
        </div>

        <!-- Sitio Web -->
        <div class="space-y-2">
          <label class="block text-brand-dark font-black flex items-center gap-1.5">
            <Globe class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Sitio Web
          </label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] text-gray-500 block mb-0.5">Texto a mostrar</span>
              <input v-model="form.websiteDisplay" type="text" placeholder="www.lostroncosderepil.cl" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs" />
            </div>
            <div>
              <span class="text-[10px] text-gray-500 block mb-0.5">Enlace URL (https://)</span>
              <input v-model="form.websiteUrl" type="url" placeholder="https://www.lostroncosderepil.cl" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs" />
            </div>
          </div>
        </div>

        <!-- Instagram -->
        <div class="space-y-2">
          <label class="block text-brand-dark font-black flex items-center gap-1.5">
            <Instagram class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Redes Sociales (Instagram)
          </label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] text-gray-500 block mb-0.5">Usuario</span>
              <input v-model="form.instagramUser" type="text" placeholder="@lostroncosderepil" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs" />
            </div>
            <div>
              <span class="text-[10px] text-gray-500 block mb-0.5">URL Perfil</span>
              <input v-model="form.instagramUrl" type="url" placeholder="https://instagram.com/lostroncosderepil" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs" />
            </div>
          </div>
        </div>

        <!-- Dirección y Mapas -->
        <div class="space-y-2">
          <label class="block text-brand-dark font-black flex items-center gap-1.5">
            <MapPin class="w-4 h-4 text-brand-accent stroke-[2.5]" />
            Ubicación y Mapa GPS
          </label>
          <div>
            <span class="text-[10px] text-gray-500 block mb-0.5">Dirección Física *</span>
            <input v-model="form.address" required type="text" placeholder="Sector Repil s/n, Fresia" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="text-[10px] text-gray-500 block mb-0.5">Enlace Google Maps</span>
              <input v-model="form.mapsUrl" type="url" placeholder="https://maps.google.com/..." class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs" />
            </div>
            <div>
              <span class="text-[10px] text-gray-500 block mb-0.5">URL iFrame (Mapa)</span>
              <input v-model="form.iframeMapUrl" type="text" placeholder="https://www.google.com/maps/embed?..." class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs" />
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="pt-2 flex gap-2">
          <button type="button" @click="close" class="flex-1 py-3 bg-brand-light border-2 border-brand-border rounded-2xl font-black text-brand-dark">Cancelar</button>
          <button type="submit" class="flex-1 py-3 bg-brand-dark text-white rounded-2xl font-black border-2 border-brand-dark flex items-center justify-center gap-1.5">
            <Save class="w-4 h-4 stroke-[2.5]" /> Guardar Cambios
          </button>
        </div>
      </form>
    </div>
  </div>
</template>