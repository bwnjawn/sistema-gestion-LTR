<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import HojaModal from '../ui/HojaModal.vue'
import { buildWebsiteUrl, buildInstagramUrl, cleanInstagramUser, buildMapsUrl, buildMapEmbedUrl } from '../../lib/contactLinks'

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

async function handleSave() {
  const current = settingsStore.contactInfo
  const addressChanged = form.value.address.trim() !== (current.address || '').trim()
  const instagramUser = cleanInstagramUser(form.value.instagramUser)

  const guardado = await settingsStore.updateContactInfo({
    phone1: form.value.phone1,
    phone2: form.value.phone2,
    email: form.value.email,
    address: form.value.address,
    websiteDisplay: form.value.websiteDisplay,
    websiteUrl: buildWebsiteUrl(form.value.websiteDisplay),
    instagramUser: instagramUser ? `@${instagramUser}` : '',
    instagramUrl: buildInstagramUrl(form.value.instagramUser),
    // El mapa solo se recalcula si cambió la dirección; si no, se conserva el punto exacto actual.
    ...(addressChanged
      ? { mapsUrl: buildMapsUrl(form.value.address), iframeMapUrl: buildMapEmbedUrl(form.value.address) }
      : {})
  })
  if (guardado) emit('close')
}
</script>

<template>
  <HojaModal :abierto="isOpen" titulo="Datos de contacto" texto-guardar="Guardar" @cerrar="emit('close')" @guardar="handleSave">
    <div>
      <label for="contacto-phone1" class="campo-etiqueta">Teléfono principal</label>
      <input id="contacto-phone1" v-model="form.phone1" type="text" class="campo-entrada" />
    </div>
    <div>
      <label for="contacto-phone2" class="campo-etiqueta">Teléfono secundario (opcional)</label>
      <input id="contacto-phone2" v-model="form.phone2" type="text" class="campo-entrada" />
    </div>
    <div>
      <label for="contacto-email" class="campo-etiqueta">Correo electrónico</label>
      <input id="contacto-email" v-model="form.email" type="email" class="campo-entrada" />
    </div>
    <div>
      <label for="contacto-address" class="campo-etiqueta">Dirección</label>
      <input id="contacto-address" v-model="form.address" type="text" class="campo-entrada" />
    </div>
    <div>
      <label for="contacto-websiteDisplay" class="campo-etiqueta">Sitio web</label>
      <input id="contacto-websiteDisplay" v-model="form.websiteDisplay" type="text" class="campo-entrada" />
    </div>
    <div>
      <label for="contacto-instagramUser" class="campo-etiqueta">Usuario de Instagram</label>
      <input id="contacto-instagramUser" v-model="form.instagramUser" type="text" class="campo-entrada" />
    </div>
  </HojaModal>
</template>
