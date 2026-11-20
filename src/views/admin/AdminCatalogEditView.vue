<script setup lang="ts">
import HojaModal from '../../components/ui/HojaModal.vue'
import HorariosCabanaCard from '../../components/admin/HorariosCabanaCard.vue'
import HorariosCampingCard from '../../components/admin/HorariosCampingCard.vue'
import HorariosRestauranteCard from '../../components/admin/HorariosRestauranteCard.vue'
import CuposRestauranteCard from '../../components/admin/CuposRestauranteCard.vue'
import { ref, computed } from 'vue'
import { 
  Home, Tent, Utensils, Plus, Trash2, AlertTriangle, Pencil, Wrench, X, Check
} from 'lucide-vue-next'
import DropdownMenu from '../../components/ui/DropdownMenu.vue'
import CabinCard from '../../components/catalog/CabinCard.vue'
import CampingCard from '../../components/catalog/CampingCard.vue'
import DishCard from '../../components/catalog/DishCard.vue'
import CabinModal from '../../components/catalog/CabinModal.vue'
import CampingModal from '../../components/catalog/CampingModal.vue'
import DishModal from '../../components/catalog/DishModal.vue'
import { useCatalogStore } from '../../stores/catalogStore'
import { useRequestsStore } from '../../stores/requestsStore'
import { getUpcomingCabinRequests } from '../../services/availability'
import { formatDateShort, todayISO } from '../../lib/dates'
import type { MealType, ReservationRequest } from '../../types/domain'
import { ETIQUETAS_COMIDA, ORDEN_COMIDAS, platosQueUsanAcompanamiento } from '../../services/menus'
import type { Cabin, CampingSite, Dish } from '../../types/catalog'

const catalogStore = useCatalogStore()
const requestsStore = useRequestsStore()

// Pestañas Principales
const activeCategory = ref<'cabana' | 'camping' | 'restaurante'>('cabana')
const restaurantTab = ref<'dishes' | 'sides'>('dishes')

// Filtros Restaurante
const selectedDishCategoryFilter = ref<MealType | 'todos'>('todos')
const dishCategories: Array<{ valor: MealType | 'todos'; etiqueta: string }> = [
  { valor: 'todos', etiqueta: 'Todos' },
  ...ORDEN_COMIDAS.map(c => ({ valor: c, etiqueta: ETIQUETAS_COMIDA[c] }))
]

const filteredMenuDishes = computed(() => {
  if (selectedDishCategoryFilter.value === 'todos') {
    return catalogStore.dishes
  }
  return catalogStore.dishes.filter(d => d.mealType === selectedDishCategoryFilter.value)
})

// Modales de Edición
const showCabinModal = ref(false)
const selectedCabin = ref<Cabin | null>(null)

const showCampingModal = ref(false)
const selectedCamping = ref<CampingSite | null>(null)

const showDishModal = ref(false)
const selectedDish = ref<Dish | null>(null)

// Menús desplegables
const cardMenuItems = [
  { key: 'edit', label: 'Editar', icon: Pencil },
  { key: 'delete', label: 'Eliminar', icon: Trash2, danger: true }
]

// Menú de cada cabaña: además de editar y eliminar, activa o desactiva la mantención (SCRUM-266)
function cabinMenuItems(cabin: Cabin) {
  return [
    cardMenuItems[0],
    { key: 'maintenance', label: cabin.enMantencion ? 'Volver a habilitar' : 'Poner en mantención', icon: Wrench },
    cardMenuItems[1]
  ]
}

// Al poner en mantención una cabaña con reservas por venir, se avisa: esas reservas no cambian
const avisoMantencion = ref<{ cabana: string; solicitudes: ReservationRequest[] } | null>(null)

function avisarReservasPorVenir(cabin: Cabin) {
  const solicitudes = getUpcomingCabinRequests(cabin.id, requestsStore.requests, todayISO())
  avisoMantencion.value = solicitudes.length > 0 ? { cabana: cabin.name, solicitudes } : null
}

function describirReserva(r: ReservationRequest): string {
  const entrada = r.details?.startDate || r.date
  const salida = r.details?.endDate || r.timeOrDuration || ''
  return `${r.requestCode} · ${r.clientName} · ${formatDateShort(entrada)} al ${formatDateShort(salida)}`
}

function cambiarMantencion(cabin: Cabin) {
  const activar = !cabin.enMantencion
  catalogStore.updateCabin(cabin.id, { enMantencion: activar })
  if (activar) avisarReservasPorVenir(cabin)
  else avisoMantencion.value = null
}

