<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Clock, Home, Tent, Utensils, Plus, Sparkles, Trash2, AlertTriangle, Phone 
} from 'lucide-vue-next'
import AdminBottomNav from '../../components/admin/AdminBottomNav.vue'
import CabinCard from '../../components/catalog/CabinCard.vue'
import CampingCard from '../../components/catalog/CampingCard.vue'
import DishCard from '../../components/catalog/DishCard.vue'
import CabinModal from '../../components/catalog/CabinModal.vue'
import CampingModal from '../../components/catalog/CampingModal.vue'
import DishModal from '../../components/catalog/DishModal.vue'
import AdminContactEditModal from '../../components/admin/AdminContactEditModal.vue'
import CategorySchedulesModal from '../../components/admin/CategorySchedulesModal.vue'
import { useCatalogStore } from '../../stores/catalogStore'
import type { Cabin, CampingSite, Dish } from '../../types/catalog'

const catalogStore = useCatalogStore()

// Pestañas Principales
const activeCategory = ref<'cabana' | 'camping' | 'restaurante'>('cabana')
const restaurantTab = ref<'dishes' | 'sides'>('dishes')

// Filtros Restaurante
const selectedDishCategoryFilter = ref('Todos')
const dishCategories = ['Todos', 'Desayuno', 'Almuerzo', 'Once']

const filteredMenuDishes = computed(() => {
  if (selectedDishCategoryFilter.value === 'Todos') {
    return catalogStore.dishes
  }
  return catalogStore.dishes.filter(
    d => (d.mealCategory || '').toLowerCase() === selectedDishCategoryFilter.value.toLowerCase()
  )
})

// Modales de Configuración
const showContactModal = ref(false)
const showSchedulesModal = ref(false)

// Modales de Edición
const showCabinModal = ref(false)
const selectedCabin = ref<Cabin | null>(null)

const showCampingModal = ref(false)
const selectedCamping = ref<CampingSite | null>(null)

const showDishModal = ref(false)
const selectedDish = ref<Dish | null>(null)

// Acompañamiento Global Entrada Directa
const newSideInput = ref('')

function addSideDirectly() {
  if (newSideInput.value.trim()) {
    catalogStore.addGlobalSideDish(newSideInput.value.trim())
    newSideInput.value = ''
  }
}

function deleteSideDish(side: string) {
  catalogStore.deleteGlobalSideDish(side)
}

function handleGlobalSideAdded(sideName: string) {
  catalogStore.addGlobalSideDish(sideName)
}

// Botón Nuevo según categoría activa
const getAddButtonLabel = computed(() => {
  if (activeCategory.value === 'cabana') return 'Nueva Cabaña'
  if (activeCategory.value === 'camping') return 'Nuevo Sitio Camping'
  return 'Nuevo Plato'
})

