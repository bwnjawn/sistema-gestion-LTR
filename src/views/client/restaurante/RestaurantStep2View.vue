<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowLeft, 
  ArrowRight, 
  Minus, 
  Plus, 
  Sparkles, 
  Check, 
  AlertTriangle,
  Utensils,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-vue-next'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useAdminStore, type Dish } from '../../../stores/adminStore'

const router = useRouter()
const store = useReservationStore()
const adminStore = useAdminStore()

const totalGuests = computed(() => store.guestsCount || 1)

const mealLabels: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  once: 'Once'
}

const MEAL_ORDER = ['desayuno', 'almuerzo', 'once']

const activeMealTypes = computed(() => {
  const selected = (store.selectedMealTypes && store.selectedMealTypes.length > 0)
    ? store.selectedMealTypes
    : ['almuerzo']
  return MEAL_ORDER.filter(m => selected.includes(m))
})

const activeMealIndex = ref(0)
const currentMealType = computed(() => activeMealTypes.value[activeMealIndex.value] || 'almuerzo')

const currentMealDishes = computed(() => {
  const catLabel = mealLabels[currentMealType.value]?.toLowerCase() || 'almuerzo'
  return adminStore.dishes.filter(d => {
    const dishCategory = (d.mealCategory || '').toLowerCase()
    return dishCategory === catLabel || (currentMealType.value === 'almuerzo' && !d.mealCategory)
  })
})

const selections = ref<Record<string, { count: number; sides: Record<string, number> }>>({})
const showIncompleteModal = ref(false) // Estado para controlar el modal de selección incompleta

onMounted(() => {
  if (store.selectedMenus && Object.keys(store.selectedMenus).length > 0) {
    selections.value = JSON.parse(JSON.stringify(store.selectedMenus))
  } else if (Array.isArray(store.selectedMeals) && store.selectedMeals.length > 0) {
    store.selectedMeals.forEach((meal: any) => {
      selections.value[meal.id] = {
        count: meal.count || 1,
        sides: meal.sides || {}
      }
    })
  }
})

function getSideDishes(dish: Dish): string[] {
  return dish.availableSideDishes || dish.availableSides || []
}

const dishStatusMap = computed(() => {
  const map: Record<string, { assignedSides: number; requiredSides: number; missing: number; isComplete: boolean }> = {}
  
  adminStore.dishes.forEach(dish => {
    const sel = selections.value[dish.id] || { count: 0, sides: {} }
    const count = sel.count || 0
    const sides = sel.sides || {}

    if (dish.fixedSide) {
      map[dish.id] = { assignedSides: count, requiredSides: count, missing: 0, isComplete: true }
      return
    }

    const availableSides = getSideDishes(dish)
    const requiredSides = availableSides.length > 0 ? count : 0
    const assignedSides = Object.values(sides).reduce((a, b) => a + Number(b), 0)
    const missing = Math.max(0, requiredSides - assignedSides)
    const isComplete = count === 0 || requiredSides === 0 || assignedSides >= requiredSides

    map[dish.id] = { assignedSides, requiredSides, missing, isComplete }
  })

  return map
})

const distinctSelectedInCurrentMeal = computed(() => {
  return currentMealDishes.value.filter(dish => (selections.value[dish.id]?.count || 0) > 0).length
})

const isGroupOver30 = computed(() => totalGuests.value > 30)
const showVarietyLimitWarning = ref(false)

function updateDishCount(dishId: string, delta: number) {
  if (!selections.value[dishId]) {
    selections.value[dishId] = { count: 0, sides: {} }
  }
  const currentCount = selections.value[dishId].count

  if (delta > 0 && currentCount === 0 && isGroupOver30.value && distinctSelectedInCurrentMeal.value >= 3) {
    showVarietyLimitWarning.value = true
    return
  }

  showVarietyLimitWarning.value = false
  const newCount = Math.max(0, currentCount + delta)
  selections.value[dishId].count = newCount

  if (newCount === 0) {
    selections.value[dishId].sides = {}
  }
}

function handleDishCountInput(dishId: string, event: Event) {
  const input = event.target as HTMLInputElement
  let val = parseInt(input.value, 10)
  if (isNaN(val) || val < 0) val = 0

  if (!selections.value[dishId]) {
    selections.value[dishId] = { count: 0, sides: {} }
  }

  const currentCount = selections.value[dishId].count
  if (val > 0 && currentCount === 0 && isGroupOver30.value && distinctSelectedInCurrentMeal.value >= 3) {
    showVarietyLimitWarning.value = true
    selections.value[dishId].count = 0
    input.value = '0'
    return
  }

  showVarietyLimitWarning.value = false
  selections.value[dishId].count = val
  if (val === 0) {
    selections.value[dishId].sides = {}
  }
}

