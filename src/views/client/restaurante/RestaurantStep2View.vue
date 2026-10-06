<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  ArrowRight, 
  ArrowLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  Check, 
  AlertTriangle, 
  Info, 
  Utensils, 
  Sparkles 
} from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'

const router = useRouter()
const store = useReservationStore()

const totalGuests = computed(() => store.guestsCount || 1)

// Tipos de servicio activos según lo seleccionado en el Paso 1
const activeMealTypes = computed(() => {
  return store.selectedMealTypes && store.selectedMealTypes.length > 0
    ? store.selectedMealTypes
    : ['desayuno', 'almuerzo', 'once']
})

const activeMealIndex = ref(0)
const currentMealType = computed(() => activeMealTypes.value[activeMealIndex.value] || 'desayuno')

const mealLabels: Record<string, string> = {
  desayuno: 'Desayuno',
  almuerzo: 'Almuerzo',
  once: 'Once'
}

const currentMealLabel = computed(() => mealLabels[currentMealType.value])

interface Dish {
  id: string
  name: string
  mealType: 'desayuno' | 'almuerzo' | 'once'
  price: number
  description: string
  image: string
  availableSideDishes: string[]
}

// Catálogo de platos de r2.txt con imagen agregada
const allDishes: Dish[] = [
  // Desayunos
  {
    id: 'desayuno-campesino',
    name: 'Desayuno Campestre',
    mealType: 'desayuno',
    price: 10800,
    description: 'Frutas, yogurt, cereales, pan amasado, huevos de campo, mermelada casera, café, té o mate.',
    image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
    availableSideDishes: []
  },
  {
    id: 'desayuno-tradicional',
    name: 'Desayuno Tradicional',
    mealType: 'desayuno',
    price: 6000,
    description: 'Un sándwich jamón queso en pan casero, té, café o leche y un bocado dulce.',
    image: 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?auto=format&fit=crop&w=800&q=80',
    availableSideDishes: []
  },

  // Almuerzos
  {
    id: 'almuerzo-cordero-cerdo',
    name: 'Asado de Cordero y Cerdo al Palo',
    mealType: 'almuerzo',
    price: 20000,
    description: 'Asado tradicional cocinado a fuego lento con leña nativa. Incluye buffet de ensaladas, pan amasado y postre.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    availableSideDishes: ['Papas al vapor', 'Puré casero', 'Papas rústicas']
  },
  {
    id: 'almuerzo-vacuno-bechamel',
    name: 'Vacuno con Salsa Bechamel',
    mealType: 'almuerzo',
    price: 21000,
    description: 'Tierno corte de vacuno con suave salsa cremosa. Incluye buffet de ensaladas, pan amasado y postre.',
    image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=80',
    availableSideDishes: ['Papas rústicas', 'Puré casero', 'Arroz primavera']
  },
  {
    id: 'almuerzo-salmon-camarones',
    name: 'Salmón con Salsa de Camarones',
    mealType: 'almuerzo',
    price: 21000,
    description: 'Salmón fresco bañado en salsa de camarones. Incluye buffet de ensaladas, pan amasado y postre.',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    availableSideDishes: ['Puré casero', 'Papas rústicas', 'Arroz primavera']
  },
  {
    id: 'almuerzo-chuletas-cerdo',
    name: 'Chuletas de Cerdo Criollas',
    mealType: 'almuerzo',
    price: 13000,
    description: 'Jugosas chuletas de cerdo doradas. Incluye buffet de ensaladas, pan amasado y postre.',
    image: 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80',
    availableSideDishes: ['Puré casero', 'Papas al vapor', 'Papas rústicas']
  },
  {
    id: 'almuerzo-vegetariano',
    name: 'Almuerzo Vegetariano / Vegano',
    mealType: 'almuerzo',
    price: 12000,
    description: 'Pastel, chupe o budín de verduras a acordar. Incluye buffet de ensalada, postre y té de hierba.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
    availableSideDishes: []
  },

  // Onces
  {
    id: 'once-campesina',
    name: 'Once Campesina',
    mealType: 'once',
    price: 12000,
    description: 'Jugo natural, té, café o mate. Sopaipillas, pan casero, pastas para acompañar, queso, mermeladas y kuchen.',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
    availableSideDishes: []
  },
  {
    id: 'once-tradicional',
    name: 'Once Tradicional / Infantil',
    mealType: 'once',
    price: 7500,
    description: 'Un hot dog o completo, un vaso de bebida y una paleta de helado.',
    image: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?auto=format&fit=crop&w=800&q=80',
    availableSideDishes: []
  }
]

interface DishSelection {
  count: number
  sides: Record<string, number>
}

// Carga de selecciones
const selections = ref<Record<string, DishSelection>>(
  store.selectedMenus && Object.keys(store.selectedMenus).length > 0
    ? JSON.parse(JSON.stringify(store.selectedMenus))
    : {}
)

const currentMealDishes = computed(() => {
  return allDishes.filter(d => d.mealType === currentMealType.value)
})

