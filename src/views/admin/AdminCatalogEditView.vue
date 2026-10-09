<template>
  <div class="space-y-4 pb-8 max-w-lg mx-auto">
    <!-- Selector Superior de Categoría -->
    <div class="bg-white p-4 rounded-3xl border-2 border-brand-border shadow-xs space-y-3">
      <div class="space-y-1">
        <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider block">
          Panel de Administración
        </span>
        <h2 class="text-base font-black text-brand-dark flex items-center gap-2">
          <Edit3 class="w-5 h-5 text-brand-accent stroke-[2.5]" />
          <span>Editar Catálogo de Servicios</span>
        </h2>
      </div>

      <div class="grid grid-cols-3 gap-1.5 p-1 bg-brand-light rounded-2xl border-2 border-brand-border">
        <button
          type="button"
          @click="activeCategory = 'cabana'"
          :class="[
            'py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 touch-target',
            activeCategory === 'cabana'
              ? 'bg-[#c5d7be] text-brand-dark border border-brand-border shadow-2xs font-black'
              : 'bg-white text-gray-500 hover:text-brand-dark'
          ]"
        >
          <Home class="w-4 h-4 stroke-[2.5]" />
          <span>Cabañas</span>
        </button>

        <button
          type="button"
          @click="activeCategory = 'camping'"
          :class="[
            'py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 touch-target',
            activeCategory === 'camping'
              ? 'bg-[#c5d7be] text-brand-dark border border-brand-border shadow-2xs font-black'
              : 'bg-white text-gray-500 hover:text-brand-dark'
          ]"
        >
          <Tent class="w-4 h-4 stroke-[2.5]" />
          <span>Camping</span>
        </button>

        <button
          type="button"
          @click="activeCategory = 'restaurante'"
          :class="[
            'py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 touch-target',
            activeCategory === 'restaurante'
              ? 'bg-[#c5d7be] text-brand-dark border border-brand-border shadow-2xs font-black'
              : 'bg-white text-gray-500 hover:text-brand-dark'
          ]"
        >
          <Utensils class="w-4 h-4 stroke-[2.5]" />
          <span>Menú</span>
        </button>
      </div>
    </div>

    <!-- Botón Agregar Elemento -->
    <div class="flex justify-end" v-if="!(activeCategory === 'restaurante' && restaurantTab === 'sides')">
      <button
        type="button"
        @click="openCreateModal"
        class="w-full sm:w-auto py-3 px-5 bg-[#25636B] hover:bg-[#1c4c52] text-white font-black text-xs rounded-2xl border-2 border-brand-border flex items-center justify-center gap-2 shadow-sm touch-target active:scale-95 transition-transform"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" />
        <span>{{ getAddButtonLabel }}</span>
      </button>
    </div>

    <!-- 1. CATEGORÍA CABAÑAS -->
    <div v-if="activeCategory === 'cabana'" class="space-y-4">
      <CabinCard v-for="cabin in cabins" :key="cabin.id" :cabin="cabin">
        <template #actions="{ cabin: item }">
          <div class="flex items-center justify-end gap-1.5">
            <button 
              type="button"
              @click.stop="openEditCabinModal(item)"
              class="py-2 px-3.5 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-200 active:scale-95"
            >
              Editar
            </button>
            <button 
              type="button"
              @click.stop="confirmDelete('cabin', item.id, item.name)"
              class="py-2 px-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs rounded-xl hover:bg-rose-100 active:scale-95"
            >
              Eliminar
            </button>
          </div>
        </template>
      </CabinCard>
    </div>

    <!-- 2. CATEGORÍA CAMPING -->
    <div v-else-if="activeCategory === 'camping'" class="space-y-4">
      <CampingCard v-for="site in campingSites" :key="site.id" :site="site">
        <template #actions="{ site: item }">
          <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
            <button 
              type="button"
              @click.stop="openEditCampingModal(item)"
              class="py-2 px-3.5 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-200 active:scale-95"
            >
              Editar
            </button>
            <button 
              type="button"
              @click.stop="confirmDelete('camping', item.id, item.name)"
              class="py-2 px-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs rounded-xl hover:bg-rose-100 active:scale-95"
            >
              Eliminar
            </button>
          </div>
        </template>
      </CampingCard>
    </div>

    <!-- 3. CATEGORÍA RESTAURANTE -->
    <div v-else class="space-y-4">
      <div class="flex bg-white p-1 rounded-2xl border-2 border-brand-border">
        <button
          type="button"
          @click="restaurantTab = 'dishes'"
          :class="[
            'flex-1 py-2 text-xs font-black rounded-xl transition-all touch-target',
            restaurantTab === 'dishes' ? 'bg-[#c5d7be] text-brand-dark shadow-2xs' : 'text-gray-500'
          ]"
        >
          Platos Principales
        </button>
        <button
          type="button"
          @click="restaurantTab = 'sides'"
          :class="[
            'flex-1 py-2 text-xs font-black rounded-xl transition-all touch-target',
            restaurantTab === 'sides' ? 'bg-[#c5d7be] text-brand-dark shadow-2xs' : 'text-gray-500'
          ]"
        >
          Acompañamientos Glob.
        </button>
      </div>

      <!-- Filtro por Servicio (Desayuno, Almuerzo, Once) -->
      <div v-if="restaurantTab === 'dishes'" class="space-y-3">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            v-for="cat in dishCategories"
            :key="cat"
            type="button"
            @click="selectedDishCategoryFilter = cat"
            :class="[
              'px-3.5 py-1.5 rounded-2xl text-xs font-black border transition-all shrink-0 touch-target',
              selectedDishCategoryFilter === cat
                ? 'bg-brand-dark text-white border-brand-dark shadow-2xs'
                : 'bg-white text-gray-600 border-brand-border hover:bg-gray-50'
            ]"
          >
            {{ cat }}
          </button>
        </div>

        <DishCard v-for="dish in filteredMenuDishes" :key="dish.id" :dish="dish">
          <template #actions="{ dish: item }">
            <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
              <button 
                type="button"
                @click.stop="openEditDishModal(item)"
                class="py-2 px-3.5 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-200 active:scale-95"
              >
                Editar
              </button>
              <button 
                type="button"
                @click.stop="confirmDelete('dish', item.id, item.name)"
                class="py-2 px-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs rounded-xl hover:bg-rose-100 active:scale-95"
              >
                Eliminar
              </button>
            </div>
          </template>
        </DishCard>
      </div>

      <!-- Formulario Integrado para Crear Acompañamiento sin prompt() -->
      <div v-else class="space-y-3">
        <div class="bg-white p-4 rounded-3xl border-2 border-brand-border space-y-2">
          <span class="text-xs font-black text-brand-dark block">+ Crear Nuevo Acompañamiento Global:</span>
          <div class="flex gap-2">
            <input 
              v-model="newSideInput" 
              type="text" 
              placeholder="Ej: Ens. Chilena / Papas Mayo" 
              class="flex-1 p-3 rounded-xl border-2 border-brand-border bg-brand-light text-xs font-bold"
              @keyup.enter.prevent="addSideDirectly"
            />
            <button 
              type="button" 
              @click="addSideDirectly"
              class="px-5 bg-brand-dark text-white rounded-xl font-black text-xs active:scale-95 shadow-2xs"
            >
              Guardar
            </button>
          </div>
        </div>

        <div class="space-y-2">
          <div 
            v-for="side in sideDishes" 
            :key="side"
            class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs flex items-center justify-between gap-2"
          >
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              <span class="text-sm font-black text-brand-dark">{{ side }}</span>
            </div>

            <button
              type="button"
              @click="deleteSideDish(side)"
              class="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 active:scale-95 touch-target"
              title="Quitar acompañamiento"
            >
              <Trash2 class="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODALES DE EDICIÓN -->
    <CabinModal
      :is-open="showCabinModal"
      :cabin="selectedCabin"
      :is-editable="true"
      @close="showCabinModal = false"
      @save="saveCabin"
    />

    <CampingModal
      :is-open="showCampingModal"
      :site="selectedCamping"
      :is-editable="true"
      @close="showCampingModal = false"
      @save="saveCamping"
    />

    <DishModal
      :is-open="showDishModal"
      :dish="selectedDish"
      :is-editable="true"
      :global-side-dishes="sideDishes"
      @close="showDishModal = false"
      @save="saveDish"
      @add-global-side="handleGlobalSideAdded"
    />

    <!-- MODAL CONFIRMACIÓN ELIMINAR -->
    <div 
      v-if="deleteTarget" 
      class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl p-5 border-2 border-brand-border shadow-2xl max-w-xs w-full space-y-4 text-center">
        <div class="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle class="w-6 h-6 stroke-[2.5]" />
        </div>

        <div class="space-y-1">
          <h3 class="text-base font-black text-brand-dark">¿Eliminar registro?</h3>
          <p class="text-xs font-bold text-gray-600">
            Estás a punto de borrar <strong>"{{ deleteTarget.name }}"</strong>. Esta acción no se puede deshacer.
          </p>
        </div>

        <div class="flex gap-2 pt-2">
          <button type="button" @click="deleteTarget = null" class="flex-1 py-2.5 bg-brand-light border border-brand-border rounded-xl font-black text-xs text-brand-dark">Cancelar</button>
          <button type="button" @click="executeDelete" class="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-black text-xs shadow-2xs">Eliminar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Edit3, Home, Tent, Utensils, Plus, Sparkles, Trash2, AlertTriangle } from 'lucide-vue-next'
