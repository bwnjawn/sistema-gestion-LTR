<template>
  <Teleport to="body">
    <div 
      v-if="isOpen && (cabin || isEditable)" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity"
      @click.self="close"
    >
      <div class="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-brand-border flex flex-col relative">
        
        <!-- ================= MODO CLIENTE (SOLO LECTURA) ================= -->
        <template v-if="!isEditable && cabin">
          <div class="relative h-64 w-full bg-black shrink-0 overflow-hidden">
            <img 
              :src="activeImage" 
              :alt="cabin.name"
              class="w-full h-full object-cover transition-all duration-300"
              @error="(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80' }"
            />
            
            <button 
              type="button"
              @click="close"
              class="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full backdrop-blur-xs touch-target flex items-center justify-center z-10"
              aria-label="Cerrar modal"
            >
              <X class="w-6 h-6 stroke-[2.5]" />
            </button>

            <button 
              v-if="cabinImages.length > 1"
              type="button"
              @click="prevImage"
              class="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full touch-target flex items-center justify-center"
            >
              <ChevronLeft class="w-6 h-6 stroke-[2.5]" />
            </button>

            <button 
              v-if="cabinImages.length > 1"
              type="button"
              @click="nextImage"
              class="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full touch-target flex items-center justify-center"
            >
              <ChevronRight class="w-6 h-6 stroke-[2.5]" />
            </button>

            <div v-if="cabinImages.length > 0" class="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-black px-3 py-1 rounded-full backdrop-blur-xs">
              {{ currentImageIndex + 1 }} / {{ cabinImages.length }}
            </div>
          </div>

          <div class="p-5 space-y-4 grow">
            <div>
              <div class="flex items-center justify-between">
                <h3 class="text-2xl font-black text-brand-dark">{{ cabin.name }}</h3>
                <span class="bg-brand-light text-brand-dark border border-brand-border px-3 py-1 rounded-full font-extrabold text-xs flex items-center gap-1.5">
                  <Users class="w-4 h-4 text-brand-accent stroke-[2.5]" />
                  Hasta {{ cabin.capacity }} Personas
                </span>
              </div>
              <p class="text-sm font-extrabold text-brand-accent mt-1 flex items-center gap-1.5">
                <BedDouble class="w-4 h-4 stroke-[2.5]" />
                {{ cabin.bedsDescription }}
              </p>
            </div>

            <div class="space-y-1" v-if="cabin.description">
              <h4 class="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Descripción</h4>
              <p class="text-sm font-semibold text-gray-700 leading-relaxed">
                {{ cabin.description }}
              </p>
            </div>

            <div class="space-y-2" v-if="cabin.features && cabin.features.length > 0">
              <h4 class="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Servicios y Equipamiento</h4>
              <div class="grid grid-cols-2 gap-2">
                <div 
                  v-for="(feature, fIdx) in cabin.features" 
                  :key="fIdx"
                  class="flex items-center gap-2 bg-brand-light p-2.5 rounded-xl border border-brand-border text-xs font-bold text-brand-dark"
                >
                  <component :is="getFeatureIcon(getFeatIconName(feature))" class="w-4 h-4 text-brand-accent shrink-0 stroke-[2.5]" />
                  <span>{{ typeof feature === 'string' ? feature : feature.text }}</span>
                </div>
              </div>
            </div>

            <div class="bg-brand-light p-4 rounded-2xl border-2 border-brand-border flex items-center justify-between">
              <div>
                <span class="text-xs font-bold text-gray-500 block">Tarifa por noche</span>
                <span class="text-sm font-black text-gray-800">${{ cabin.pricePerNight.toLocaleString('es-CL') }}</span>
              </div>
              <div class="text-right">
                <span class="text-xs font-bold text-brand-accent block uppercase">Total por {{ nightsCount }} Noches</span>
                <span class="text-2xl font-black text-brand-dark">
                  \${{ (cabin.pricePerNight * nightsCount).toLocaleString('es-CL') }}
                </span>
              </div>
            </div>
          </div>

          <div class="p-4 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
            <BaseButton variant="outline" size="lg" @click="close">
              Cerrar
            </BaseButton>

            <BaseButton 
              variant="success" 
              size="lg" 
              fullWidth 
              @click="$emit('select', cabin)"
            >
              <Check class="w-5 h-5 mr-1.5 stroke-[2.5]" />
              Elegir esta Cabaña
            </BaseButton>
          </div>
        </template>

        <!-- ================= MODO ADMINISTRADOR (EDITABLE) ================= -->
        <template v-else>
          <div class="p-5 border-b-2 border-brand-border/60 flex items-center justify-between">
            <div>
              <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">
                Edición de Catálogo
              </span>
              <h3 class="text-xl font-black text-brand-dark">
                {{ isEditing ? 'Editar ' + form.name : 'Nueva Cabaña' }}
              </h3>
            </div>
            <button type="button" @click="close" class="p-2 rounded-full bg-brand-light border border-brand-border text-brand-dark">
              <X class="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          <form @submit.prevent="handleSave" class="p-5 space-y-4 text-xs font-bold">
            <!-- Subida de Fotos por Archivo -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="block text-gray-700 font-extrabold">Fotografías del Carrusel (Archivos):</label>
                <label class="text-[11px] font-black text-brand-accent underline cursor-pointer">
                  + Subir Fotos
                  <input type="file" multiple accept="image/*" class="hidden" @change="handleFileUpload" />
                </label>
              </div>

              <div v-if="form.images.length > 0" class="grid grid-cols-3 gap-2">
                <div v-for="(img, idx) in form.images" :key="idx" class="relative h-20 rounded-xl overflow-hidden border border-brand-border group">
                  <img :src="img" class="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    @click="removeImage(idx)"
                    class="absolute top-1 right-1 bg-rose-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-gray-700 mb-1">Nombre Cabaña *</label>
              <input v-model="form.name" required type="text" placeholder="Ej: Cabaña 6" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-gray-700 mb-1">Capacidad (pers) *</label>
                <input v-model.number="form.capacity" required type="number" min="1" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Precio Noche (\$) *</label>
                <input v-model.number="form.pricePerNight" required type="number" min="0" step="1000" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
              </div>
            </div>

            <div>
              <label class="block text-gray-700 mb-1">Camas / Distribución *</label>
              <input v-model="form.bedsDescription" required type="text" placeholder="Ej: 1 matrimonial + 4 individuales" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
            </div>

            <div>
              <label class="block text-gray-700 mb-1">Descripción corta</label>
              <textarea v-model="form.description" rows="2" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" placeholder="Vista al río, estufa a leña, cocina completa..."></textarea>
            </div>

            <!-- CUADRÍCULA DE SELECCIÓN DE ÍCONOS PARA BOXES -->
            <div class="p-3.5 bg-brand-light rounded-2xl border-2 border-brand-border space-y-2.5">
              <span class="text-xs font-black text-brand-dark block">
                Seleccionar Ícono para el Servicio / Equipamiento:
              </span>

              <!-- Cuadrícula de Botones de Íconos -->
              <div class="grid grid-cols-5 gap-1.5 p-2 bg-white rounded-xl border border-brand-border/60">
                <button
                  v-for="iconObj in iconCatalog"
                  :key="iconObj.name"
                  type="button"
                  @click="selectedIcon = iconObj.name"
                  :title="iconObj.label"
                  :class="[
                    'p-2 rounded-xl flex items-center justify-center transition-all touch-target',
                    selectedIcon === iconObj.name
                      ? 'bg-brand-dark text-white ring-2 ring-brand-dark'
                      : 'bg-brand-light text-brand-dark hover:bg-gray-200'
                  ]"
                >
                  <component :is="iconObj.component" class="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              <!-- Input con Límite de 25 caracteres -->
              <div class="space-y-1">
                <div class="flex gap-2">
                  <input 
                    v-model="newFeatureText" 
                    type="text" 
                    maxlength="25"
                    placeholder="Ej: Tinaja privada (máx 25 car.)" 
                    class="flex-1 p-2.5 rounded-xl border-2 border-brand-border bg-white text-xs font-bold"
                    @keyup.enter.prevent="addFeature"
                  />
                  <button type="button" @click="addFeature" class="px-4 bg-brand-dark text-white rounded-xl font-black text-xs active:scale-95">+</button>
                </div>
                <span class="text-[10px] text-gray-400 font-semibold block text-right">{{ newFeatureText.length }}/25 caracteres</span>
              </div>

              <!-- Lista de Features Agregados -->
              <div class="flex flex-wrap gap-1.5 pt-1">
                <span 
                  v-for="(feat, fIdx) in form.features" 
                  :key="fIdx"
                  class="text-[11px] font-black bg-white px-2.5 py-1 rounded-xl border border-brand-border text-brand-dark flex items-center gap-1.5 shadow-2xs"
                >
                  <component :is="getFeatureIcon(getFeatIconName(feat))" class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
                  <span>{{ getFeatText(feat) }}</span>
                  <button type="button" @click="removeFeature(fIdx)" class="text-rose-600 font-black hover:text-rose-800 ml-1">✕</button>
                </span>
              </div>
            </div>

            <div class="pt-2 flex gap-2">
              <button type="button" @click="close" class="flex-1 py-3 bg-brand-light border-2 border-brand-border rounded-2xl font-black text-brand-dark">Cancelar</button>
              <button type="submit" class="flex-1 py-3 bg-brand-dark text-white rounded-2xl font-black border-2 border-brand-dark">Guardar Cabaña</button>
            </div>
          </form>
        </template>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { 
  X, Users, BedDouble, ChevronLeft, ChevronRight, Check,
  Wifi, Bath, Fan, Tv, Flame, Sun, Utensils, Car, Trees, Sparkles, Coffee, Waves, Key, ShieldCheck, Thermometer
} from 'lucide-vue-next'
import BaseButton from '../ui/BaseButton.vue'
import type { CabinItem, CabinFeatureObj } from './CabinCard.vue'

