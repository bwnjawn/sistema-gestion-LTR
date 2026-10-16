<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Minus, Plus, Sparkles, Check, AlertTriangle, AlertCircle, CheckCircle2, X } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useCatalogStore } from '../../../stores/catalogStore'
import { formatCLP } from '../../../lib/format'
import type { Dish } from '../../../types/catalog'

const router = useRouter()
const store = useReservationStore()
const catalogStore = useCatalogStore()

const activeMealIndex = ref(0)
const showIncompleteModal = ref(false)
const showVarietyLimitWarning = ref(false)

const mealLabels: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  once: 'Once'
}

// 1. ORDEN FIJO: Siempre Desayuno -> Almuerzo -> Once
const activeMealTypes = computed(() => {
  const order = ['desayuno', 'almuerzo', 'once']
  const selected = store.selectedMealTypes.length > 0 ? store.selectedMealTypes : ['almuerzo']
  return order.filter(m => selected.includes(m))
})

const currentMealType = computed(() => {
  return activeMealTypes.value[activeMealIndex.value] || 'almuerzo'
})

const totalGuests = computed(() => store.guestsCount)

const currentMealDishes = computed(() => {
  const catLabel = mealLabels[currentMealType.value] || 'Almuerzo'
  return catalogStore.dishes.filter(d => {
    const dishCat = (d.mealCategory || '').toLowerCase()
    return dishCat === currentMealType.value.toLowerCase() || (d.mealCategory || '') === catLabel
  })
})

const selections = ref<Record<string, { count: number; sides: Record<string, number> }>>({})

if (store.selectedMeals && store.selectedMeals.length > 0) {
  for (const item of (store.selectedMeals as any[])) {
    if (item.id) {
      selections.value[item.id] = {
        count: item.quantity || item.count || 0,
        sides: item.sides || item.sideSelections || {}
      }
    }
  }
}

function getDishSelection(dishId: string) {
  if (!selections.value[dishId]) {
    selections.value[dishId] = { count: 0, sides: {} }
  }
  return selections.value[dishId]
}

function getSideDishes(dish: Dish): string[] {
  if (dish.availableSides && dish.availableSides.length > 0) return dish.availableSides
  if (dish.availableSideDishes && dish.availableSideDishes.length > 0) return dish.availableSideDishes
  return []
}

function updateDishCount(dishId: string, delta: number) {
  const sel = getDishSelection(dishId)
  const currentCount = sel.count
  const newCount = Math.max(0, currentCount + delta)

  if (newCount > currentCount && totalGuests.value > 30) {
    const chosenVarieties = currentMealDishes.value.filter(d => (selections.value[d.id]?.count || 0) > 0)
    if (currentCount === 0 && chosenVarieties.length >= 3) {
      showVarietyLimitWarning.value = true
      return
    }
  }

  sel.count = newCount
  if (newCount === 0) {
    sel.sides = {}
  }
  syncToStore()
}

function handleDishCountInput(dishId: string, event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value.replace(/[^0-9]/g, '')
  let val = parseInt(raw, 10)
  if (isNaN(val) || val < 0) val = 0

  const sel = getDishSelection(dishId)
  if (val > 0 && sel.count === 0 && totalGuests.value > 30) {
    const chosenVarieties = currentMealDishes.value.filter(d => (selections.value[d.id]?.count || 0) > 0)
    if (chosenVarieties.length >= 3) {
      showVarietyLimitWarning.value = true
      target.value = String(sel.count)
      return
    }
  }

  sel.count = Math.min(totalGuests.value, val)
  target.value = String(sel.count)
  syncToStore()
}

function updateSideCount(dishId: string, sideName: string, delta: number) {
  const sel = getDishSelection(dishId)
  if (!sel.sides) sel.sides = {}
  const currentSideCount = sel.sides[sideName] || 0
  const totalAssignedSides = Object.values(sel.sides).reduce((sum, c) => sum + c, 0)

  if (delta > 0 && totalAssignedSides >= sel.count) {
    return
  }

  const newSideCount = Math.max(0, currentSideCount + delta)
  sel.sides[sideName] = newSideCount
  syncToStore()
}

function handleSideCountInput(dishId: string, sideName: string, event: Event) {
  const target = event.target as HTMLInputElement
  const raw = target.value.replace(/[^0-9]/g, '')
  let val = parseInt(raw, 10)
  if (isNaN(val) || val < 0) val = 0

  const sel = getDishSelection(dishId)
  if (!sel.sides) sel.sides = {}
  const otherSidesCount = Object.entries(sel.sides)
    .filter(([s]) => s !== sideName)
    .reduce((sum, [, c]) => sum + c, 0)

  const maxAllowed = sel.count - otherSidesCount
  const finalVal = Math.min(maxAllowed, val)
  sel.sides[sideName] = finalVal
  target.value = String(finalVal)
  syncToStore()
}

