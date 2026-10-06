<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, ArrowLeft, Check, Users, Tent, Sparkles, Sun, Moon } from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore'
import BaseButton from '../../../components/ui/BaseButton.vue'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'

const router = useRouter()
const store = useReservationStore()

const guests = computed(() => store.guestsCount || 1)
const isDiario = computed(() => store.campingType === 'diario')

interface CampingOption {
  id: string
  name: string
  description: string
  pricePerPerson: number
  features: string[]
}

const diarioOptions: CampingOption[] = [
  {
    id: 'camping-diario-estandar',
    name: 'Paseo por el Día - Entrada General',
    description: 'Acceso a áreas verdes, zonas de picnic, mesas, baños, duchas y áreas de piscina/río.',
    pricePerPerson: 5000,
    features: ['Acceso a piscina y río', 'Uso de mesas y bancas', 'Baños y duchas', 'Estacionamiento']
  },
  {
    id: 'camping-diario-quincho',
    name: 'Paseo por el Día + Quincho / Asador',
    description: 'Entrada general más espacio techado reservado con parrilla grande para el grupo.',
    pricePerPerson: 7000,
    features: ['Quincho reservado', 'Parrilla y mesa amplia', 'Acceso a piscina y río', 'Baños y duchas']
  }
]

const pernoctarOptions: CampingOption[] = [
  {
    id: 'camping-pernoctar-estandar',
    name: 'Camping Noche - Sitio Estándar',
    description: 'Espacio para armar carpa por noche con punto de luz cercano, agua potable y quincho común.',
    pricePerPerson: 8000,
    features: ['Punto de luz cercano', 'Agua potable', 'Baños con agua caliente', 'Acceso a piscina y río']
  },
  {
    id: 'camping-pernoctar-premium',
    name: 'Camping Noche - Sitio Privado con Quincho',
    description: 'Sitio delimitado con mesa de madera, quincho individual, enchufe y sombra natural.',
    pricePerPerson: 10000,
    features: ['Quincho privado', 'Enchufe exclusivo', 'Mesa de madera', 'Sombra de árboles nativos']
  }
]

const activeCatalog = computed(() => {
  return isDiario.value ? diarioOptions : pernoctarOptions
})

const selectedOptionId = ref<string>(
  store.selectedCabinId || activeCatalog.value[0]?.id || ''
)

function formatCLP(val: number): string {
  return '$' + val.toLocaleString('es-CL')
}

const nightsCount = computed(() => {
  if (isDiario.value) return 1
  if (!store.checkInDate || !store.checkOutDate) return 1
  const d1 = new Date(store.checkInDate + 'T00:00:00')
  const d2 = new Date(store.checkOutDate + 'T00:00:00')
  const diffTime = d2.getTime() - d1.getTime()
  return Math.max(1, Math.ceil(diffTime / (1000 * 3600 * 24)))
})

const selectedOption = computed(() => {
  return activeCatalog.value.find(o => o.id === selectedOptionId.value)
})

const totalPrice = computed(() => {
  if (!selectedOption.value) return 0
  if (isDiario.value) {
    return selectedOption.value.pricePerPerson * guests.value
  }
  return selectedOption.value.pricePerPerson * guests.value * nightsCount.value
})

function selectOption(id: string) {
  selectedOptionId.value = id
  store.selectedCabinId = id
}

function handleNext() {
  if (!selectedOptionId.value) return
  store.selectedCabinId = selectedOptionId.value
  store.nextStep()
  router.push({ name: 'camping-step3' })
}

function handleBack() {
  store.prevStep()
  router.push({ name: 'camping-step1' })
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto pb-28">
    
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="2" />
    </div>

    <BaseAlert variant="info" title="Selecciona la opción de Camping">
      Elige el tipo de sitio para tu grupo de {{ guests }} personas ({{ isDiario ? 'Paseo por el día' : nightsCount + ' noche/s' }}).
    </BaseAlert>

    <div class="space-y-3">
      <div 
        v-for="option in activeCatalog" 
        :key="option.id"
        @click="selectOption(option.id)"
        :class="[
          'bg-white rounded-3xl border-2 p-5 transition-all shadow-sm cursor-pointer space-y-3 relative active:scale-98 touch-target',
          selectedOptionId === option.id
            ? 'border-brand-dark bg-white ring-4 ring-brand-dark/10 shadow-md'
            : 'border-brand-border hover:border-gray-400'
        ]"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <span class="text-[10px] font-extrabold uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
              <Sun v-if="isDiario" class="w-3 h-3 text-amber-600 stroke-[2.5]" />
              <Moon v-else class="w-3 h-3 text-emerald-600 stroke-[2.5]" />
              {{ isDiario ? 'Paseo por el Día' : 'Pernoctar' }}
            </span>
            
            <h3 class="text-lg font-black text-brand-dark leading-tight pt-1">
              {{ option.name }}
            </h3>
            
            <p class="text-xs font-bold text-gray-500 leading-relaxed">
              {{ option.description }}
            </p>
          </div>

          <div 
            :class="[
              'w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors',
              selectedOptionId === option.id
                ? 'bg-brand-dark border-brand-dark text-white'
                : 'border-brand-border bg-brand-light'
            ]"
          >
            <Check v-if="selectedOptionId === option.id" class="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-1.5 pt-1">
          <div 
            v-for="feat in option.features" 
            :key="feat"
            class="text-[11px] font-bold text-gray-700 flex items-center gap-1 bg-brand-light px-2 py-1 rounded-lg border border-brand-border/60"
          >
            <Sparkles class="w-3 h-3 text-brand-accent shrink-0 stroke-[2.5]" />
            <span>{{ feat }}</span>
          </div>
        </div>

        <div class="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span class="text-xs font-extrabold text-gray-500 uppercase tracking-wider">
            Valor por Persona
          </span>
          <div class="text-right">
            <span class="text-lg font-black text-brand-dark">
              {{ formatCLP(option.pricePerPerson) }}
            </span>
            <span class="text-xs font-bold text-gray-400"> / persona</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="selectedOption" class="bg-brand-dark text-white p-4 rounded-2xl border-2 border-brand-border shadow-xs flex items-center justify-between">
      <div>
        <span class="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">
          Total Estimado ({{ guests }} pers. {{ !isDiario ? 'x ' + nightsCount + ' noc.' : '' }})
        </span>
        <span class="text-xs font-bold text-gray-300">{{ selectedOption.name }}</span>
      </div>
      <span class="text-xl font-black text-white">
        {{ formatCLP(totalPrice) }}
      </span>
    </div>

    <!-- BOTONES FIJOS EN LA PARTE INFERIOR -->
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
          :disabled="!selectedOptionId"
          @click="handleNext"
        >
          Tus Datos
          <ArrowRight class="w-5 h-5 ml-1.5 stroke-[2.5]" />
        </BaseButton>
      </div>
    </div>

  </div>
</template>