function handleCardAction(key: string, kind: 'cabin' | 'camping' | 'dish', item: any) {
  if (key === 'maintenance') {
    cambiarMantencion(item)
  } else if (key === 'edit') {
    if (kind === 'cabin') openEditCabinModal(item)
    else if (kind === 'camping') openEditCampingModal(item)
    else openEditDishModal(item)
  } else if (key === 'delete') {
    confirmDelete(kind, item.id, item.name)
  }
}

// Acompañamiento Global Entrada Directa
const newSideInput = ref('')
/** Mensaje de la pestaña de acompañamientos: nombre repetido, o acompañamiento en uso que no se puede eliminar. */
const avisoAcompanamientos = ref<string | null>(null)
/** Acompañamiento que se está renombrando y el nombre que se va escribiendo. */
const sideEnEdicion = ref<string | null>(null)
const sideNuevoNombre = ref('')

async function addSideDirectly() {
  if (!newSideInput.value.trim()) return
  avisoAcompanamientos.value = await catalogStore.addGlobalSideDish(newSideInput.value)
  if (!avisoAcompanamientos.value) newSideInput.value = ''
}

function startRenameSide(side: string) {
  sideEnEdicion.value = side
  sideNuevoNombre.value = side
  avisoAcompanamientos.value = null
}

async function saveRenameSide() {
  if (sideEnEdicion.value === null) return
  const error = await catalogStore.renameGlobalSideDish(sideEnEdicion.value, sideNuevoNombre.value)
  avisoAcompanamientos.value = error
  if (!error) sideEnEdicion.value = null
}

async function deleteSideDish(side: string) {
  avisoAcompanamientos.value = null
  const enUso = await catalogStore.deleteGlobalSideDish(side)
  if (enUso.length > 0) {
    avisoAcompanamientos.value =
      `No se puede eliminar "${side}": lo ofrece ${enUso.length === 1 ? 'el plato' : 'los platos'} ${enUso.join(', ')}. ` +
      'Quítalo de ' + (enUso.length === 1 ? 'ese plato' : 'esos platos') + ' y vuelve a intentarlo.'
  }
}