const dishStatusMap = computed(() => {
  const map: Record<string, { assignedSides: number; requiredSides: number; missing: number; isComplete: boolean }> = {}
  for (const dish of catalogStore.dishes) {
    const sel = selections.value[dish.id] || { count: 0, sides: {} }
    const requiredSides = sel.count
    const assignedSides = Object.values(sel.sides || {}).reduce((sum, c) => sum + c, 0)
    const hasSidesOptions = !dish.fixedSide && getSideDishes(dish).length > 0
    const isComplete = !hasSidesOptions || requiredSides === 0 || assignedSides === requiredSides

    map[dish.id] = {
      assignedSides,
      requiredSides,
      missing: Math.max(0, requiredSides - assignedSides),
      isComplete
    }
  }
  return map
})

function getMealSelectedCount(mealType: string): number {
  const catLabel = mealLabels[mealType] || 'Almuerzo'
  const mealDishes = catalogStore.dishes.filter(d => {
    const dishCat = (d.mealCategory || '').toLowerCase()
    return dishCat === mealType.toLowerCase() || (d.mealCategory || '') === catLabel
  })
  return mealDishes.reduce((sum, d) => sum + (selections.value[d.id]?.count || 0), 0)
}

function isMealValid(mealType: string): boolean {
  const count = getMealSelectedCount(mealType)
  return count > 0
}

// 2. DETECCIÓN DE CATEGORÍAS INCOMPLETAS POR SEPARADO
const incompleteCategories = computed(() => {
  return activeMealTypes.value.filter(mId => getMealSelectedCount(mId) < totalGuests.value)
})

function syncToStore() {
  const result: any[] = []
  for (const dish of catalogStore.dishes) {
    const sel = selections.value[dish.id]
    if (sel && sel.count > 0) {
      result.push({
        id: dish.id,
        name: dish.name,
        price: dish.price,
        quantity: sel.count,
        count: sel.count,
        fixedSide: dish.fixedSide,
        sides: sel.sides,
        sideSelections: sel.sides
      })
    }
  }
  store.selectedMeals = result
}

function selectMealTab(idx: number) {
  activeMealIndex.value = idx
}

const isFormValid = computed(() => {
  const hasAnyDish = activeMealTypes.value.some(mId => getMealSelectedCount(mId) > 0)
  if (!hasAnyDish) return false

  for (const dish of catalogStore.dishes) {
    const sel = selections.value[dish.id]
    if (sel && sel.count > 0 && !dish.fixedSide && getSideDishes(dish).length > 0) {
      if (!dishStatusMap.value[dish.id]?.isComplete) {
        return false
      }
    }
  }
  return true
})

function handleBack() {
  store.prevStep()
  router.push('/restaurante/paso1')
}

function handleNext() {
  if (!isFormValid.value) return

  // Si hay alguna categoría activa con menos platos que los comensales
  if (incompleteCategories.value.length > 0) {
    showIncompleteModal.value = true
  } else {
    proceedToStep3()
  }
}

function proceedToStep3() {
  showIncompleteModal.value = false
  store.nextStep()
  router.push('/restaurante/paso3')
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-28">
    
    <!-- Modal Incompleto Específico por Categoría -->
    <div 
      v-if="showIncompleteModal" 
      class="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-3xl p-6 max-w-sm w-full border-2 border-brand-border shadow-2xl space-y-5">
        <div class="w-12 h-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle class="w-7 h-7 stroke-[2.5]" />
        </div>

        <div class="text-center space-y-3">
          <h3 class="text-lg font-black text-brand-dark">Menús Incompletos</h3>
          <p class="text-xs font-semibold text-gray-600 leading-relaxed">
            Tienes categorías con menos platos asignados que la cantidad de comensales ({{ totalGuests }} personas):
          </p>

          <div class="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-left space-y-1.5 text-xs font-bold text-amber-950">
            <div 
              v-for="mId in activeMealTypes" 
              :key="mId"
              class="flex justify-between items-center"
            >
              <span>{{ mealLabels[mId] }}:</span>
              <span 
                :class="[
                  'font-black px-2 py-0.5 rounded-md text-[11px]',
                  getMealSelectedCount(mId) === totalGuests
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-200 text-amber-900'
                ]"
              >
                {{ getMealSelectedCount(mId) }} de {{ totalGuests }}
              </span>
            </div>
          </div>

          <p class="text-[11px] font-semibold text-gray-500">
            ¿Deseas continuar de todos modos o prefieres ajustar las cantidades antes de avanzar?
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

    <!-- Aviso Flotante para Límite de 3 Variedades -->
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

    <!-- Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="2" />
    </div>

    <!-- Alerta Guiada (Sin contador acumulado global) -->
    <BaseAlert variant="info" title="Selección de Menú por Servicio">
      Asigna las cantidades de platos para tu grupo de {{ totalGuests }} comensales en cada servicio seleccionado.
    </BaseAlert>

    <!-- Pestañas por Servicio Activo (En orden Fijo) -->
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
        <!-- Foto -->
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

          <!-- Contador de Platos -->
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
              pattern="*"
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

                <input
                  type="text"
                  inputmode="numeric"
                  pattern="*"
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