import CabinCard, { type CabinItem } from '../../components/catalog/CabinCard.vue'
import CampingCard, { type CampingItem } from '../../components/catalog/CampingCard.vue'
import DishCard, { type DishItem } from '../../components/catalog/DishCard.vue'
import CabinModal from '../../components/catalog/CabinModal.vue'
import CampingModal from '../../components/catalog/CampingModal.vue'
import DishModal from '../../components/catalog/DishModal.vue'

type MainCategory = 'cabana' | 'camping' | 'restaurante'
type RestaurantSubTab = 'dishes' | 'sides'

const activeCategory = ref<MainCategory>('cabana')
const restaurantTab = ref<RestaurantSubTab>('dishes')

const dishCategories = ['Todos', 'Desayuno', 'Almuerzo', 'Once']
const selectedDishCategoryFilter = ref('Todos')

const showCabinModal = ref(false)
const showCampingModal = ref(false)
const showDishModal = ref(false)

const newSideInput = ref('')

const selectedCabin = ref<CabinItem | null>(null)
const selectedCamping = ref<CampingItem | null>(null)
const selectedDish = ref<DishItem | null>(null)

const deleteTarget = ref<{ type: 'cabin' | 'camping' | 'dish'; id: string; name: string } | null>(null)

const cabins = ref<CabinItem[]>([
  {
    id: 'c6',
    name: 'Cabaña 6',
    capacity: 6,
    pricePerNight: 65000,
    bedsDescription: '1 matrimonial + 4 individuales',
    mainImage: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80',
    images: ['https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80'],
    features: [{ icon: 'Wifi', text: 'Wifi Fibra Óptica' }],
    isActive: true
  }
])

