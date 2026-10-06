<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertTriangle, 
  Utensils, 
  Plus, 
  Minus,
  Sparkles,
  ChevronRight,
  Info
} from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'

const router = useRouter()
const store = useReservationStore()

const totalGuests = computed(() => store.guestsCount || 1)

// Modal de confirmación para asignaciones parciales
const showPartialModal = ref(false)

// 1. ORDEN FIJO ESTRICTO: Desayuno -> Almuerzo -> Once
const canonicalOrder = ['desayuno', 'almuerzo', 'once']

const activeMealTypes = computed<string[]>(() => {
  const selected = store.selectedMealTypes || ['almuerzo']
  return canonicalOrder.filter(m => selected.includes(m))
})

const mealLabels: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  once: 'Once'
}

const activeMealIndex = ref(0)

const currentMealId = computed(() => {
  return activeMealTypes.value[activeMealIndex.value] || activeMealTypes.value[0] || 'almuerzo'
})

const currentMealLabel = computed(() => mealLabels[currentMealId.value] || 'Servicio')

interface MenuItem {
  id: string
  mealType: 'desayuno' | 'almuerzo' | 'once'
  name: string
  description: string
  price: number
  availableSideDishes: string[]
}

const fullCatalog: MenuItem[] = [
  // Desayuno
  {
    id: 'desayuno-campesino',
    mealType: 'desayuno',
    name: 'Desayuno Campesino',
    description: 'Huevos de campo, queso fresco, mermelada casera, pan amasado, té/café/leche',
    price: 8000,
    availableSideDishes: []
  },
  {
    id: 'desayuno-tradicional',
    mealType: 'desayuno',
    name: 'Desayuno Tradicional',
    description: 'Pan amasado caliente, mantequilla de campo, mermelada de la casa, té/café/leche',
    price: 6000,
    availableSideDishes: []
  },
  
  // Almuerzo
  {
    id: 'almuerzo-cordero-cerdo',
    mealType: 'almuerzo',
    name: 'Cordero y cerdo',
    description: 'Asado tradicional al palo con ensaladas surtidas de la estación',
    price: 20000,
    availableSideDishes: ['Papas al vapor', 'Puré de papas', 'Papas rústicas']
  },
  {
    id: 'almuerzo-vacuno-bechamel',
    mealType: 'almuerzo',
    name: 'Vacuno con bechamel',
    description: 'Carne jugosa al horno con salsa bechamel, ensalada y postre casero',
    price: 21000,
    availableSideDishes: ['Papas rústicas', 'Arroz', 'Puré de papas']
  },
  {
    id: 'almuerzo-salmon-camarones',
    mealType: 'almuerzo',
    name: 'Salmón con salsa de camarones',
    description: 'Filete de salmón fresco con salsa de camarones y pan amasado',
    price: 21000,
    availableSideDishes: ['Puré de papas', 'Papas al vapor', 'Arroz']
  },
  {
    id: 'almuerzo-chuletas-cerdo',
    mealType: 'almuerzo',
    name: 'Chuletas de cerdo',
    description: 'Chuletas doradas a la plancha con ensaladas frescas',
    price: 13000,
    availableSideDishes: ['Puré de papas', 'Papas rústicas', 'Arroz']
  },

  // Once
  {
    id: 'once-campesina',
    mealType: 'once',
    name: 'Once Campesina',
    description: 'Tostadas en estufa a leña, queso chanco, jamón artesanal, kuchen casero, té/café',
    price: 10000,
    availableSideDishes: []
  },
  {
    id: 'once-tradicional',
    mealType: 'once',
    name: 'Once Tradicional',
    description: 'Pan amasado caliente, mantequilla, mermelada casera, kuchen, té/café',
    price: 7000,
    availableSideDishes: []
  }
]

// Formato limpio de moneda CLP
function formatCLP(val: number): string {
  return '\$' + val.toLocaleString('es-CL')
}

// Inicialización de selecciones
const selections = ref<Record<string, { count: number; sides: Record<string, number> }>>({})

fullCatalog.forEach(dish => {
  const existing = store.selectedMenus?.[dish.id]
  selections.value[dish.id] = {
    count: existing?.count || 0,
    sides: existing?.sides ? { ...existing.sides } : {}
  }
})

const currentMealDishes = computed(() => {
  return fullCatalog.filter(item => item.mealType === currentMealId.value)
})