function updateSideCount(dishId: string, sideName: string, delta: number) {
  if (!selections.value[dishId]) return
  const dishCount = selections.value[dishId].count || 0
  const currentSides = selections.value[dishId].sides || {}
  const currentSideCount = currentSides[sideName] || 0
  const totalAssigned = Object.values(currentSides).reduce((a, b) => a + Number(b), 0)

  if (delta > 0 && totalAssigned >= dishCount) {
    return
  }

  const newSideCount = Math.max(0, currentSideCount + delta)
  selections.value[dishId].sides = {
    ...currentSides,
    [sideName]: newSideCount
  }
}

function handleSideCountInput(dishId: string, sideName: string, event: Event) {
  const input = event.target as HTMLInputElement
  let val = parseInt(input.value, 10)
  if (isNaN(val) || val < 0) val = 0

  if (!selections.value[dishId]) return
  const dishCount = selections.value[dishId].count || 0
  const currentSides = { ...(selections.value[dishId].sides || {}) }
  
  delete currentSides[sideName]
  const otherAssigned = Object.values(currentSides).reduce((a, b) => a + Number(b), 0)
  
  const maxAllowedForThisSide = Math.max(0, dishCount - otherAssigned)
  const finalVal = Math.min(val, maxAllowedForThisSide)

  input.value = String(finalVal)
  selections.value[dishId].sides = {
    ...(selections.value[dishId].sides || {}),
    [sideName]: finalVal
  }
}

function getMealSelectedCount(mealType: string): number {
  const catLabel = mealLabels[mealType]?.toLowerCase() || ''
  const mealDishes = adminStore.dishes.filter(d => (d.mealCategory || '').toLowerCase() === catLabel)
  return mealDishes.reduce((sum, dish) => sum + (selections.value[dish.id]?.count || 0), 0)
}

function isMealValid(mealType: string): boolean {
  const catLabel = mealLabels[mealType]?.toLowerCase() || ''
  const mealDishes = adminStore.dishes.filter(d => (d.mealCategory || '').toLowerCase() === catLabel)
  return mealDishes.every(dish => {
    const sel = selections.value[dish.id]
    if (!sel || sel.count === 0) return true
    return dishStatusMap.value[dish.id]?.isComplete
  })
}

const totalSelectedDishes = computed(() => {
  return Object.values(selections.value).reduce((acc, item) => acc + (item.count || 0), 0)
})

const isFormValid = computed(() => {
  if (totalSelectedDishes.value === 0) return false

  return Object.keys(selections.value).every(dishId => {
    const count = selections.value[dishId]?.count || 0
    if (count === 0) return true
    return dishStatusMap.value[dishId]?.isComplete
  })
})

function formatCLP(amount: number): string {
  return `$${amount.toLocaleString('es-CL')}`
}

function selectMealTab(idx: number) {
  activeMealIndex.value = idx
  showVarietyLimitWarning.value = false
}

// Evaluación antes de avanzar
function handleNext() {
  if (!isFormValid.value) return

  // 1. Si los menús seleccionados son menores que la cantidad de personas, abrir modal de confirmación
  if (totalSelectedDishes.value < totalGuests.value) {
    showIncompleteModal.value = true
    return
  }

  proceedToStep3()
}

// Guarda selecciones y navega al Paso 3
function proceedToStep3() {
  showIncompleteModal.value = false
  store.selectedMenus = JSON.parse(JSON.stringify(selections.value))

  const mealsList: any[] = []
  Object.entries(selections.value).forEach(([dishId, data]) => {
    if (data && data.count > 0) {
      const dish = adminStore.dishes.find(d => d.id === dishId)
      if (dish) {
        let finalSides = data.sides || {}
        if (dish.fixedSide) {
          finalSides = { [dish.fixedSide]: data.count }
        }

        mealsList.push({
          id: dish.id,
          name: dish.name,
          price: dish.price,
          count: data.count,
          sides: finalSides,
          fixedSide: dish.fixedSide,
          mealCategory: dish.mealCategory
        })
      }
    }
  })

  store.selectedMeals = mealsList
  router.push('/restaurante/paso3')
}

function handleBack() {
  router.push('/restaurante/paso1')
}
</script>

