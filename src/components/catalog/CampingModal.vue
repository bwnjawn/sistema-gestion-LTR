<template>
  <Teleport to="body">
    <div 
      v-if="isOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs transition-opacity"
      @click.self="close"
    >
      <div class="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-brand-border flex flex-col relative">
        <div class="p-5 border-b-2 border-brand-border/60 flex items-center justify-between">
          <div>
            <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">
              Edición de Catálogo (Camping)
            </span>
            <h3 class="text-xl font-black text-brand-dark">
              {{ isEditing ? 'Editar ' + form.name : 'Nueva Opción Camping' }}
            </h3>
          </div>
          <button type="button" @click="close" class="p-2 rounded-full bg-brand-light border border-brand-border text-brand-dark">
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <form @submit.prevent="handleSave" class="p-5 space-y-4 text-xs font-bold">
          <!-- Subida de Foto por Archivo -->
          <div class="space-y-1.5">
            <label class="block text-gray-700 font-extrabold">Fotografía Ilustrativa (Archivo):</label>
            <div v-if="form.image" class="relative h-32 w-full rounded-2xl overflow-hidden border border-brand-border mb-2">
              <img :src="form.image" class="w-full h-full object-cover" />
            </div>
            <input type="file" accept="image/*" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light text-xs font-bold" @change="handleFileUpload" />
          </div>

          <div>
            <label class="block text-gray-700 mb-1">Nombre u Opción de Camping *</label>
            <input v-model="form.name" required type="text" placeholder="Ej: Camping Zona General" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-gray-700 mb-1">Modalidad *</label>
              <select v-model="form.modality" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs">
                <option value="diario">Paseo por el Día</option>
                <option value="pernoctar">Pernoctar</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Precio p/pers (\$) *</label>
              <input v-model.number="form.pricePerPerson" required type="number" min="0" step="500" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-gray-700 mb-1">Capacidad Máxima *</label>
            <input v-model.number="form.maxCapacity" required type="number" min="1" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
          </div>

          <div>
            <label class="block text-gray-700 mb-1">Descripción</label>
            <textarea v-model="form.description" rows="2" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" placeholder="Acceso a baños, piscina, quincho..."></textarea>
          </div>

          <!-- CUADRÍCULA DE ÍCONOS PARA CAMPING -->
          <div class="p-3.5 bg-brand-light rounded-2xl border-2 border-brand-border space-y-2.5">
            <span class="text-xs font-black text-brand-dark block">
              Seleccionar Ícono para la Característica:
            </span>

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

            <div class="space-y-1">
              <div class="flex gap-2">
                <input 
                  v-model="newFeatureText" 
                  type="text" 
                  maxlength="25"
                  placeholder="Ej: Duchas caliente (máx 25 car.)" 
                  class="flex-1 p-2.5 rounded-xl border-2 border-brand-border bg-white text-xs font-bold"
                  @keyup.enter.prevent="addFeature"
                />
                <button type="button" @click="addFeature" class="px-4 bg-brand-dark text-white rounded-xl font-black text-xs active:scale-95">+</button>
              </div>
              <span class="text-[10px] text-gray-400 font-semibold block text-right">{{ newFeatureText.length }}/25 caracteres</span>
            </div>

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
            <button type="submit" class="flex-1 py-3 bg-brand-dark text-white rounded-2xl font-black border-2 border-brand-dark">Guardar Camping</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { 
  X, Bath, Sun, Wifi, Flame, Car, Trees, Sparkles, Utensils, Coffee, ShieldCheck, Thermometer
} from 'lucide-vue-next'
import type { CampingItem, CampingFeatureObj } from './CampingCard.vue'

const props = withDefaults(defineProps<{
  isOpen: boolean
  site?: CampingItem | null
  isEditable?: boolean
}>(), {
  isOpen: false,
  site: null,
  isEditable: false
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', updatedSite: CampingItem): void
}>()

const isEditing = ref(false)
const selectedIcon = ref('Sparkles')
const newFeatureText = ref('')

const iconCatalog = [
  { name: 'Bath', component: Bath, label: 'Baño / Ducha' },
  { name: 'Sun', component: Sun, label: 'Piscina / Sol' },
  { name: 'Trees', component: Trees, label: 'Bosque / Zonas Verdes' },
  { name: 'Flame', component: Flame, label: 'Quincho / Parrilla' },
  { name: 'Wifi', component: Wifi, label: 'Wifi' },
  { name: 'Car', component: Car, label: 'Estacionamiento' },
  { name: 'Utensils', component: Utensils, label: 'Picnic / Comedor' },
  { name: 'Coffee', component: Coffee, label: 'Kiosko' },
  { name: 'Thermometer', component: Thermometer, label: 'Agua Caliente' },
  { name: 'ShieldCheck', component: ShieldCheck, label: 'Zona Segura' },
  { name: 'Sparkles', component: Sparkles, label: 'Especial' }
]

const form = ref<CampingItem>({
  id: '',
  name: '',
  modality: 'pernoctar',
  pricePerPerson: 10000,
  maxCapacity: 50,
  description: '',
  image: '',
  features: []
})

watch(() => props.site, (newVal) => {
  if (newVal) {
    isEditing.value = true
    form.value = { 
      ...newVal, 
      features: newVal.features ? [...newVal.features] : [] 
    }
  } else {
    isEditing.value = false
    form.value = {
      id: '',
      name: '',
      modality: 'pernoctar',
      pricePerPerson: 10000,
      maxCapacity: 50,
      description: '',
      image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
      features: []
    }
  }
}, { immediate: true })

const getFeatText = (feat: string | CampingFeatureObj): string => {
  return typeof feat === 'string' ? feat : feat.text
}

const getFeatIconName = (feat: string | CampingFeatureObj): string => {
  return typeof feat === 'string' ? 'Sparkles' : feat.icon || 'Sparkles'
}

const getFeatureIcon = (iconName: string) => {
  const found = iconCatalog.find(i => i.name === iconName)
  return found ? found.component : Sparkles
}

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const reader = new FileReader()
  reader.onload = (event) => {
    if (event.target?.result) form.value.image = event.target.result as string
  }
  reader.readAsDataURL(target.files[0])
}

const addFeature = () => {
  if (!newFeatureText.value.trim()) return
  if (!form.value.features) form.value.features = []
  form.value.features.push({
    icon: selectedIcon.value,
    text: newFeatureText.value.trim()
  })
  newFeatureText.value = ''
}

const removeFeature = (idx: number) => {
  form.value.features?.splice(idx, 1)
}

const close = () => emit('close')

const handleSave = () => {
  if (!form.value.id) form.value.id = `cmp-${Date.now()}`
  emit('save', { ...form.value })
  close()
}
</script>