const mealSelectedCount = computed(() => {
  return currentMealDishes.value.reduce((acc, dish) => {
    return acc + (selections.value[dish.id]?.count || 0)
  }, 0)
})

const dishStatusMap = computed(() => {
  const result: Record<string, { isComplete: boolean; assignedSides: number; requiredSides: number; missing: number }> = {}
  
  fullCatalog.forEach(dish => {
    const sel = selections.value[dish.id] || { count: 0, sides: {} }
    const required = sel.count
    const hasSides = dish.availableSideDishes.length > 0
    
    if (!hasSides) {
      result[dish.id] = {
        isComplete: true,
        assignedSides: 0,
        requiredSides: 0,
        missing: 0
      }
    } else {
      const assigned = Object.values(sel.sides).reduce((sum, n) => sum + n, 0)
      const isComplete = required === 0 || assigned === required
      result[dish.id] = {
        isComplete,
        assignedSides: assigned,
        requiredSides: required,
        missing: Math.max(0, required - assigned)
      }
    }
  })
  
  return result
})

function isMealValid(mealId: string): boolean {
  const dishes = fullCatalog.filter(d => d.mealType === mealId)
  const totalCount = dishes.reduce((sum, d) => sum + (selections.value[d.id]?.count || 0), 0)
  
  if (totalCount > totalGuests.value) return false
  return dishes.every(d => dishStatusMap.value[d.id]?.isComplete)
}

function getMealSelectedCount(mealId: string): number {
  const dishes = fullCatalog.filter(d => d.mealType === mealId)
  return dishes.reduce((sum, d) => sum + (selections.value[d.id]?.count || 0), 0)
}

const isCurrentMealValid = computed(() => {
  return isMealValid(currentMealId.value)
})

const areAllMealsValid = computed(() => {
  return activeMealTypes.value.every(mealId => isMealValid(mealId))
})

// Detecta si alguna categoría tiene menos platos que el total de comensales
const hasPartialAssignments = computed(() => {
  return activeMealTypes.value.some(mealId => {
    const count = getMealSelectedCount(mealId)
    return count < totalGuests.value
  })
})

const partialSummary = computed(() => {
  return activeMealTypes.value
    .filter(mealId => getMealSelectedCount(mealId) < totalGuests.value)
    .map(mealId => `${mealLabels[mealId]} (${getMealSelectedCount(mealId)} de ${totalGuests.value})`)
    .join(', ')
})

function updateDishCount(dishId: string, delta: number) {
  const current = selections.value[dishId]?.count || 0
  const newCount = Math.max(0, current + delta)
  
  selections.value[dishId].count = newCount
  
  const totalSides = Object.values(selections.value[dishId].sides).reduce((a, b) => a + b, 0)
  if (totalSides > newCount) {
    selections.value[dishId].sides = {}
  }
}

function updateSideCount(dishId: string, sideName: string, delta: number) {
  const dishCount = selections.value[dishId]?.count || 0
  if (dishCount === 0) return

  const currentSides = selections.value[dishId].sides[sideName] || 0
  const currentTotalSides = Object.values(selections.value[dishId].sides).reduce((a, b) => a + b, 0)
  
  if (delta > 0 && currentTotalSides >= dishCount) return
  
  const newSideCount = Math.max(0, currentSides + delta)
  selections.value[dishId].sides[sideName] = newSideCount
}

function selectMealTab(index: number) {
  if (index >= 0 && index < activeMealTypes.value.length) {
    activeMealIndex.value = index
  }
}

function handleNextMeal() {
  if (activeMealIndex.value < activeMealTypes.value.length - 1) {
    activeMealIndex.value++
  } else {
    handleGoToStep3()
  }
}

function handleGoToStep3() {
  if (!areAllMealsValid.value) return
  
  if (hasPartialAssignments.value) {
    showPartialModal.value = true
  } else {
    confirmAndProceed()
  }
}

function confirmAndProceed() {
  showPartialModal.value = false
  store.selectedMenus = { ...selections.value }
  store.nextStep()
  router.push({ name: 'restaurant-step3' })
}