<template>
  <div class="space-y-4 pb-24 relative">
    
    <!-- 1. MODAL DE CONFIRMACIÓN POR SELECCIÓN INCOMPLETA -->
    <Transition name="fade">
      <div 
        v-if="showIncompleteModal" 
        class="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <div class="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-brand-border shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div class="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle class="w-7 h-7 stroke-[2.5]" />
          </div>

          <div class="text-center space-y-2">
            <h3 class="text-lg font-black text-brand-dark">Menús Incompletos</h3>
            <p class="text-xs font-semibold text-gray-600 leading-relaxed">
              Has asignado <strong class="text-brand-dark font-black">{{ totalSelectedDishes }} de {{ totalGuests }}</strong> menús para tu grupo.
            </p>
            <p class="text-[11px] font-bold text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              ¿Deseas continuar con estos menús o prefieres ajustar las cantidades antes de avanzar?
            </p>
          </div>

          <div class="space-y-2 pt-1">
            <BaseButton 
              variant="primary" 
              size="lg" 
              fullWidth 
              @click="proceedToStep3"
            >
              Continuar de todos modos
            </BaseButton>

            <BaseButton 
              variant="outline" 
              size="lg" 
              fullWidth 
              @click="showIncompleteModal = false"
            >
              Ajustar Menús
            </BaseButton>
          </div>
        </div>
      </div>
    </Transition>

    <!-- AVISO FLOTANTE SUPERIOR FIJO PARA LÍMITE DE 3 MENÚS -->
    <Transition name="fade">
      <div 
        v-if="showVarietyLimitWarning" 
        class="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto bg-amber-500 text-white p-3.5 rounded-2xl shadow-2xl border-2 border-amber-600 font-bold text-xs flex items-center justify-between gap-3"
      >
        <div class="flex items-center gap-2">
          <AlertTriangle class="w-5 h-5 text-white shrink-0 stroke-[2.5]" />
          <span>
            Para grupos de más de 30 personas, se permite un <strong>máximo de 3 variedades de menú en {{ mealLabels[currentMealType] }}</strong>.
          </span>
        </div>
        <button 
          type="button" 
          @click="showVarietyLimitWarning = false"
          class="p-1 hover:bg-amber-600 rounded-lg transition-colors shrink-0"
        >
          <X class="w-4 h-4 text-white stroke-[2.5]" />
        </button>
      </div>
    </Transition>

    <!-- Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="2" />
    </div>

    <!-- Alerta Guiada -->
    <BaseAlert variant="info" title="Selección de Menú por Servicio">
      <div class="flex items-center justify-between gap-2">
        <span>Asigna los menús para tus {{ totalGuests }} comensales.</span>
        <span class="bg-brand-dark text-white px-2.5 py-0.5 rounded-full font-black text-xs shrink-0 flex items-center gap-1">
          <Utensils class="w-3.5 h-3.5 text-emerald-300 stroke-[2.5]" />
          {{ totalSelectedDishes }} / {{ totalGuests }}
        </span>
      </div>
    </BaseAlert>

    <!-- Pestañas Ordenadas -->
    <div v-if="activeMealTypes.length > 1" class="flex gap-2 p-1 bg-brand-light rounded-2xl border-2 border-brand-border">
      <button
        type="button"
        v-for="(mId, idx) in activeMealTypes"
        :key="mId"
        @click="selectMealTab(idx)"
        :class="[
          'flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 border touch-target',
          activeMealIndex === idx
            ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
            : 'bg-white text-brand-dark border-brand-border hover:bg-gray-100'
        ]"
      >
        <span>{{ mealLabels[mId] }}</span>
        <span 
          :class="[
            'text-[10px] px-1.5 py-0.5 rounded-full font-extrabold',
            isMealValid(mId) && getMealSelectedCount(mId) > 0
              ? 'bg-emerald-400 text-brand-dark'
              : 'bg-gray-200 text-gray-700'
          ]"
        >
          {{ getMealSelectedCount(mId) }}/{{ totalGuests }}
        </span>
      </button>
    </div>

    <!-- Lista de Platos -->
    <div class="space-y-4">
      <div 
        v-for="dish in currentMealDishes" 
        :key="dish.id"
        :class="[
          'bg-white rounded-3xl border-2 p-4 transition-all shadow-sm space-y-3 relative',
          !dish.fixedSide && getSideDishes(dish).length > 0 && selections[dish.id]?.count > 0 && !dishStatusMap[dish.id]?.isComplete
            ? 'border-rose-500 bg-rose-50/20 ring-4 ring-rose-500/10'
            : selections[dish.id]?.count > 0
              ? 'border-brand-dark bg-white'
              : 'border-brand-border hover:border-gray-400'
        ]"
      >
        <!-- Foto con Precio Flotante -->
        <div class="relative h-40 w-full bg-gray-100 rounded-2xl overflow-hidden mb-1">
          <img 
            :src="dish.image || dish.mainImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'" 
            :alt="dish.name"
            class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            @error="(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80' }"
          />
          <div class="absolute top-2.5 right-2.5 bg-brand-dark/95 text-white font-black text-xs px-3 py-1 rounded-full backdrop-blur-xs border border-white/20 shadow-xs">
            {{ formatCLP(dish.price) }}
          </div>
        </div>

        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <h3 class="text-lg font-black text-brand-dark leading-tight">{{ dish.name }}</h3>
            <p class="text-xs font-bold text-gray-500 leading-relaxed">{{ dish.description }}</p>
          </div>

          <!-- CONTADOR DE PLATOS CON TECLADO NUMÉRICO ESTRICTO (pattern="[0-9]*" + inputmode="numeric") -->
          <div class="flex items-center gap-1.5 bg-brand-light p-1.5 rounded-2xl border-2 border-brand-border shrink-0">
            <button
              type="button"
              @click="updateDishCount(dish.id, -1)"
              class="w-8 h-8 rounded-xl bg-white border border-brand-border font-black text-lg flex items-center justify-center active:scale-95 touch-target"
            >
              <Minus class="w-4 h-4 stroke-[2.5]" />
            </button>

            <input
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              :value="selections[dish.id]?.count || 0"
              @input="(e) => handleDishCountInput(dish.id, e)"
              class="w-12 text-center font-black text-base text-brand-dark bg-transparent border-b-2 border-brand-accent focus:outline-none focus:border-brand-dark p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            <button
              type="button"
              @click="updateDishCount(dish.id, 1)"
              class="w-8 h-8 rounded-xl bg-white border border-brand-border font-black text-lg flex items-center justify-center active:scale-95 touch-target"
            >
              <Plus class="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        <!-- Acompañamiento Fijo -->
        <div 
          v-if="selections[dish.id]?.count > 0 && dish.fixedSide"
          class="pt-3 border-t-2 border-gray-100"
        >
          <div class="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 class="w-4 h-4 text-emerald-700 shrink-0 stroke-[2.5]" />
            <span>Acompañamiento fijo incluido: <strong>{{ dish.fixedSide }}</strong></span>
          </div>
        </div>

        <!-- Acompañamientos Elegibles -->
        <div 
          v-if="selections[dish.id]?.count > 0 && !dish.fixedSide && getSideDishes(dish).length > 0"
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
                dishStatusMap[dish.id]?.isComplete
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800 animate-pulse'
              ]"
            >
              <Check v-if="dishStatusMap[dish.id]?.isComplete" class="w-3.5 h-3.5 stroke-[2.5]" />
              <AlertTriangle v-else class="w-3.5 h-3.5 stroke-[2.5]" />
              {{ dishStatusMap[dish.id]?.assignedSides }} de {{ dishStatusMap[dish.id]?.requiredSides }}
            </span>
          </div>

          <div 
            v-if="!dishStatusMap[dish.id]?.isComplete"
            class="bg-rose-50 border border-rose-300 text-rose-900 p-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2"
          >
            <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0 stroke-[2.5]" />
            <span>Falta asignar {{ dishStatusMap[dish.id]?.missing }} acompañamiento(s) para este plato.</span>
          </div>

          <div class="space-y-2 bg-brand-light p-3 rounded-2xl border border-brand-border">
            <div 
              v-for="side in getSideDishes(dish)" 
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

                <!-- INPUT DE ACOMPAÑAMIENTOS CON PAD NUMÉRICO ESTRICTO -->
                <input
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  :value="selections[dish.id]?.sides?.[side] || 0"
                  @input="(e) => handleSideCountInput(dish.id, side, e)"
                  class="w-10 text-center font-black text-xs text-brand-dark bg-transparent border-b border-brand-accent focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <button
                  type="button"
                  :disabled="dishStatusMap[dish.id]?.assignedSides >= (selections[dish.id]?.count || 0)"
                  @click="updateSideCount(dish.id, side, 1)"
                  :class="[
                    'w-7 h-7 rounded-lg font-extrabold flex items-center justify-center touch-target border',
                    dishStatusMap[dish.id]?.assignedSides >= (selections[dish.id]?.count || 0)
                      ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                      : 'bg-white border-brand-border text-brand-dark active:scale-95'
                  ]"
                >
                  <Plus class="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Navegación Flotante Fija -->
    <div class="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-3.5 shadow-2xl">
      <div class="max-w-md mx-auto flex items-center gap-3">
        <BaseButton variant="outline" size="lg" @click="handleBack">
          <ArrowLeft class="w-5 h-5 mr-1 stroke-[2.5]" />
          Volver
        </BaseButton>

        <BaseButton 
          variant="primary" 
          size="lg" 
          fullWidth 
          :disabled="!isFormValid"
          @click="handleNext"
        >
          Tus Datos
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>
  </div>
</template>