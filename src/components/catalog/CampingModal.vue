<script setup lang="ts">
import { useBloqueoScroll } from '../../composables/useBloqueoScroll'
import { ref, watch, computed } from 'vue'
import type { CampingSite } from '../../types/catalog'
import ImageGalleryEditor from '../ui/ImageGalleryEditor.vue'
import ListaEtiquetas from '../ui/ListaEtiquetas.vue'
import ModalEdicion from '../ui/ModalEdicion.vue'

const props = defineProps<{
  isOpen: boolean
  site?: CampingSite | null
  isEditable?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', siteData: Partial<CampingSite>): void
}>()

const isEditing = ref(false)

const form = ref<Partial<CampingSite>>({
  name: '',
  description: '',
  pricePerPerson: 10000,
  minCapacity: 1,
  maxCapacity: 10,
  isSpecial: false,
  modality: 'pernoctar',
  image: '',
  images: [],
  features: []
})

watch(() => props.site, (newSite) => {
  if (newSite) {
    isEditing.value = true
    form.value = {
      name: newSite.name || '',
      description: newSite.description || '',
      pricePerPerson: newSite.pricePerPerson || 10000,
      minCapacity: newSite.minCapacity ?? 1,
      maxCapacity: newSite.maxCapacity ?? 10,
      isSpecial: newSite.isSpecial ?? false,
      modality: newSite.modality || 'pernoctar',
      image: newSite.image || '',
      images: newSite.images ? [...newSite.images] : (newSite.image ? [newSite.image] : []),
      features: newSite.features ? [...newSite.features] : []
    }
  } else {
    isEditing.value = false
    form.value = {
      name: '',
      description: '',
      pricePerPerson: 10000,
      minCapacity: 1,
      maxCapacity: 10,
      isSpecial: false,
      modality: 'pernoctar',
      image: '',
      images: [],
      features: []
    }
  }
}, { immediate: true })

function handleSave() {
  emit('save', {
    ...form.value,
    image: form.value.image || (form.value.images && form.value.images[0]) || ''
  })
  emit('close')
}

function close() {
  emit('close')
}
useBloqueoScroll(computed(() => props.isOpen))
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90dvh] flex flex-col">
      <ModalEdicion
        :titulo="isEditing ? 'Editar espacio de camping' : 'Nuevo espacio de camping'"
        :subtitulo="isEditing ? form.name : undefined"
        texto-guardar="Guardar espacio"
        @cerrar="close"
        @guardar="handleSave"
      >
        <div>
          <label class="campo-etiqueta" for="camping-nombre">Nombre del espacio</label>
          <input id="camping-nombre" v-model="form.name" required type="text" placeholder="Ej: Camping zona general" class="campo-entrada" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="campo-etiqueta" for="camping-precio">Precio por persona</label>
            <input id="camping-precio" v-model.number="form.pricePerPerson" required type="number" inputmode="numeric" min="0" step="500" class="campo-entrada" />
          </div>
          <div>
            <label class="campo-etiqueta" for="camping-modalidad">Modalidad</label>
            <select id="camping-modalidad" v-model="form.modality" class="campo-entrada">
              <option value="pernoctar">Con noche</option>
              <option value="diario">Por el día</option>
              <option value="ambos">Día y noche</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="campo-etiqueta" for="camping-min">Personas mínimo</label>
            <input id="camping-min" v-model.number="form.minCapacity" required type="number" inputmode="numeric" min="1" class="campo-entrada" />
          </div>
          <div>
            <label class="campo-etiqueta" for="camping-max">Personas máximo</label>
            <input id="camping-max" v-model.number="form.maxCapacity" required type="number" inputmode="numeric" min="1" class="campo-entrada" />
          </div>
        </div>

        <label class="flex items-center gap-3 cursor-pointer">
          <input v-model="form.isSpecial" type="checkbox" class="w-6 h-6 shrink-0 accent-brand-dark" />
          <span>Espacio especial para grupos grandes</span>
        </label>

        <div>
          <label class="campo-etiqueta" for="camping-descripcion">Descripción</label>
          <textarea id="camping-descripcion" v-model="form.description" rows="3" placeholder="Espacio rodeado de naturaleza con acceso a baños…" class="campo-entrada"></textarea>
        </div>

        <!-- Galería de fotos (hasta 6) -->
        <ImageGalleryEditor
          v-model:images="form.images!"
          v-model:mainImage="form.image"
          :max-images="6"
          label="Fotografías"
        />

        <ListaEtiquetas
          :model-value="form.features ?? []"
          etiqueta="Servicios incluidos"
          placeholder="Ej: Duchas con agua caliente"
          @update:model-value="form.features = $event"
        />
      </ModalEdicion>
    </div>
  </div>
</template>