function handleBack() {
  if (activeMealIndex.value > 0) {
    activeMealIndex.value--
  } else {
    store.prevStep()
    router.push({ name: 'restaurant-step1' })
  }
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto pb-32">
    
    <!-- Indicador de Pasos Estándar (Único encabezado) -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="2" />
    </div>

    <BaseAlert variant="info" title="Selección de Menú por Servicio">
      Asigna los menús para tus {{ totalGuests }} comensales. Si deseas, puedes asignar menús solo a una parte del grupo.
    </BaseAlert>

    <!-- Pestañas Ordenadas Estrictamente (Desayuno -> Almuerzo -> Once) -->
    <div v-if="activeMealTypes.length > 1" class="flex gap-2 p-1 bg-brand-light rounded-2xl border-2 border-brand-border">
      <button
        type="button"
        v-for="(mId, idx) in activeMealTypes"
        :key="mId"
        @click="selectMealTab(idx)"
        :class="[
          'flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border',
          activeMealIndex === idx
            ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
            : 'bg-white text-brand-dark border-brand-border hover:bg-gray-100'
        ]"
      >
        <span>{{ mealLabels[mId] }}</span>
        <span 
          :class="[
            'text-[10px] px-1.5 py-0.2 rounded-full font-extrabold',
            isMealValid(mId) && getMealSelectedCount(mId) > 0
              ? 'bg-emerald-400 text-brand-dark'
              : 'bg-gray-200 text-gray-700'
          ]"
        >
          {{ getMealSelectedCount(mId) }}/{{ totalGuests }}
        </span>
      </button>
    </div>

    <!-- Lista de Platos por Servicio -->
    <div class="space-y-4">
      <div 
        v-for="dish in currentMealDishes" 
        :key="dish.id"
        :class="[
          'bg-white rounded-3xl border-2 p-4 transition-all shadow-sm space-y-3 relative',
          dish.availableSideDishes.length > 0 && !dishStatusMap[dish.id].isComplete
            ? 'border-rose-500 bg-rose-50/20 ring-4 ring-rose-500/10'
            : selections[dish.id]?.count > 0
              ? 'border-brand-dark bg-white'
              : 'border-brand-border hover:border-gray-400'
        ]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <h3 class="text-lg font-black text-brand-dark leading-tight">{{ dish.name }}</h3>
            <p class="text-xs font-bold text-gray-500 leading-relaxed">{{ dish.description }}</p>
            <span class="inline-block text-base font-black text-brand-dark mt-1">
              {{ formatCLP(dish.price) }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 bg-brand-light p-1.5 rounded-2xl border-2 border-brand-border shrink-0">
            <button
              type="button"
              @click="updateDishCount(dish.id, -1)"
              class="w-8 h-8 rounded-xl bg-white border border-brand-border font-black text-lg flex items-center justify-center active:scale-95 touch-target"
            >
              <Minus class="w-4 h-4 stroke-[2.5]" />
            </button>
            <span class="w-7 text-center font-black text-lg text-brand-dark">
              {{ selections[dish.id]?.count || 0 }}
            </span>
            <button
              type="button"
              @click="updateDishCount(dish.id, 1)"
              class="w-8 h-8 rounded-xl bg-white border border-brand-border font-black text-lg flex items-center justify-center active:scale-95 touch-target"
            >
              <Plus class="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <!-- Acompañamientos -->
        <div 
          v-if="selections[dish.id]?.count > 0 && dish.availableSideDishes.length > 0"
          class="pt-3 border-t-2 border-gray-100 space-y-2.5"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-extrabold text-gray-600 flex items-center gap-1">
              <Sparkles class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
              Acompañamientos:
            </span>

            <span 
              :class="[
                'text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1',
                dishStatusMap[dish.id].isComplete
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800 animate-pulse'
              ]"
            >
              <Check v-if="dishStatusMap[dish.id].isComplete" class="w-3.5 h-3.5 stroke-[2.5]" />
              <AlertTriangle v-else class="w-3.5 h-3.5 stroke-[2.5]" />
              {{ dishStatusMap[dish.id].assignedSides }} de {{ dishStatusMap[dish.id].requiredSides }}
            </span>
          </div>

          <div 
            v-if="!dishStatusMap[dish.id].isComplete"
            class="bg-rose-50 border border-rose-300 text-rose-900 p-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2"
          >
            <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0 stroke-[2.5]" />
            <span>Falta asignar {{ dishStatusMap[dish.id].missing }} acompañamiento(s) para este plato.</span>
          </div>

          <div class="space-y-2 bg-brand-light p-3 rounded-2xl border border-brand-border">
            <div 
              v-for="side in dish.availableSideDishes" 
              :key="side"
              class="flex items-center justify-between text-xs font-bold text-gray-700"
            >
              <span>{{ side }}</span>
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  @click="updateSideCount(dish.id, side, -1)"
                  class="w-7 h-7 rounded-lg bg-white border border-brand-border font-extrabold flex items-center justify-center active:scale-95 touch-target"
                >
                  <Minus class="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
                <span class="w-5 text-center font-black text-brand-dark">
                  {{ selections[dish.id]?.sides[side] || 0 }}
                </span>
                <button
                  type="button"
                  @click="updateSideCount(dish.id, side, 1)"
                  class="w-7 h-7 rounded-lg bg-white border border-brand-border font-extrabold flex items-center justify-center active:scale-95 touch-target"
                >
                  <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- BARRA INFERIOR FIJA: CONTEO EN TIEMPO REAL + NAVEGACIÓN -->
    <div class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-3.5 shadow-2xl">
      <div class="max-w-md mx-auto space-y-2.5">
        
        <div class="flex items-center justify-between bg-brand-dark text-white px-3.5 py-2 rounded-xl text-xs">
          <div class="flex items-center gap-2">
            <Utensils class="w-4 h-4 text-emerald-300 stroke-[2.5]" />
            <span class="font-extrabold">
              {{ currentMealLabel }}: <strong class="text-emerald-300 font-black">{{ mealSelectedCount }} de {{ totalGuests }}</strong> platos
            </span>
          </div>

          <div>
            <span 
              v-if="mealSelectedCount === totalGuests && isCurrentMealValid"
              class="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <Check class="w-3 h-3 stroke-[2.5]" />
              Completo
            </span>
            <span 
              v-else-if="mealSelectedCount < totalGuests && isCurrentMealValid"
              class="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1"
            >
              <Info class="w-3 h-3 stroke-[2.5]" />
              Parcial ({{ mealSelectedCount }}/{{ totalGuests }})
            </span>
            <span 
              v-else-if="mealSelectedCount > totalGuests"
              class="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full"
            >
              Excede {{ mealSelectedCount - totalGuests }}
            </span>
            <span 
              v-else
              class="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full"
            >
              Acompañamientos pendientes
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <BaseButton variant="outline" size="lg" @click="handleBack">
            <ArrowLeft class="w-5 h-5 mr-1 stroke-[2.5]" />
            Volver
          </BaseButton>

          <BaseButton 
            v-if="activeMealIndex < activeMealTypes.length - 1"
            variant="primary" 
            size="lg" 
            fullWidth 
            :disabled="!isCurrentMealValid"
            @click="handleNextMeal"
          >
            Siguiente: {{ mealLabels[activeMealTypes[activeMealIndex + 1]] }}
            <ChevronRight class="w-5 h-5 ml-1 stroke-[2.5]" />
          </BaseButton>

          <BaseButton 
            v-else
            variant="primary" 
            size="lg" 
            fullWidth 
            :disabled="!areAllMealsValid"
            @click="handleGoToStep3"
          >
            Tus Datos
            <ArrowRight class="w-5 h-5 ml-1 stroke-[2.5]" />
          </BaseButton>
        </div>

      </div>
    </div>

    <!-- MODAL DE CONFIRMACIÓN PARA ASIGNACIÓN PARCIAL -->
    <div 
      v-if="showPartialModal" 
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
    >
      <div class="bg-white rounded-3xl p-6 border-2 border-brand-border shadow-2xl max-w-sm w-full space-y-4 text-center">
        <div class="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle class="w-7 h-7 stroke-[2.5]" />
        </div>

        <div class="space-y-1.5">
          <h3 class="text-lg font-black text-brand-dark">¿Confirmar platos parciales?</h3>
          <p class="text-xs font-semibold text-gray-600 leading-relaxed">
            Hemos detectado que en algunos servicios asignaste menos platos que el total de comensales (<strong>{{ totalGuests }} personas</strong>):
          </p>
          <div class="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs font-black text-amber-950 mt-2">
            {{ partialSummary }}
          </div>
        </div>

        <div class="space-y-2 pt-2">
          <BaseButton variant="primary" size="lg" fullWidth @click="confirmAndProceed">
            Sí, continuar a tus datos
          </BaseButton>
          <BaseButton variant="outline" size="lg" fullWidth @click="showPartialModal = false">
            Volver a revisar los menús
          </BaseButton>
        </div>
      </div>
    </div>

  </div>
</template>