function updateDishCount(dishId: string, delta: number) {
  if (!selections.value[dishId]) {
    selections.value[dishId] = { count: 0, sides: {} }
  }
  const current = selections.value[dishId].count
  const next = Math.max(0, current + delta)
  selections.value[dishId].count = next

  if (next === 0) {
    selections.value[dishId].sides = {}
  }
}

function updateSideCount(dishId: string, side: string, delta: number) {
  if (!selections.value[dishId] || selections.value[dishId].count <= 0) return
  if (!selections.value[dishId].sides) {
    selections.value[dishId].sides = {}
  }
  const current = selections.value[dishId].sides[side] || 0
  
  // Calcular total de acompañamientos ya asignados
  const totalAssigned = Object.values(selections.value[dishId].sides).reduce((a, b) => a + b, 0)
  const maxAllowed = selections.value[dishId].count

  if (delta > 0 && totalAssigned >= maxAllowed) {
    return // No permite asignar más acompañamientos que platos
  }

  const next = Math.max(0, current + delta)
  selections.value[dishId].sides[side] = next
  
  if (next === 0) {
    delete selections.value[dishId].sides[side]
  }
}

// Mapa de validación de acompañamientos por plato (original r2.txt)
const dishStatusMap = computed(() => {
  const map: Record<string, { assignedSides: number; requiredSides: number; missing: number; isComplete: boolean }> = {}
  allDishes.forEach(dish => {
    const sel = selections.value[dish.id] || { count: 0, sides: {} }
    const count = sel.count || 0
    if (count === 0 || dish.availableSideDishes.length === 0) {
      map[dish.id] = { assignedSides: 0, requiredSides: 0, missing: 0, isComplete: true }
    } else {
      const assigned = Object.values(sel.sides || {}).reduce((a, b) => a + b, 0)
      const required = count
      const missing = Math.max(0, required - assigned)
      map[dish.id] = {
        assignedSides: assigned,
        requiredSides: required,
        missing,
        isComplete: missing === 0
      }
    }
  })
  return map
})

function getMealSelectedCount(mId: string): number {
  return allDishes
    .filter(d => d.mealType === mId)
    .reduce((sum, d) => sum + (selections.value[d.id]?.count || 0), 0)
}

function isMealValid(mId: string): boolean {
  const mealDishes = allDishes.filter(d => d.mealType === mId)
  const count = getMealSelectedCount(mId)
  if (count > totalGuests.value) return false
  return mealDishes.every(d => dishStatusMap.value[d.id].isComplete)
}

const mealSelectedCount = computed(() => getMealSelectedCount(currentMealType.value))
const isCurrentMealValid = computed(() => isMealValid(currentMealType.value))
const areAllMealsValid = computed(() => activeMealTypes.value.every(mId => isMealValid(mId)))

function selectMealTab(idx: number) {
  activeMealIndex.value = idx
}

function handleNextMeal() {
  if (activeMealIndex.value < activeMealTypes.value.length - 1) {
    activeMealIndex.value++
  }
}

const showPartialModal = ref(false)

const partialSummary = computed(() => {
  return activeMealTypes.value
    .map(mId => `${mealLabels[mId]}: ${getMealSelectedCount(mId)} de ${totalGuests.value}`)
    .join(' · ')
})

function handleGoToStep3() {
  const hasPartial = activeMealTypes.value.some(mId => {
    const cnt = getMealSelectedCount(mId)
    return cnt > 0 && cnt < totalGuests.value
  })

  if (hasPartial) {
    showPartialModal.value = true
  } else {
    confirmAndProceed()
  }
}

function confirmAndProceed() {
  store.selectedMenus = JSON.parse(JSON.stringify(selections.value))
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

function formatCLP(val: number): string {
  return '\$' + val.toLocaleString('es-CL')
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto pb-28">
    
    <!-- Indicador de Pasos Estándar -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="2" />
    </div>

    <!-- Alerta de Guía r2.txt -->
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

    <!-- Lista de Platos por Servicio con Foto -->
    <div class="space-y-4">
      <div 
        v-for="dish in currentMealDishes" 
        :key="dish.id"
        :class="[
          'bg-white rounded-3xl border-2 p-4 transition-all shadow-sm space-y-3 relative',
          dish.availableSideDishes.length > 0 && selections[dish.id]?.count > 0 && !dishStatusMap[dish.id].isComplete
            ? 'border-rose-500 bg-rose-50/20 ring-4 ring-rose-500/10'
            : selections[dish.id]?.count > 0
              ? 'border-brand-dark bg-white'
              : 'border-brand-border hover:border-gray-400'
        ]"
      >
        <!-- Imagen del Plato -->
        <div class="relative h-40 w-full bg-gray-100 rounded-2xl overflow-hidden mb-1">
          <img 
            :src="dish.image" 
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

          <!-- Contadores de Plato -->
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

        <!-- Acompañamientos según r2.txt -->
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
    <div class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white/95 backdrop-blur-md border-t-2 border-brand-border p-3.5 shadow-2xl">
      <div class="space-y-2.5">
        
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
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
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