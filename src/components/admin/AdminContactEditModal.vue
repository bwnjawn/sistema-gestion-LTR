<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useSettingsStore } from '../../stores/settingsStore'
import HojaModal from '../ui/HojaModal.vue'
import UbicacionHoja from './UbicacionHoja.vue'
import { buildWebsiteUrl, buildInstagramUrl, cleanInstagramUser } from '../../lib/contactLinks'
import { DIRECCION_POR_DEFECTO, coordenadasDeContacto, enlaceDeMapa, mapaIncrustado, textoCoordenadas, type Coordenadas } from '../../services/ubicacion'

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

// Punto exacto del local (SCRUM-281): solo se guarda si el administrador lo marcó en el mapa en esta edición
const punto = ref<Coordenadas | null>(coordenadasDeContacto(settingsStore.contactInfo))
const puntoCambiado = ref(false)
const mapaAbierto = ref(false)
const textoPunto = computed(() =>
  punto.value
    ? `Punto marcado: ${textoCoordenadas(punto.value)}`
    : 'Aún no marcaste el punto exacto: el mapa del cliente se busca con la dirección escrita.'
)

function usarPunto(nuevo: Coordenadas) {
  punto.value = nuevo
  puntoCambiado.value = true
  mapaAbierto.value = false
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    punto.value = coordenadasDeContacto(settingsStore.contactInfo)
    puntoCambiado.value = false
    mapaAbierto.value = false
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
    // El mapa y el enlace "Cómo llegar" salen del punto marcado. Si no se tocó el punto, se conserva el que había
    // (cambiar solo el texto de la dirección ya no mueve el mapa).
    ...(puntoCambiado.value && punto.value
      ? {
          latitude: punto.value.lat,
          longitude: punto.value.lng,
          mapsUrl: enlaceDeMapa(punto.value),
          iframeMapUrl: mapaIncrustado(punto.value)
        }
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
      <label for="contacto-address" class="campo-etiqueta">Referencia de la dirección (opcional)</label>
      <input id="contacto-address" v-model="form.address" type="text" :placeholder="DIRECCION_POR_DEFECTO" class="campo-entrada" />
      <p class="campo-ayuda">Es solo un texto para el cliente; el mapa sale del punto que marques abajo. Si lo dejas vacío, el cliente ve la referencia de siempre.</p>
    </div>
    <div>
      <span class="campo-etiqueta">Ubicación en el mapa</span>
      <p class="campo-ayuda !mt-0 mb-2">{{ textoPunto }}</p>
      <button type="button" class="w-full py-3 rounded-xl border border-brand-dark text-brand-dark font-bold active:scale-95" @click="mapaAbierto = true">
        {{ punto ? 'Cambiar el punto en el mapa' : 'Marcar en el mapa' }}
      </button>
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

  <UbicacionHoja :abierto="mapaAbierto" :punto="punto" :direccion="form.address" @cerrar="mapaAbierto = false" @usar="usarPunto" />
</template>
