<script setup lang="ts">
import HojaModal from '../../../components/ui/HojaModal.vue'
import { ref, computed, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { Minus, Plus, Check, AlertTriangle, CheckCircle2 } from 'lucide-vue-next'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import BarraAccionInferior from '../../../components/ui/BarraAccionInferior.vue'
import { useReservationStore } from '../../../stores/reservationStore'
import { useCatalogStore } from '../../../stores/catalogStore'
import { useSettingsStore } from '../../../stores/settingsStore'
import { aplicaLimiteVariedades, puedeAgregarVariedad, superaLimiteVariedades } from '../../../services/menus'
import { formatCLP } from '../../../lib/format'
import type { Dish } from '../../../types/catalog'
import type { MealType } from '../../../types/domain'

const router = useRouter()
const store = useReservationStore()
const catalogStore = useCatalogStore()
const settingsStore = useSettingsStore()

const activeMealIndex = ref(0)
const showIncompleteModal = ref(false)
// Se enciende un momento cuando el cliente intenta pasar el límite de platos distintos: resalta la franja fija.
const limiteRecienTocado = ref(false)
let temporizadorLimite: ReturnType<typeof setTimeout> | undefined
function resaltarLimite() {
  limiteRecienTocado.value = true
  clearTimeout(temporizadorLimite)
  temporizadorLimite = setTimeout(() => { limiteRecienTocado.value = false }, 2500)
}
onBeforeUnmount(() => clearTimeout(temporizadorLimite))

const mealLabels: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  once: 'Once'
}

// 1. ORDEN FIJO: Siempre Desayuno -> Almuerzo -> Once
const activeMealTypes = computed(() => {
  const order: MealType[] = ['desayuno', 'almuerzo', 'once']
  const selected: string[] = store.selectedMealTypes.length > 0 ? store.selectedMealTypes : ['almuerzo']
  return order.filter(m => selected.includes(m))
})

const currentMealType = computed(() => {
  return activeMealTypes.value[activeMealIndex.value] || 'almuerzo'
})

const totalGuests = computed(() => store.guestsCount)

