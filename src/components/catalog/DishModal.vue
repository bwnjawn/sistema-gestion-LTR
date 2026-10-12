<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Save, Plus } from 'lucide-vue-next'
import type { Dish, SideDishMode } from '../../types/catalog'
import ImageGalleryEditor from '../ui/ImageGalleryEditor.vue'

const props = defineProps<{
  isOpen: boolean
  dish?: Dish | null
  isEditable?: boolean
  globalSideDishes?: string[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', dishData: Partial<Dish>): void
  (e: 'add-global-side', sideName: string): void
}>()

const isEditing = ref(false)

const form = ref<{
  name: string
  price: number
  description: string
  mealCategory: 'Desayuno' | 'Almuerzo' | 'Once'
  sideMode: SideDishMode
  fixedSide: string
  availableSides: string[]
  images: string[]
  mainImage: string
}>({
  name: '',
  price: 10000,
  description: '',
  mealCategory: 'Almuerzo',
  sideMode: 'choice',
  fixedSide: '',
  availableSides: [],
  images: [],
  mainImage: ''
})

const newSideInput = ref('')

watch(() => props.dish, (newDish) => {
  if (newDish) {
    isEditing.value = true
    const currentSides = newDish.availableSides || newDish.availableSideDishes || []
    const mode: SideDishMode = newDish.sideMode || (newDish.hasSelectableSides !== false ? 'choice' : (newDish.fixedSide ? 'fixed' : 'none'))
    const initialImg = newDish.image || newDish.mainImage || ''
    
    form.value = {
      name: newDish.name || '',
      price: newDish.price || 10000,
      description: newDish.description || '',
      mealCategory: (newDish.mealCategory as any) || 'Almuerzo',
      sideMode: mode,
      fixedSide: newDish.fixedSide || '',
      availableSides: [...currentSides],
      images: initialImg ? [initialImg] : [],
      mainImage: initialImg
    }
  } else {
    isEditing.value = false
    form.value = {
      name: '',
      price: 10000,
      description: '',
      mealCategory: 'Almuerzo',
      sideMode: 'choice',
      fixedSide: '',
      availableSides: props.globalSideDishes ? [...props.globalSideDishes] : [],
      images: [],
      mainImage: ''
    }
  }
}, { immediate: true })

function toggleSideSelection(side: string) {
  const idx = form.value.availableSides.indexOf(side)
  if (idx !== -1) {
    form.value.availableSides.splice(idx, 1)
  } else {
    form.value.availableSides.push(side)
  }
}

function handleAddGlobalSide() {
  const trimmed = newSideInput.value.trim()
  if (trimmed) {
    emit('add-global-side', trimmed)
    if (!form.value.availableSides.includes(trimmed)) {
      form.value.availableSides.push(trimmed)
    }
    newSideInput.value = ''
  }
}

function handleSave() {
  const imgUrl = form.value.mainImage || (form.value.images && form.value.images[0]) || ''
  emit('save', {
    name: form.value.name,
    price: form.value.price,
    description: form.value.description,
    mealCategory: form.value.mealCategory,
    sideMode: form.value.sideMode,
    hasSelectableSides: form.value.sideMode === 'choice',
    fixedSide: form.value.sideMode === 'fixed' ? form.value.fixedSide : '',
    availableSides: form.value.sideMode === 'choice' ? form.value.availableSides : [],
    availableSideDishes: form.value.sideMode === 'choice' ? form.value.availableSides : [],
    image: imgUrl,
    mainImage: imgUrl
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
            Menú de Restaurante
          </span>
          <h3 class="text-lg font-black text-brand-dark leading-tight">
            {{ isEditing ? 'Editar ' + form.name : 'Nuevo Plato' }}
          </h3>
        </div>
        <button type="button" @click="close" class="p-2 rounded-full bg-white border border-brand-border text-brand-dark hover:bg-gray-100">
          <X class="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSave" class="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-bold grow">
        <div>
          <label class="block text-gray-700 mb-1">Nombre del Plato *</label>
          <input v-model="form.name" required type="text" placeholder="Ej: Asado de Cordero" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
        </div>

        <div class="grid grid-cols-2 gap-2.5">
          <div>
            <label class="block text-gray-700 mb-1">Precio (\$) *</label>
            <input v-model.number="form.price" required type="number" min="0" step="500" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
          </div>

          <div>
            <label class="block text-gray-700 mb-1">Categoría de Comida *</label>
            <select v-model="form.mealCategory" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs">
              <option value="Desayuno">Desayuno</option>
              <option value="Almuerzo">Almuerzo</option>
              <option value="Once">Once</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-gray-700 mb-1">Descripción</label>
          <textarea v-model="form.description" rows="2" placeholder="Acompañado de papas al vapor y ensaladas..." class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs"></textarea>
        </div>

        <!-- Fotografía -->
        <ImageGalleryEditor
          v-model:images="form.images"
          v-model:mainImage="form.mainImage"
          :max-images="1"
          label="Fotografía del Plato"
        />

        <!-- Configuración de Acompañamientos -->
        <div class="space-y-2 pt-2 border-t border-gray-100">
          <label class="block text-gray-700 font-black">Configuración de Acompañamientos</label>
          <div class="grid grid-cols-3 gap-1.5 p-1 bg-brand-light rounded-xl border border-brand-border">
            <button
              type="button"
              @click="form.sideMode = 'choice'"
              :class="['py-2 px-1 text-[11px] font-black rounded-lg', form.sideMode === 'choice' ? 'bg-[#c5d7be] text-brand-dark' : 'text-gray-500']"
            >
              A Elección
            </button>
            <button
              type="button"
              @click="form.sideMode = 'fixed'"
              :class="['py-2 px-1 text-[11px] font-black rounded-lg', form.sideMode === 'fixed' ? 'bg-[#c5d7be] text-brand-dark' : 'text-gray-500']"
            >
              Fijo
            </button>
            <button
              type="button"
              @click="form.sideMode = 'none'"
              :class="['py-2 px-1 text-[11px] font-black rounded-lg', form.sideMode === 'none' ? 'bg-[#c5d7be] text-brand-dark' : 'text-gray-500']"
            >
              Sin Acompañamiento
            </button>
          </div>

          <!-- Caso Acompañamiento Fijo -->
          <div v-if="form.sideMode === 'fixed'" class="pt-1">
            <input v-model="form.fixedSide" type="text" placeholder="Ej: Incluye Pan amasado y Sopaipillas" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" />
          </div>

          <!-- Caso Acompañamiento a Elección -->
          <div v-else-if="form.sideMode === 'choice'" class="space-y-2 pt-1">
            <span class="text-[11px] text-gray-600 block">Selecciona las opciones disponibles para este plato:</span>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="side in globalSideDishes"
                :key="side"
                type="button"
                @click="toggleSideSelection(side)"
                :class="[
                  'px-2.5 py-1 rounded-xl text-xs font-bold border transition-all',
                  form.availableSides.includes(side)
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-black'
                    : 'bg-white text-gray-600 border-brand-border'
                ]"
              >
                {{ form.availableSides.includes(side) ? '✓ ' : '+ ' }}{{ side }}
              </button>
            </div>

            <!-- Crear Acompañamiento Global sobre la marcha -->
            <div class="flex gap-2 pt-1">
              <input v-model="newSideInput" type="text" placeholder="Crear nuevo acompañamiento..." class="flex-1 p-2 rounded-xl border border-brand-border bg-brand-light text-xs font-bold" @keyup.enter.prevent="handleAddGlobalSide" />
              <button type="button" @click="handleAddGlobalSide" class="px-3 bg-brand-dark text-white rounded-xl font-black text-xs flex items-center gap-1">
                <Plus class="w-3.5 h-3.5 stroke-[2.5]" /> Crear
              </button>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="pt-2 flex gap-2">
          <button type="button" @click="close" class="flex-1 py-3 bg-brand-light border-2 border-brand-border rounded-2xl font-black text-brand-dark">Cancelar</button>
          <button type="submit" class="flex-1 py-3 bg-brand-dark text-white rounded-2xl font-black border-2 border-brand-dark flex items-center justify-center gap-1.5">
            <Save class="w-4 h-4 stroke-[2.5]" /> Guardar Plato
          </button>
        </div>
      </form>
    </div>
  </div>
</template>