const campingSites = ref<CampingItem[]>([
  {
    id: 'cmp-1',
    name: 'Camping Zona General (Pernoctar)',
    modality: 'pernoctar',
    pricePerPerson: 10000,
    maxCapacity: 150,
    description: 'Sitios equipados con agua potable.',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
    features: [{ icon: 'Bath', text: 'Baños con ducha' }]
  }
])

const sideDishes = ref<string[]>([
  'Papas al vapor', 'Puré casero', 'Papas rústicas', 'Buffet de ensaladas'
])

const menuDishes = ref<DishItem[]>([
  {
    id: 'd1',
    name: 'Asado de Cordero y Cerdo',
    mealCategory: 'Almuerzo',
    price: 20000,
    description: 'Asado criollo con papas al vapor y ensaladas.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    availableSides: ['Papas al vapor', 'Puré casero', 'Buffet de ensaladas']
  }
])

const filteredMenuDishes = computed(() => {
  if (selectedDishCategoryFilter.value === 'Todos') return menuDishes.value
  return menuDishes.value.filter(d => d.mealCategory === selectedDishCategoryFilter.value)
})

const getAddButtonLabel = computed(() => {
  if (activeCategory.value === 'cabana') return 'Nueva Cabaña'
  if (activeCategory.value === 'camping') return 'Nuevo Sitio'
  return 'Nuevo Plato'
})

const handleGlobalSideAdded = (sideName: string) => {
  if (sideName && !sideDishes.value.includes(sideName)) {
    sideDishes.value.push(sideName)
  }
}

const addSideDirectly = () => {
  const trimmed = newSideInput.value.trim()
  if (trimmed) {
    handleGlobalSideAdded(trimmed)
    newSideInput.value = ''
  }
}

const openCreateModal = () => {
  if (activeCategory.value === 'cabana') {
    selectedCabin.value = null
    showCabinModal.value = true
  } else if (activeCategory.value === 'camping') {
    selectedCamping.value = null
    showCampingModal.value = true
  } else {
    selectedDish.value = null
    showDishModal.value = true
  }
}

const openEditCabinModal = (item: CabinItem) => {
  selectedCabin.value = item
  showCabinModal.value = true
}

const openEditCampingModal = (item: CampingItem) => {
  selectedCamping.value = item
  showCampingModal.value = true
}

const openEditDishModal = (item: DishItem) => {
  selectedDish.value = item
  showDishModal.value = true
}

const saveCabin = (updatedCabin: CabinItem) => {
  const idx = cabins.value.findIndex(c => c.id === updatedCabin.id)
  if (idx !== -1) cabins.value[idx] = updatedCabin
  else cabins.value.push(updatedCabin)
}

const saveCamping = (updatedSite: CampingItem) => {
  const idx = campingSites.value.findIndex(s => s.id === updatedSite.id)
  if (idx !== -1) campingSites.value[idx] = updatedSite
  else campingSites.value.push(updatedSite)
}

const saveDish = (updatedDish: DishItem) => {
  const idx = menuDishes.value.findIndex(d => d.id === updatedDish.id)
  if (idx !== -1) menuDishes.value[idx] = updatedDish
  else menuDishes.value.push(updatedDish)
}

const deleteSideDish = (sideName: string) => {
  sideDishes.value = sideDishes.value.filter(s => s !== sideName)
}

const confirmDelete = (type: 'cabin' | 'camping' | 'dish', id: string, name: string) => {
  deleteTarget.value = { type, id, name }
}

const executeDelete = () => {
  if (!deleteTarget.value) return
  if (deleteTarget.value.type === 'cabin') cabins.value = cabins.value.filter(c => c.id !== deleteTarget.value?.id)
  if (deleteTarget.value.type === 'camping') campingSites.value = campingSites.value.filter(s => s.id !== deleteTarget.value?.id)
  if (deleteTarget.value.type === 'dish') menuDishes.value = menuDishes.value.filter(d => d.id !== deleteTarget.value?.id)
  deleteTarget.value = null
}
</script>