const props = withDefaults(defineProps<{
  isOpen: boolean
  cabin?: CabinItem | null
  isEditable?: boolean
  nightsCount?: number
}>(), {
  isOpen: false,
  cabin: null,
  isEditable: false,
  nightsCount: 1
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', updatedCabin: CabinItem): void
  (e: 'select', cabin: CabinItem): void
}>()

const currentImageIndex = ref(0)
const selectedIcon = ref('Sparkles')
const newFeatureText = ref('')
const isEditing = ref(false)

const iconCatalog = [
  { name: 'Wifi', component: Wifi, label: 'Internet / Wifi' },
  { name: 'Bath', component: Bath, label: 'Baño / Ducha' },
  { name: 'Fan', component: Fan, label: 'Ventilador / Aire' },
  { name: 'Flame', component: Flame, label: 'Estufa / Calefacción' },
  { name: 'Tv', component: Tv, label: 'TV Cable' },
  { name: 'Utensils', component: Utensils, label: 'Cocina / Vajilla' },
  { name: 'Car', component: Car, label: 'Estacionamiento' },
  { name: 'Trees', component: Trees, label: 'Vista / Naturaleza' },
  { name: 'Coffee', component: Coffee, label: 'Desayuno' },
  { name: 'Waves', component: Waves, label: 'Río / Tinaja' },
  { name: 'Sun', component: Sun, label: 'Piscina' },
  { name: 'Key', component: Key, label: 'Acceso Privado' },
  { name: 'ShieldCheck', component: ShieldCheck, label: 'Seguridad' },
  { name: 'Thermometer', component: Thermometer, label: 'Agua Caliente' },
  { name: 'Sparkles', component: Sparkles, label: 'Especial' }
]

const form = ref<CabinItem>({
  id: '',
  name: '',
  capacity: 6,
  pricePerNight: 65000,
  bedsDescription: '',
  description: '',
  mainImage: '',
  images: [],
  features: [],
  isActive: true
})

watch(() => props.cabin, (newVal) => {
  currentImageIndex.value = 0
  if (newVal) {
    isEditing.value = true
    form.value = {
      ...newVal,
      images: newVal.images ? [...newVal.images] : [newVal.mainImage],
      features: newVal.features ? [...newVal.features] : []
    }
  } else {
    isEditing.value = false
    form.value = {
      id: '',
      name: '',
      capacity: 6,
      pricePerNight: 65000,
      bedsDescription: '',
      description: '',
      mainImage: '',
      images: [],
      features: [],
      isActive: true
    }
  }
}, { immediate: true })

const cabinImages = computed(() => {
  if (props.cabin?.images && props.cabin.images.length > 0) return props.cabin.images
  if (props.cabin?.mainImage) return [props.cabin.mainImage]
  return []
})

const activeImage = computed((): string => {
  if (cabinImages.value.length > 0) return cabinImages.value[currentImageIndex.value] || cabinImages.value[0] || ''
  return 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'
})

const prevImage = () => {
  if (cabinImages.value.length <= 1) return
  if (currentImageIndex.value === 0) currentImageIndex.value = cabinImages.value.length - 1
  else currentImageIndex.value--
}

const nextImage = () => {
  if (cabinImages.value.length <= 1) return
  if (currentImageIndex.value === cabinImages.value.length - 1) currentImageIndex.value = 0
  else currentImageIndex.value++
}

const getFeatText = (feat: string | CabinFeatureObj): string => {
  return typeof feat === 'string' ? feat : feat.text
}

const getFeatIconName = (feat: string | CabinFeatureObj): string => {
  return typeof feat === 'string' ? 'Sparkles' : feat.icon || 'Sparkles'
}

const getFeatureIcon = (iconName: string) => {
  const found = iconCatalog.find(i => i.name === iconName)
  return found ? found.component : Sparkles
}

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files) return
  Array.from(target.files).forEach(file => {
    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        const url = event.target.result as string
        if (!form.value.mainImage) form.value.mainImage = url
        form.value.images.push(url)
      }
    }
    reader.readAsDataURL(file)
  })
}

const removeImage = (idx: number) => {
  form.value.images.splice(idx, 1)
  if (form.value.images.length > 0) form.value.mainImage = form.value.images[0]
  else form.value.mainImage = ''
}

const addFeature = () => {
  if (!newFeatureText.value.trim()) return
  form.value.features.push({
    icon: selectedIcon.value,
    text: newFeatureText.value.trim()
  })
  newFeatureText.value = ''
}

const removeFeature = (idx: number) => {
  form.value.features.splice(idx, 1)
}

const close = () => emit('close')

const handleSave = () => {
  if (!form.value.id) form.value.id = `c-${Date.now()}`
  if (!form.value.mainImage && form.value.images.length > 0) {
    form.value.mainImage = form.value.images[0]
  }
  emit('save', { ...form.value })
  close()
}
</script>