/** Cuántos platos activos ofrecen el acompañamiento (se muestra en la lista). */
function cantidadDePlatosConSide(side: string): number {
  return platosQueUsanAcompanamiento(side, catalogStore.todosLosPlatos).length
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
    const cabin = selectedCabin.value
    const pasaAMantencion = cabinData.enMantencion === true && cabin.enMantencion !== true
    catalogStore.updateCabin(cabin.id, cabinData)
    if (pasaAMantencion) avisarReservasPorVenir(cabin)
    else if (cabinData.enMantencion !== true) avisoMantencion.value = null
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
    
    <!-- PESTAÑAS PRINCIPALES -->
    <div class="bg-white p-2 rounded-3xl border-2 border-brand-border shadow-2xs">
      <div class="grid grid-cols-3 gap-1.5 p-1 bg-brand-light rounded-2xl border border-brand-border">
        <button 
          type="button" 
          @click="activeCategory = 'cabana'" 
          :class="['py-2.5 px-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all', activeCategory === 'cabana' ? 'bg-[#c5d7be] text-brand-dark border border-brand-border shadow-2xs' : 'bg-white text-gray-700']"
        >
          <Home class="w-4 h-4 stroke-[2.5]" /> <span>Cabañas</span>
        </button>

        <button 
          type="button" 
          @click="activeCategory = 'camping'" 
          :class="['py-2.5 px-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all', activeCategory === 'camping' ? 'bg-[#c5d7be] text-brand-dark border border-brand-border shadow-2xs' : 'bg-white text-gray-700']"
        >
          <Tent class="w-4 h-4 stroke-[2.5]" /> <span>Camping</span>
        </button>

        <button 
          type="button" 
          @click="activeCategory = 'restaurante'" 
          :class="['py-2.5 px-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-all', activeCategory === 'restaurante' ? 'bg-[#c5d7be] text-brand-dark border border-brand-border shadow-2xs' : 'bg-white text-gray-700']"
        >
          <Utensils class="w-4 h-4 stroke-[2.5]" /> <span>Menú</span>
        </button>
      </div>
    </div>

    <!-- HORARIOS (y cupos del restaurante) del servicio elegido (SCRUM-280) -->
    <HorariosCabanaCard v-if="activeCategory === 'cabana'" />
    <HorariosCampingCard v-else-if="activeCategory === 'camping'" />
    <template v-else>
      <HorariosRestauranteCard />
      <CuposRestauranteCard />
    </template>

    <!-- BOTÓN NUEVO -->
    <div class="flex justify-end" v-if="!(activeCategory === 'restaurante' && restaurantTab === 'sides')">
      <button 
        type="button" 
        @click="openCreateModal" 
        class="w-full sm:w-auto py-3 px-5 bg-[#25636B] hover:bg-[#1c4c52] text-white font-bold text-sm rounded-2xl border-2 border-brand-border flex items-center justify-center gap-2 active:scale-95 shadow-sm transition-transform"
      >
        <Plus class="w-4 h-4 stroke-[2.5]" /> <span>{{ getAddButtonLabel }}</span>
      </button>
    </div>

    <!-- CABAÑAS -->
    <div v-if="activeCategory === 'cabana'" class="space-y-4">
      <div v-if="avisoMantencion" class="bg-amber-50 border-2 border-amber-600 rounded-2xl p-3 space-y-2" role="status">
        <div class="flex items-start justify-between gap-2">
          <p class="text-sm font-bold text-amber-950 flex items-start gap-1.5">
            <AlertTriangle class="w-5 h-5 stroke-[2.5] shrink-0" aria-hidden="true" />
            {{ avisoMantencion.cabana }} quedó en mantención, pero tiene {{ avisoMantencion.solicitudes.length }}
            {{ avisoMantencion.solicitudes.length === 1 ? 'reserva' : 'reservas' }} por venir. No cambian: revísalas desde Solicitudes.
          </p>
          <button type="button" aria-label="Cerrar aviso" @click="avisoMantencion = null" class="p-1 rounded-full text-amber-950 touch-target shrink-0">
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
        <ul class="text-sm font-bold text-amber-950 space-y-0.5">
          <li v-for="r in avisoMantencion.solicitudes" :key="r.id">{{ describirReserva(r) }}</li>
        </ul>
      </div>

      <CabinCard 
        v-for="cabin in catalogStore.cabins" 
        :key="cabin.id" 
        :cabin="cabin"
      >
        <template #actions="{ cabin: item }">
          <div class="flex items-center justify-end">
            <DropdownMenu :items="cabinMenuItems(item)" :aria-label="`Opciones de ${item.name}`" @select="key => handleCardAction(key, 'cabin', item)" />
          </div>
        </template>
      </CabinCard>
    </div>

    <!-- CAMPING -->
    <div v-else-if="activeCategory === 'camping'" class="space-y-4">
      <CampingCard v-for="site in catalogStore.campingSites" :key="site.id" :site="site">
        <template #actions="{ site: item }">
          <div class="flex items-center justify-end pt-2 border-t border-gray-100">
            <DropdownMenu :items="cardMenuItems" :aria-label="`Opciones de ${item.name}`" @select="key => handleCardAction(key, 'camping', item)" />
          </div>
        </template>
      </CampingCard>
    </div>

    <!-- RESTAURANTE -->
    <div v-else class="space-y-4">
      <div class="flex bg-white p-1 rounded-2xl border-2 border-brand-border">
        <button type="button" @click="restaurantTab = 'dishes'" :class="['flex-1 py-2 text-sm font-bold rounded-xl transition-all', restaurantTab === 'dishes' ? 'bg-[#c5d7be] text-brand-dark shadow-2xs' : 'text-gray-500']">Platos Principales</button>
        <button type="button" @click="restaurantTab = 'sides'" :class="['flex-1 py-2 text-sm font-bold rounded-xl transition-all', restaurantTab === 'sides' ? 'bg-[#c5d7be] text-brand-dark shadow-2xs' : 'text-gray-500']">Acompañamientos generales</button>
      </div>

      <div v-if="restaurantTab === 'dishes'" class="space-y-3">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button v-for="cat in dishCategories" :key="cat.valor" type="button" @click="selectedDishCategoryFilter = cat.valor" :class="['px-3.5 py-1.5 rounded-2xl text-sm font-bold border transition-all shrink-0', selectedDishCategoryFilter === cat.valor ? 'bg-brand-dark text-white border-brand-dark shadow-2xs' : 'bg-white text-gray-600 border-brand-border hover:bg-gray-50']">
            {{ cat.etiqueta }}
          </button>
        </div>

        <DishCard 
          v-for="dish in filteredMenuDishes" 
          :key="dish.id" 
          :dish="dish"
        >
          <template #menu="{ dish: item }">
            <DropdownMenu discreto :items="cardMenuItems" :aria-label="`Opciones de ${item.name}`" @select="key => handleCardAction(key, 'dish', item)" />
          </template>
        </DishCard>
      </div>

      <div v-else class="space-y-3">
        <div class="bg-white p-4 rounded-3xl border-2 border-brand-border space-y-2">
          <span class="text-base font-bold text-brand-dark block">Agregar acompañamiento general:</span>
          <div class="flex gap-2">
            <input v-model="newSideInput" type="text" placeholder="Ej: Ensalada chilena" class="flex-1 p-3 rounded-xl border-2 border-brand-border bg-brand-light text-base" @keyup.enter.prevent="addSideDirectly" />
            <button type="button" @click="addSideDirectly" class="px-5 bg-brand-dark text-white rounded-xl font-bold text-sm active:scale-95 shadow-2xs">Guardar</button>
          </div>
        </div>

        <div class="space-y-2">
          <p v-if="avisoAcompanamientos" role="alert" class="p-3 rounded-2xl bg-amber-50 border-2 border-amber-600 text-amber-950 text-sm font-bold">{{ avisoAcompanamientos }}</p>
          <div v-for="side in catalogStore.sideDishes" :key="side" class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs flex items-center justify-between gap-2">
            <form v-if="sideEnEdicion === side" class="flex items-center gap-2 grow" @submit.prevent="saveRenameSide">
              <input v-model="sideNuevoNombre" type="text" aria-label="Nuevo nombre del acompañamiento" class="flex-1 min-w-0 p-2.5 rounded-xl border-2 border-brand-border bg-brand-light text-base" @keyup.esc="sideEnEdicion = null" />
              <button type="submit" aria-label="Guardar nombre" class="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 active:scale-95">
                <Check class="w-5 h-5 stroke-2" />
              </button>
              <button type="button" aria-label="Cancelar" @click="sideEnEdicion = null" class="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-brand-light border border-brand-border text-brand-dark active:scale-95">
                <X class="w-5 h-5 stroke-2" />
              </button>
            </form>
            <template v-else>
              <div class="min-w-0">
                <p class="text-base text-brand-dark break-words min-w-0">{{ side }}</p>
                <p class="text-sm text-gray-600">
                  {{ cantidadDePlatosConSide(side) === 0 ? 'Sin platos' : cantidadDePlatosConSide(side) === 1 ? 'En 1 plato' : `En ${cantidadDePlatosConSide(side)} platos` }}
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button aria-label="Cambiar nombre" type="button" @click="startRenameSide(side)" class="w-11 h-11 flex items-center justify-center rounded-xl bg-brand-light border border-brand-border text-brand-dark active:scale-95">
                  <Pencil class="w-5 h-5 stroke-2" />
                </button>
                <button aria-label="Eliminar acompañamiento" type="button" @click="deleteSideDish(side)" class="w-11 h-11 flex items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-700 active:scale-95">
                  <Trash2 class="w-5 h-5 stroke-2" />
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- MODALES DE CONFIGURACIÓN Y EDICIÓN -->
    <CabinModal :is-open="showCabinModal" :cabin="selectedCabin" :is-editable="true" @close="showCabinModal = false" @save="saveCabin" />
    <CampingModal :is-open="showCampingModal" :site="selectedCamping" :is-editable="true" @close="showCampingModal = false" @save="saveCamping" />
    <DishModal :is-open="showDishModal" :dish="selectedDish" :is-editable="true" :global-side-dishes="catalogStore.sideDishes" @close="showDishModal = false" @save="saveDish" @add-global-side="handleGlobalSideAdded" />

    <!-- Confirmación de eliminar -->
    <HojaModal v-if="deleteTarget" :abierto="true" titulo="¿Eliminar registro?" ocultar-cierre @cerrar="deleteTarget = null">
      <p class="text-base text-gray-700">Estás a punto de borrar <strong class="font-bold">"{{ deleteTarget.name }}"</strong>. Esta acción no se puede deshacer.</p>
      <template #pie>
        <div class="grid grid-cols-2 gap-2">
          <button type="button" class="py-3.5 rounded-2xl border border-brand-dark bg-white text-brand-dark font-bold" @click="deleteTarget = null">Cancelar</button>
          <button type="button" class="py-3.5 rounded-2xl bg-rose-600 text-white font-bold" @click="executeDelete">Eliminar</button>
        </div>
      </template>
    </HojaModal>
  </div>
</template>