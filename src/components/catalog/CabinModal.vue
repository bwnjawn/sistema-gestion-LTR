<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, Save, Plus, Trash2, ChevronLeft, ChevronRight, Users, BedDouble, Check } from 'lucide-vue-next'
import type { Cabin } from '../../types/catalog'
import ImageGalleryEditor from '../ui/ImageGalleryEditor.vue'
import BaseButton from '../ui/BaseButton.vue'
import { formatCLP } from '../../lib/format'

const props = withDefaults(defineProps<{
  isOpen: boolean
  cabin?: Cabin | null
  isEditable?: boolean
  nightsCount?: number
}>(), {
  isEditable: false,
  nightsCount: 1
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', cabinData: Partial<Cabin>): void
  (e: 'select', cabin: Cabin): void
}>()

// ===================================================
// ESTADO Y LÓGICA MODO CLIENTE (VISUALIZACIÓN / CARRUSEL)
// ===================================================
const currentImageIndex = ref(0)

const cabinImages = computed<string[]>(() => {
  if (!props.cabin) return []
  if (props.cabin.images && props.cabin.images.length > 0) return props.cabin.images
  if (props.cabin.mainImage) return [props.cabin.mainImage]
  return ['https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80']
})

const activeImage = computed<string>(() => {
  return cabinImages.value[currentImageIndex.value] || ''
})

function prevImage() {
  if (cabinImages.value.length === 0) return
  currentImageIndex.value = (currentImageIndex.value - 1 + cabinImages.value.length) % cabinImages.value.length
}

function nextImage() {
  if (cabinImages.value.length === 0) return
  currentImageIndex.value = (currentImageIndex.value + 1) % cabinImages.value.length
}

function handleSelectFromModal() {
  if (props.cabin) {
    emit('select', props.cabin)
  }
  emit('close')
}

// ===================================================
// ESTADO Y LÓGICA MODO ADMINISTRADOR (EDICIÓN)
// ===================================================
const isEditing = ref(false)
const form = ref<Partial<Cabin>>({
  name: '',
  capacity: 2,
  pricePerNight: 50000,
  bedsDescription: '',
  description: '',
  mainImage: '',
  images: [],
  features: []
})

const newFeatureInput = ref('')

watch(() => props.cabin, (newCabin) => {
  currentImageIndex.value = 0
  if (newCabin) {
    isEditing.value = true
    const featStrings = (newCabin.features || []).map(f => typeof f === 'string' ? f : (f as any).text || (f as any).name || '')
    form.value = {
      name: newCabin.name || '',
      capacity: newCabin.capacity || 2,
      pricePerNight: newCabin.pricePerNight || 50000,
      bedsDescription: newCabin.bedsDescription || '',
      description: newCabin.description || '',
      mainImage: newCabin.mainImage || '',
      images: newCabin.images ? [...newCabin.images] : (newCabin.mainImage ? [newCabin.mainImage] : []),
      features: featStrings
    }
  } else {
    isEditing.value = false
    form.value = {
      name: '',
      capacity: 2,
      pricePerNight: 50000,
      bedsDescription: '',
      description: '',
      mainImage: '',
      images: [],
      features: []
    }
  }
}, { immediate: true })

function addFeature() {
  const trimmed = newFeatureInput.value.trim()
  if (trimmed) {
    if (!form.value.features) form.value.features = []
    const currentList = form.value.features as string[]
    if (!currentList.includes(trimmed)) {
      currentList.push(trimmed)
    }
    newFeatureInput.value = ''
  }
}

function removeFeature(idx: number) {
  if (form.value.features) {
    (form.value.features as string[]).splice(idx, 1)
  }
}

function handleSave() {
  const images = form.value.images || []
  const main = form.value.mainImage || (images.length > 0 ? images[0] : '')
  emit('save', {
    ...form.value,
    mainImage: main
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
      
      <!-- =================================================== -->
      <!-- 1. MODO CLIENTE (SOLO LECTURA CON CARRUSEL)        -->
      <!-- =================================================== -->
      <template v-if="!isEditable && cabin">
        <!-- Carrusel de Fotografías -->
        <div class="relative h-60 sm:h-64 w-full bg-black shrink-0 overflow-hidden">
          <img 
            :src="activeImage" 
            :alt="cabin.name"
            class="w-full h-full object-cover transition-all duration-300"
          />
          
          <!-- Botón Cerrar -->
          <button 
            type="button"
            @click="close"
            class="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full backdrop-blur-xs touch-target flex items-center justify-center z-10 active:scale-95"
          >
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>

          <!-- Flechas de Navegación -->
          <button 
            v-if="cabinImages.length > 1"
            type="button"
            @click="prevImage"
            class="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full touch-target flex items-center justify-center active:scale-95"
          >
            <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
          </button>

          <button 
            v-if="cabinImages.length > 1"
            type="button"
            @click="nextImage"
            class="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full touch-target flex items-center justify-center active:scale-95"
          >
            <ChevronRight class="w-5 h-5 stroke-[2.5]" />
          </button>

          <!-- Contador N/M -->
          <div v-if="cabinImages.length > 0" class="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] font-black px-3 py-1 rounded-full backdrop-blur-xs">
            {{ currentImageIndex + 1 }} / {{ cabinImages.length }}
          </div>
        </div>

        <!-- Ficha de Información de Cabaña -->
        <div class="p-5 space-y-4 overflow-y-auto grow">
          <div>
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-black text-brand-dark leading-tight">{{ cabin.name }}</h3>
              <span class="bg-brand-light text-brand-dark border border-brand-border px-3 py-1 rounded-full font-black text-xs flex items-center gap-1.5">
                <Users class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
                Hasta {{ cabin.capacity }} Personas
              </span>
            </div>
            <p v-if="cabin.bedsDescription" class="text-xs font-black text-brand-accent mt-1 flex items-center gap-1.5">
              <BedDouble class="w-4 h-4 stroke-[2.5]" />
              {{ cabin.bedsDescription }}
            </p>
          </div>

          <div v-if="cabin.description" class="space-y-1">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-wider">Descripción</h4>
            <p class="text-xs font-medium text-gray-700 leading-relaxed bg-brand-light p-3 rounded-2xl border border-brand-border">
              {{ cabin.description }}
            </p>
          </div>

          <!-- Equipamientos -->
          <div v-if="cabin.features && cabin.features.length > 0" class="space-y-2">
            <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-wider">Servicios y Equipamiento</h4>
            <div class="flex flex-wrap gap-1.5">
              <span 
                v-for="(feature, fIdx) in cabin.features" 
                :key="fIdx"
                class="bg-brand-light text-brand-dark border border-brand-border px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Check class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
                {{ typeof feature === 'string' ? feature : (feature as any).text }}
              </span>
            </div>
          </div>

          <!-- Presupuesto Estimado -->
          <div class="bg-brand-light p-4 rounded-2xl border-2 border-brand-border flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black text-gray-500 block uppercase">Tarifa por noche</span>
              <span class="text-xs font-black text-gray-800">{{ formatCLP(cabin.pricePerNight) }}</span>
            </div>
            <div class="text-right">
              <span class="text-[10px] font-black text-brand-accent block uppercase">Total por {{ nightsCount }} Noches</span>
              <span class="text-lg font-black text-brand-dark">
                {{ formatCLP(cabin.pricePerNight * nightsCount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pie de Botones -->
        <div class="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
          <BaseButton variant="outline" class="flex-1" @click="close">
            Cerrar
          </BaseButton>

          <BaseButton variant="primary" class="flex-[1.5]" @click="handleSelectFromModal">
            <Check class="w-4 h-4 mr-1 stroke-[2.5]" />
            Elegir esta Cabaña
          </BaseButton>
        </div>
      </template>

      <!-- =================================================== -->
      <!-- 2. MODO ADMINISTRADOR (FORMULARIO EDITABLE)        -->
      <!-- =================================================== -->
      <template v-else>
        <!-- Header -->
        <div class="p-4 sm:p-5 border-b-2 border-brand-border bg-brand-light flex items-center justify-between">
          <div>
            <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">
              Catálogo de Cabañas
            </span>
            <h3 class="text-lg font-black text-brand-dark leading-tight">
              {{ isEditing ? 'Editar ' + form.name : 'Nueva Cabaña' }}
            </h3>
          </div>
          <button type="button" @click="close" class="p-2 rounded-full bg-white border border-brand-border text-brand-dark hover:bg-gray-100">
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleSave" class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-bold grow">
          <div>
            <label class="block text-gray-700 mb-1">Nombre / Identificación *</label>
            <input v-model="form.name" required type="text" placeholder="Ej: Cabaña 6" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
          </div>

          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="block text-gray-700 mb-1">Capacidad Máxima *</label>
              <input v-model.number="form.capacity" required type="number" min="1" max="20" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Precio por Noche (\$) *</label>
              <input v-model.number="form.pricePerNight" required type="number" min="0" step="1000" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-gray-700 mb-1">Distribución de Camas</label>
            <input v-model="form.bedsDescription" type="text" placeholder="Ej: 1 Cama Matrimonial + 2 Literas" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" />
          </div>

          <div>
            <label class="block text-gray-700 mb-1">Descripción General</label>
            <textarea v-model="form.description" rows="2" placeholder="Cabaña totalmente equipada..." class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs"></textarea>
          </div>

          <!-- Galería de Fotos (hasta 8) -->
          <ImageGalleryEditor
            v-model:images="form.images!"
            v-model:mainImage="form.mainImage"
            :max-images="8"
            label="Fotografías de la Cabaña"
          />

          <!-- Equipamientos / Servicios -->
          <div class="space-y-2 pt-1">
            <label class="block text-gray-700">Servicios / Equipamientos:</label>
            <div class="flex gap-2">
              <input v-model="newFeatureInput" type="text" placeholder="Ej: Estufa a leña" class="flex-1 p-2.5 rounded-xl border-2 border-brand-border bg-brand-light text-xs font-bold" @keyup.enter.prevent="addFeature" />
              <button type="button" @click="addFeature" class="px-3.5 bg-brand-dark text-white rounded-xl font-black text-xs flex items-center gap-1">
                <Plus class="w-3.5 h-3.5 stroke-[2.5]" /> Agregar
              </button>
            </div>

            <div v-if="form.features && form.features.length > 0" class="flex flex-wrap gap-1.5 pt-1">
              <span v-for="(feat, idx) in (form.features as string[])" :key="idx" class="px-2.5 py-1 bg-brand-light border border-brand-border rounded-lg text-xs font-bold flex items-center gap-1 text-brand-dark">
                {{ feat }}
                <button type="button" @click="removeFeature(idx)" class="text-rose-600 hover:text-rose-800 ml-1">
                  <Trash2 class="w-3 h-3 stroke-[2.5]" />
                </button>
              </span>
            </div>
          </div>

          <!-- Botones de Acción -->
          <div class="pt-2 flex gap-2">
            <button type="button" @click="close" class="flex-1 py-3 bg-brand-light border-2 border-brand-border rounded-2xl font-black text-brand-dark">Cancelar</button>
            <button type="submit" class="flex-1 py-3 bg-brand-dark text-white rounded-2xl font-black border-2 border-brand-dark flex items-center justify-center gap-1.5">
              <Save class="w-4 h-4 stroke-[2.5]" /> Guardar Cabaña
            </button>
          </div>
        </form>
      </template>

    </div>
  </div>
</template>