<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Save, Plus, Trash2 } from 'lucide-vue-next'
import type { CampingSite } from '../../types/catalog'
import ImageGalleryEditor from '../ui/ImageGalleryEditor.vue'

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

const newFeatureInput = ref('')

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

function addFeature() {
  const trimmed = newFeatureInput.value.trim()
  if (trimmed) {
    if (!form.value.features) form.value.features = []
    if (!form.value.features.includes(trimmed)) {
      form.value.features.push(trimmed)
    }
    newFeatureInput.value = ''
  }
}

function removeFeature(idx: number) {
  if (form.value.features) {
    form.value.features.splice(idx, 1)
  }
}

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
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white w-full max-w-lg rounded-3xl border-2 border-brand-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="p-4 sm:p-5 border-b-2 border-brand-border bg-brand-light flex items-center justify-between">
        <div>
          <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">
            Catálogo de Camping
          </span>
          <h3 class="text-lg font-black text-brand-dark leading-tight">
            {{ isEditing ? 'Editar ' + form.name : 'Nuevo Espacio Camping' }}
          </h3>
        </div>
        <button type="button" @click="close" class="p-2 rounded-full bg-white border border-brand-border text-brand-dark hover:bg-gray-100">
          <X class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSave" class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-bold grow">
        <div>
          <label class="block text-gray-700 mb-1">Nombre del Espacio *</label>
          <input v-model="form.name" required type="text" placeholder="Ej: Camping Zona General" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-gray-700 mb-1">Precio x Persona (\$) *</label>
            <input v-model.number="form.pricePerPerson" required type="number" min="0" step="500" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
          </div>

          <div>
            <label class="block text-gray-700 mb-1">Modalidad *</label>
            <select v-model="form.modality" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs">
              <option value="pernoctar">Pernoctar (Noche)</option>
              <option value="diario">Diario (Día de campo)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-gray-700 mb-1">Capacidad Mínima</label>
            <input v-model.number="form.minCapacity" required type="number" min="1" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
          </div>
          <div>
            <label class="block text-gray-700 mb-1">Capacidad Máxima</label>
            <input v-model.number="form.maxCapacity" required type="number" min="1" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
          </div>
        </div>

        <div class="flex items-center gap-2 p-3 bg-brand-light rounded-xl border border-brand-border">
          <input v-model="form.isSpecial" type="checkbox" id="isSpecial" class="w-4 h-4 rounded text-brand-dark" />
          <label for="isSpecial" class="text-xs font-black text-brand-dark cursor-pointer">
            Espacio Especial / Grupos Grandes
          </label>
        </div>

        <div>
          <label class="block text-gray-700 mb-1">Descripción</label>
          <textarea v-model="form.description" rows="2" placeholder="Espacio rodeado de naturaleza con acceso a baños..." class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs"></textarea>
        </div>

        <!-- Galería de Fotos (hasta 6) -->
        <ImageGalleryEditor
          v-model:images="form.images!"
          v-model:mainImage="form.image"
          :max-images="6"
          label="Fotografías del Espacio"
        />

        <!-- Equipamientos -->
        <div class="space-y-2 pt-1">
          <label class="block text-gray-700">Servicios Incluidos:</label>
          <div class="flex gap-2">
            <input v-model="newFeatureInput" type="text" placeholder="Ej: Duchas con agua caliente" class="flex-1 p-2.5 rounded-xl border-2 border-brand-border bg-brand-light text-xs font-bold" @keyup.enter.prevent="addFeature" />
            <button type="button" @click="addFeature" class="px-3.5 bg-brand-dark text-white rounded-xl font-black text-xs flex items-center gap-1">
              <Plus class="w-3.5 h-3.5 stroke-[2.5]" /> Agregar
            </button>
          </div>

          <div v-if="form.features && form.features.length > 0" class="flex flex-wrap gap-1.5 pt-1">
            <span v-for="(feat, idx) in form.features" :key="idx" class="px-2.5 py-1 bg-brand-light border border-brand-border rounded-lg text-xs font-bold flex items-center gap-1 text-brand-dark">
              {{ feat }}
              <button type="button" @click="removeFeature(idx)" class="text-rose-600 hover:text-rose-800 ml-1">
                <Trash2 class="w-3 h-3 stroke-[2.5]" />
              </button>
            </span>
          </div>
        </div>

        <!-- Botones -->
        <div class="pt-2 flex gap-2">
          <button type="button" @click="close" class="flex-1 py-3 bg-brand-light border-2 border-brand-border rounded-2xl font-black text-brand-dark">Cancelar</button>
          <button type="submit" class="flex-1 py-3 bg-brand-dark text-white rounded-2xl font-black border-2 border-brand-dark flex items-center justify-center gap-1.5">
            <Save class="w-4 h-4 stroke-[2.5]" /> Guardar Espacio
          </button>
        </div>
      </form>
    </div>
  </div>
</template>