const currentMealDishes = computed(() => {
  return catalogStore.dishes.filter(d => d.mealType === currentMealType.value)
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
  return dish.availableSides
}

// Platos distintos con al menos una unidad elegida
function countVarieties(dishes: Dish[]): number {
  return dishes.filter(d => (selections.value[d.id]?.count || 0) > 0).length
}

function updateDishCount(dishId: string, delta: number) {
  const sel = getDishSelection(dishId)
  const currentCount = sel.count
  const newCount = Math.max(0, currentCount + delta)

  if (newCount > currentCount && currentCount === 0 && !puedeAgregarVariedad(totalGuests.value, countVarieties(currentMealDishes.value), settingsStore.limiteVariedades, currentMealType.value)) {
    resaltarLimite()
    return
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
  if (val > 0 && sel.count === 0 && !puedeAgregarVariedad(totalGuests.value, countVarieties(currentMealDishes.value), settingsStore.limiteVariedades, currentMealType.value)) {
    resaltarLimite()
    target.value = String(sel.count)
    return
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
  const mealDishes = catalogStore.dishes.filter(d => d.mealType === mealType)
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
        mealType: dish.mealType,
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

// Comidas que quedaron con más variedades de las permitidas (por ejemplo, si el grupo creció en el paso 1)
const mealsOverVarietyLimit = computed(() =>
  activeMealTypes.value.filter(mId => {
    const dishes = catalogStore.dishes.filter(d => d.mealType === mId)
    return superaLimiteVariedades(totalGuests.value, countVarieties(dishes), settingsStore.limiteVariedades, mId)
  })
)

// Franja fija: el almuerzo es la única comida con tope de platos distintos (SCRUM-294).
const almuerzoConLimite = computed(() =>
  activeMealTypes.value.includes('almuerzo') && aplicaLimiteVariedades(totalGuests.value, settingsStore.limiteVariedades, 'almuerzo')
)
const variedadesAlmuerzo = computed(() => countVarieties(catalogStore.dishes.filter(d => d.mealType === 'almuerzo')))
const estadoLimite = computed<'libre' | 'alcanzado' | 'superado'>(() => {
  const max = settingsStore.limiteVariedades.maxVariedades
  if (variedadesAlmuerzo.value > max) return 'superado'
  return variedadesAlmuerzo.value === max ? 'alcanzado' : 'libre'
})

const isFormValid = computed(() => {
  if (mealsOverVarietyLimit.value.length > 0) return false
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
  <div class="space-y-4 max-w-md lg:max-w-none mx-auto w-full pb-contenido-nav">
    
    <!-- Menús incompletos: aviso antes de continuar -->
    <HojaModal :abierto="showIncompleteModal" titulo="Menús incompletos" ocultar-cierre @cerrar="showIncompleteModal = false">
    <p class="text-base text-gray-600 leading-relaxed">
      Tienes categorías con menos platos asignados que la cantidad de comensales ({{ totalGuests }} personas):
    </p>

    <div class="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-left space-y-1.5 text-sm font-bold text-amber-950">
      <div 
        v-for="mId in activeMealTypes" 
        :key="mId"
        class="flex justify-between items-center"
      >
        <span>{{ mealLabels[mId] }}:</span>
        <span 
          :class="[
            'font-bold px-2 py-0.5 rounded-md text-sm',
            getMealSelectedCount(mId) === totalGuests
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-200 text-amber-900'
          ]"
        >
          {{ getMealSelectedCount(mId) }} de {{ totalGuests }}
        </span>
      </div>
    </div>

    <p class="text-base text-gray-600">
      ¿Deseas continuar de todos modos o prefieres ajustar las cantidades antes de avanzar?
    </p>

      <template #pie>
        <div class="space-y-2">
          <BaseButton variant="primary" size="lg" fullWidth @click="proceedToStep3">
            Continuar de todos modos
          </BaseButton>
          <BaseButton variant="outline" size="lg" fullWidth @click="showIncompleteModal = false">
            Ajustar menús
          </BaseButton>
        </div>
      </template>
    </HojaModal>

    <!-- Indicador de Pasos -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="2" />
    </div>

    <!-- Franja fija bajo el encabezado: pestañas con el avance de cada comida y el límite de platos distintos.
         Se queda pegada al hacer scroll para ver siempre cuánto llevas (la altura del encabezado la fija ClientHeader). -->
    <div
      class="franja-paso sticky z-30 -mx-4 px-4 py-1.5 lg:mx-0 lg:px-0 bg-brand-light/95 backdrop-blur-md border-b border-brand-border space-y-1.5"
      data-testid="franja-paso"
    >
      <div v-if="activeMealTypes.length > 1" class="flex gap-2 p-1 bg-white rounded-2xl border-2 border-brand-border">
        <button
          type="button"
          v-for="(mId, idx) in activeMealTypes"
          :key="mId"
          @click="selectMealTab(idx)"
          :class="[
            'flex-1 py-2 px-1 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1 border touch-target',
            activeMealIndex === idx
              ? 'bg-brand-dark text-white border-brand-dark shadow-xs'
              : 'bg-white text-brand-dark border-brand-border hover:bg-gray-100'
          ]"
        >
          <span>{{ mealLabels[mId] }}</span>
          <span
            :class="[
              'text-sm px-1 py-0.5 rounded-full font-bold',
              isMealValid(mId) && getMealSelectedCount(mId) > 0
                ? 'bg-emerald-400 text-brand-dark'
                : 'bg-gray-200 text-gray-700'
            ]"
          >
            {{ getMealSelectedCount(mId) }}/{{ totalGuests }}
          </span>
        </button>
      </div>
      <div v-else class="flex items-center justify-between gap-2 bg-white rounded-2xl border-2 border-brand-border px-4 py-2.5 text-sm font-bold text-brand-dark">
        <span>{{ mealLabels[currentMealType] }}</span>
        <span
          :class="[
            'px-2 py-0.5 rounded-full',
            getMealSelectedCount(currentMealType) > 0 ? 'bg-emerald-400 text-brand-dark' : 'bg-gray-200 text-gray-700'
          ]"
        >
          {{ getMealSelectedCount(currentMealType) }}/{{ totalGuests }} personas
        </span>
      </div>

      <!-- Límite de platos distintos del almuerzo para grupos grandes: siempre a la vista -->
      <div
        v-if="almuerzoConLimite"
        role="status"
        data-testid="aviso-limite-platos"
        :class="[
          'rounded-2xl border-2 px-3 py-1.5 text-sm font-bold flex items-start gap-2 transition-colors',
          estadoLimite === 'superado'
            ? 'bg-rose-50 border-rose-400 text-rose-900'
            : estadoLimite === 'alcanzado'
              ? 'bg-amber-100 border-amber-500 text-amber-950'
              : 'bg-white border-brand-border text-brand-dark',
          limiteRecienTocado ? 'animate-pulse ring-2 ring-amber-500' : ''
        ]"
      >
        <AlertTriangle v-if="estadoLimite !== 'libre'" class="w-4 h-4 mt-0.5 shrink-0 stroke-[2.5]" aria-hidden="true" />
        <span>
          Almuerzo: {{ variedadesAlmuerzo }} de {{ settingsStore.limiteVariedades.maxVariedades }} platos distintos.
          <template v-if="estadoLimite === 'superado'">Quita platos: es el máximo para grupos de más de {{ settingsStore.limiteVariedades.umbralPersonas }} personas.</template>
          <template v-else-if="estadoLimite === 'alcanzado'">Llegaste al máximo.</template>
        </span>
      </div>
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
            :src="dish.image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'" 
            :alt="dish.name"
            class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            @error="(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80' }"
          />
          <div class="absolute top-2.5 right-2.5 bg-brand-dark/95 text-white font-bold text-sm px-3 py-1 rounded-full backdrop-blur-xs border border-white/20 shadow-xs">
            {{ formatCLP(dish.price) }}
          </div>
        </div>

        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <h3 class="text-lg font-bold text-brand-dark leading-tight">{{ dish.name }}</h3>
            <p class="text-base text-gray-600 leading-relaxed">{{ dish.description }}</p>
          </div>

          <!-- Contador de Platos -->
          <div class="flex items-center gap-1.5 bg-brand-light p-1.5 rounded-2xl border-2 border-brand-border shrink-0">
            <button aria-label="Disminuir cantidad"
              type="button"
              @click="updateDishCount(dish.id, -1)"
              class="w-8 h-8 rounded-xl bg-white border border-brand-border font-bold text-lg flex items-center justify-center active:scale-95 touch-target"
            >
              <Minus class="w-4 h-4 stroke-[2.5]" />
            </button>

            <input
              type="text"
              inputmode="numeric"
              pattern="*"
              :value="selections[dish.id]?.count || 0"
              @input="(e) => handleDishCountInput(dish.id, e)"
              class="w-12 text-center font-bold text-base text-brand-dark bg-transparent border-b-2 border-brand-accent focus:outline-none focus:border-brand-dark p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            <button aria-label="Aumentar cantidad"
              type="button"
              @click="updateDishCount(dish.id, 1)"
              class="w-8 h-8 rounded-xl bg-white border border-brand-border font-bold text-lg flex items-center justify-center active:scale-95 touch-target"
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
          <div class="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3 rounded-2xl text-sm font-bold flex items-center gap-2">
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
            <span class="text-sm text-gray-600">Acompañamientos:</span>

            <span 
              :class="[
                'text-sm font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1',
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
            class="bg-rose-50 border border-rose-300 text-rose-900 p-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <AlertTriangle class="w-4 h-4 text-rose-600 shrink-0 stroke-[2.5]" />
            <span>Falta asignar {{ dishStatusMap[dish.id]?.missing }} acompañamiento(s) para este plato.</span>
          </div>

          <div class="space-y-2 bg-brand-light p-3 rounded-2xl border border-brand-border">
            <div 
              v-for="side in getSideDishes(dish)" 
              :key="side"
              class="flex items-center justify-between text-sm text-gray-700"
            >
              <span>{{ side }}</span>
              <div class="flex items-center gap-2">
                <button aria-label="Disminuir cantidad"
                  type="button"
                  @click="updateSideCount(dish.id, side, -1)"
                  class="w-7 h-7 rounded-lg bg-white border border-brand-border font-bold flex items-center justify-center active:scale-95 touch-target"
                >
                  <Minus class="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                <input
                  type="text"
                  inputmode="numeric"
                  pattern="*"
                  :value="selections[dish.id]?.sides?.[side] || 0"
                  @input="(e) => handleSideCountInput(dish.id, side, e)"
                  class="w-10 text-center font-bold text-sm text-brand-dark bg-transparent border-b border-brand-accent focus:outline-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <button
                  type="button"
                  :disabled="dishStatusMap[dish.id]?.assignedSides >= (selections[dish.id]?.count || 0)"
                  @click="updateSideCount(dish.id, side, 1)"
                  :class="[
                    'w-7 h-7 rounded-lg font-bold flex items-center justify-center touch-target border',
                    dishStatusMap[dish.id]?.assignedSides >= (selections[dish.id]?.count || 0)
                      ? 'bg-gray-200 text-gray-600 border-gray-300 cursor-not-allowed'
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

    <BarraAccionInferior :disabled="!isFormValid" @click="handleNext">Tus Datos</BarraAccionInferior>
  </div>
</template>