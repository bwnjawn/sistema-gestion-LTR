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
              Edición de Catálogo (Restaurante)
            </span>
            <h3 class="text-xl font-black text-brand-dark">
              {{ isEditing ? 'Editar ' + form.name : 'Nuevo Plato del Menú' }}
            </h3>
          </div>
          <button type="button" @click="close" class="p-2 rounded-full bg-brand-light border border-brand-border text-brand-dark">
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <form @submit.prevent="handleSave" class="p-5 space-y-4 text-xs font-bold">
          <div>
            <label class="block text-gray-700 mb-1">Nombre del Plato *</label>
            <input v-model="form.name" required type="text" placeholder="Ej: Asado de Cordero" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-gray-700 mb-1">Categoría de Servicio *</label>
              <select v-model="form.mealCategory" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-xs">
                <option value="Desayuno">Desayuno</option>
                <option value="Almuerzo">Almuerzo</option>
                <option value="Once">Once</option>
              </select>
            </div>
            <div>
              <label class="block text-gray-700 mb-1">Precio (\$) *</label>
              <input v-model.number="form.price" required type="number" min="0" step="500" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-black text-sm" />
            </div>
          </div>

          <div>
            <label class="block text-gray-700 mb-1">Descripción *</label>
            <textarea v-model="form.description" rows="2" class="w-full p-3 rounded-xl border-2 border-brand-border bg-brand-light font-bold text-xs" placeholder="Ingredientes, preparación, guarniciones..."></textarea>
          </div>

          <div>
            <label class="block text-gray-700 mb-1">Fotografía del Plato (Archivo):</label>
            <input type="file" accept="image/*" class="w-full p-2.5 rounded-xl border-2 border-brand-border bg-brand-light text-xs font-bold" @change="handleFileUpload" />
          </div>

          <!-- SECCIÓN ACOMPAÑAMIENTOS Y CREACIÓN DIRECTA -->
          <div class="p-3.5 bg-brand-light rounded-2xl border-2 border-brand-border space-y-3">
            <span class="text-xs font-black text-brand-dark block">Acompañamientos Asignados a este Plato:</span>
            
            <div class="space-y-1.5 max-h-36 overflow-y-auto p-2.5 bg-white rounded-xl border border-brand-border/60">
              <label v-for="s in globalSideDishes" :key="s" class="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                <input type="checkbox" :value="s" v-model="form.availableSides" class="w-4 h-4 rounded text-brand-dark" />
                <span>{{ s }}</span>
              </label>
            </div>

            <!-- Crear Acompañamiento In Situ -->
            <div class="pt-2 border-t border-brand-border/40 space-y-1.5">
              <span class="text-[11px] font-black text-brand-accent block">+ ¿Falta un acompañamiento? Créalo aquí:</span>
              <div class="flex gap-2">
                <input 
                  v-model="inlineNewSideName" 
                  type="text" 
                  placeholder="Ej: Ensalada a la chilena" 
                  class="flex-1 p-2.5 rounded-xl border border-brand-border bg-white text-xs font-bold"
                  @keyup.enter.prevent="createSideInline"
                />
                <button 
                  type="button" 
                  @click="createSideInline"
                  class="px-3.5 bg-brand-dark text-white rounded-xl font-black text-xs active:scale-95"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>

          <div class="pt-2 flex gap-2">
            <button type="button" @click="close" class="flex-1 py-3 bg-brand-light border-2 border-brand-border rounded-2xl font-black text-brand-dark">Cancelar</button>
            <button type="submit" class="flex-1 py-3 bg-brand-dark text-white rounded-2xl font-black border-2 border-brand-dark">Guardar Plato</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { DishItem } from './DishCard.vue'

const props = withDefaults(defineProps<{
  isOpen: boolean
  dish?: DishItem | null
  isEditable?: boolean
  globalSideDishes?: string[]
}>(), {
  isOpen: false,
  dish: null,
  isEditable: false,
  globalSideDishes: () => []
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', updatedDish: DishItem): void
  (e: 'add-global-side', sideName: string): void
}>()

const isEditing = ref(false)
const inlineNewSideName = ref('')

const form = ref<DishItem>({
  id: '',
  name: '',
  mealCategory: 'Almuerzo',
  price: 20000,
  description: '',
  image: '',
  availableSides: []
})

watch(() => props.dish, (newVal) => {
  if (newVal) {
    isEditing.value = true
    form.value = {
      ...newVal,
      availableSides: newVal.availableSides ? [...newVal.availableSides] : []
    }
  } else {
    isEditing.value = false
    form.value = {
      id: '',
      name: '',
      mealCategory: 'Almuerzo',
      price: 20000,
      description: '',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      availableSides: []
    }
  }
}, { immediate: true })

const handleFileUpload = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  const reader = new FileReader()
  reader.onload = (event) => {
    if (event.target?.result) form.value.image = event.target.result as string
  }
  reader.readAsDataURL(target.files[0])
}

const createSideInline = () => {
  const trimmed = inlineNewSideName.value.trim()
  if (!trimmed) return
  emit('add-global-side', trimmed)
  if (!form.value.availableSides.includes(trimmed)) {
    form.value.availableSides.push(trimmed)
  }
  inlineNewSideName.value = ''
}

const close = () => emit('close')

const handleSave = () => {
  if (!form.value.id) form.value.id = `d-${Date.now()}`
  emit('save', { ...form.value })
  close()
}
</script>