function openCreateModal() {
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

function openEditCabinModal(cabin: Cabin) {
  selectedCabin.value = cabin
  showCabinModal.value = true
}

function openEditCampingModal(site: CampingSite) {
  selectedCamping.value = site
  showCampingModal.value = true
}

function openEditDishModal(dish: Dish) {
  selectedDish.value = dish
  showDishModal.value = true
}

function saveCabin(cabinData: Partial<Cabin>) {
  if (selectedCabin.value) {
    catalogStore.updateCabin(selectedCabin.value.id, cabinData)
  } else {
    catalogStore.addCabin(cabinData)
  }
  showCabinModal.value = false
}

function saveCamping(siteData: Partial<CampingSite>) {
  if (selectedCamping.value) {
    catalogStore.updateCampingSite(selectedCamping.value.id, siteData)
  } else {
    catalogStore.addCampingSite(siteData)
  }
  showCampingModal.value = false
}

function saveDish(dishData: Partial<Dish>) {
  if (selectedDish.value) {
    catalogStore.updateDish(selectedDish.value.id, dishData)
  } else {
    catalogStore.addDish(dishData)
  }
  showDishModal.value = false
}

// Eliminación con Modal de Confirmación
const deleteTarget = ref<{ type: 'cabin' | 'camping' | 'dish'; id: string; name: string } | null>(null)

function confirmDelete(type: 'cabin' | 'camping' | 'dish', id: string, name: string) {
  deleteTarget.value = { type, id, name }
}

function executeDelete() {
  if (!deleteTarget.value) return
  const { type, id } = deleteTarget.value

  if (type === 'cabin') {
    catalogStore.deleteCabin(id)
  } else if (type === 'camping') {
    catalogStore.deleteCampingSite(id)
  } else if (type === 'dish') {
    catalogStore.deleteDish(id)
  }

  deleteTarget.value = null
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    
    <!-- ENCABEZADO Y CONFIGURACIONES RÁPIDAS -->
    <div class="grid grid-cols-2 gap-2">
      <button 
        type="button" 
        @click="showContactModal = true" 
        class="py-2.5 px-3 rounded-2xl bg-brand-light hover:bg-gray-100 border border-brand-border text-brand-dark font-black text-xs flex items-center justify-center gap-1.5 touch-target active:scale-95 transition-all"
      >
        <Phone class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        <span>Editar Contacto</span>
      </button>

      <button 
        type="button" 
        @click="showSchedulesModal = true" 
        class="py-2.5 px-3 rounded-2xl bg-brand-light hover:bg-gray-100 border border-brand-border text-brand-dark font-black text-xs flex items-center justify-center gap-1.5 touch-target active:scale-95 transition-all"
      >
        <Clock class="w-4 h-4 text-brand-accent stroke-[2.5]" />
        <span>Horarios y Reglas</span>
      </button>
    </div>

    <!-- PESTAÑAS PRINCIPALES -->
    <div class="bg-white p-2 rounded-3xl border-2 border-brand-border shadow-2xs">
      <div class="grid grid-cols-3 gap-1.5 p-1 bg-brand-light rounded-2xl border border-brand-border">
        <button 
          type="button" 
          @click="activeCategory = 'cabana'" 
          :class="['py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all', activeCategory === 'cabana' ? 'bg-[#c5d7be] text-brand-dark border border-brand-border shadow-2xs' : 'bg-white text-gray-500']"
        >
          <Home class="w-4 h-4 stroke-[2.5]" /> <span>Cabañas</span>
        </button>

        <button 
          type="button" 
          @click="activeCategory = 'camping'" 
          :class="['py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all', activeCategory === 'camping' ? 'bg-[#c5d7be] text-brand-dark border border-brand-border shadow-2xs' : 'bg-white text-gray-500']"
        >
          <Tent class="w-4 h-4 stroke-[2.5]" /> <span>Camping</span>
        </button>

        <button 
          type="button" 
          @click="activeCategory = 'restaurante'" 
          :class="['py-2.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all', activeCategory === 'restaurante' ? 'bg-[#c5d7be] text-brand-dark border border-brand-border shadow-2xs' : 'bg-white text-gray-500']"
        >
          <Utensils class="w-4 h-4 stroke-[2.5]" /> <span>Menú</span>
        </button>
      </div>
    </div>

    <!-- BOTÓN NUEVO -->
    <div class="flex justify-end" v-if="!(activeCategory === 'restaurante' && restaurantTab === 'sides')">
      <button 
        type="button" 
        @click="openCreateModal" 
        class="w-full sm:w-auto py-3 px-5 bg-[#25636B] hover:bg-[#1c4c52] text-white font-black text-xs rounded-2xl border-2 border-brand-border flex items-center justify-center gap-2 active:scale-95 shadow-sm transition-transform"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" /> <span>{{ getAddButtonLabel }}</span>
      </button>
    </div>

    <!-- CABAÑAS -->
    <div v-if="activeCategory === 'cabana'" class="space-y-4">
      <CabinCard 
        v-for="cabin in catalogStore.cabins" 
        :key="cabin.id" 
        :cabin="cabin"
      >
        <template #actions="{ cabin: item }">
          <div class="flex items-center justify-end gap-1.5">
            <button type="button" @click.stop="openEditCabinModal(item)" class="py-2 px-3.5 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-200 active:scale-95">Editar</button>
            <button type="button" @click.stop="confirmDelete('cabin', item.id, item.name)" class="py-2 px-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs rounded-xl hover:bg-rose-100 active:scale-95">Eliminar</button>
          </div>
        </template>
      </CabinCard>
    </div>

    <!-- CAMPING -->
    <div v-else-if="activeCategory === 'camping'" class="space-y-4">
      <CampingCard v-for="site in catalogStore.campingSites" :key="site.id" :site="site">
        <template #actions="{ site: item }">
          <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
            <button type="button" @click.stop="openEditCampingModal(item)" class="py-2 px-3.5 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-200 active:scale-95">Editar</button>
            <button type="button" @click.stop="confirmDelete('camping', item.id, item.name)" class="py-2 px-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs rounded-xl hover:bg-rose-100 active:scale-95">Eliminar</button>
          </div>
        </template>
      </CampingCard>
    </div>

    <!-- RESTAURANTE -->
    <div v-else class="space-y-4">
      <div class="flex bg-white p-1 rounded-2xl border-2 border-brand-border">
        <button type="button" @click="restaurantTab = 'dishes'" :class="['flex-1 py-2 text-xs font-black rounded-xl transition-all', restaurantTab === 'dishes' ? 'bg-[#c5d7be] text-brand-dark shadow-2xs' : 'text-gray-500']">Platos Principales</button>
        <button type="button" @click="restaurantTab = 'sides'" :class="['flex-1 py-2 text-xs font-black rounded-xl transition-all', restaurantTab === 'sides' ? 'bg-[#c5d7be] text-brand-dark shadow-2xs' : 'text-gray-500']">Acompañamientos Glob.</button>
      </div>

      <div v-if="restaurantTab === 'dishes'" class="space-y-3">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button v-for="cat in dishCategories" :key="cat" type="button" @click="selectedDishCategoryFilter = cat" :class="['px-3.5 py-1.5 rounded-2xl text-xs font-black border transition-all shrink-0', selectedDishCategoryFilter === cat ? 'bg-brand-dark text-white border-brand-dark shadow-2xs' : 'bg-white text-gray-600 border-brand-border hover:bg-gray-50']">
            {{ cat }}
          </button>
        </div>

        <DishCard 
          v-for="dish in filteredMenuDishes" 
          :key="dish.id" 
          :dish="dish"
        >
          <template #actions="{ dish: item }">
            <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
              <button type="button" @click.stop="openEditDishModal(item)" class="py-2 px-3.5 bg-brand-light border border-brand-border text-brand-dark font-black text-xs rounded-xl hover:bg-gray-200 active:scale-95">Editar</button>
              <button type="button" @click.stop="confirmDelete('dish', item.id, item.name)" class="py-2 px-3.5 bg-rose-50 border border-rose-200 text-rose-700 font-black text-xs rounded-xl hover:bg-rose-100 active:scale-95">Eliminar</button>
            </div>
          </template>
        </DishCard>
      </div>

      <div v-else class="space-y-3">
        <div class="bg-white p-4 rounded-3xl border-2 border-brand-border space-y-2">
          <span class="text-xs font-black text-brand-dark block">+ Crear Nuevo Acompañamiento Global:</span>
          <div class="flex gap-2">
            <input v-model="newSideInput" type="text" placeholder="Ej: Ens. Chilena / Papas Mayo" class="flex-1 p-3 rounded-xl border-2 border-brand-border bg-brand-light text-xs font-bold" @keyup.enter.prevent="addSideDirectly" />
            <button type="button" @click="addSideDirectly" class="px-5 bg-brand-dark text-white rounded-xl font-black text-xs active:scale-95 shadow-2xs">Guardar</button>
          </div>
        </div>

        <div class="space-y-2">
          <div v-for="side in catalogStore.sideDishes" :key="side" class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-brand-accent stroke-[2.5]" />
              <span class="text-sm font-black text-brand-dark">{{ side }}</span>
            </div>
            <button type="button" @click="deleteSideDish(side)" class="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 active:scale-95 touch-target">
              <Trash2 class="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODALES DE CONFIGURACIÓN Y EDICIÓN -->
    <AdminContactEditModal :is-open="showContactModal" @close="showContactModal = false" />
    <CategorySchedulesModal :is-open="showSchedulesModal" @close="showSchedulesModal = false" />
    <CabinModal :is-open="showCabinModal" :cabin="selectedCabin" :is-editable="true" @close="showCabinModal = false" @save="saveCabin" />
    <CampingModal :is-open="showCampingModal" :site="selectedCamping" :is-editable="true" @close="showCampingModal = false" @save="saveCamping" />
    <DishModal :is-open="showDishModal" :dish="selectedDish" :is-editable="true" :global-side-dishes="catalogStore.sideDishes" @close="showDishModal = false" @save="saveDish" @add-global-side="handleGlobalSideAdded" />

    <!-- MODAL CONFIRMACIÓN ELIMINAR -->
    <div v-if="deleteTarget" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl p-5 border-2 border-brand-border shadow-2xl max-w-xs w-full space-y-4 text-center">
        <div class="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle class="w-6 h-6 stroke-[2.5]" />
        </div>
        <div class="space-y-1">
          <h3 class="text-base font-black text-brand-dark">¿Eliminar registro?</h3>
          <p class="text-xs font-bold text-gray-600">Estás a punto de borrar <strong>"{{ deleteTarget.name }}"</strong>. Esta acción no se puede deshacer.</p>
        </div>
        <div class="flex gap-2 pt-2">
          <button type="button" @click="deleteTarget = null" class="flex-1 py-2.5 bg-brand-light border border-brand-border rounded-xl font-black text-xs text-brand-dark">Cancelar</button>
          <button type="button" @click="executeDelete" class="flex-1 py-2.5 bg-rose-600 text-white rounded-xl font-black text-xs shadow-2xs">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- NAVEGACIÓN INFERIOR DE ADMINISTRACIÓN -->
    <AdminBottomNav />
  </div>
</template>