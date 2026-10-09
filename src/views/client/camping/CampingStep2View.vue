<template>
  <div class="space-y-4 pb-24">
    <!-- Indicador de Paso 2 -->
    <div class="bg-white p-3.5 rounded-2xl border-2 border-brand-border shadow-xs">
      <StepIndicator :current-step="2" />
    </div>

    <!-- Alerta Informativa -->
    <BaseAlert variant="info" title="Selecciona la opción de Camping">
      Elige el tipo de sitio para tu grupo de {{ guests }} personas ({{ isDiario ? 'Paseo por el día' : nightsCount + ' noche/s' }}).
    </BaseAlert>

    <!-- Lista de Opciones de Camping con Fotos Visibles -->
    <div class="space-y-3">
      <CampingCard
        v-for="option in activeCatalog"
        :key="option.id"
        :site="option"
        :selected-option-id="selectedOptionId"
        :is-diario="isDiario"
        @select="selectOption"
      />
    </div>

    <!-- Resumen del Total -->
    <div v-if="selectedOption" class="bg-brand-dark text-white p-4 rounded-2xl border-2 border-brand-border shadow-xs flex items-center justify-between">
      <div>
        <span class="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block">
          Total Estimado ({{ guests }} pers. {{ !isDiario ? 'x ' + nightsCount + ' noc.' : '' }})
        </span>
        <span class="text-xs font-bold text-gray-300">{{ selectedOption.name }}</span>
      </div>
      <span class="text-xl font-black text-white">
        ${{ totalPrice.toLocaleString('es-CL') }}
      </span>
    </div>

    <!-- Botones Fijos de Navegación Inferior -->
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

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight } from 'lucide-vue-next'
import { useReservationStore } from '../../../stores/reservationStore'
import StepIndicator from '../../../components/ui/StepIndicator.vue'
import BaseAlert from '../../../components/ui/BaseAlert.vue'
import BaseButton from '../../../components/ui/BaseButton.vue'
import CampingCard, { type CampingItem } from '../../../components/catalog/CampingCard.vue'

const router = useRouter()
const store = useReservationStore()

const selectedOptionId = ref('cmp-1')

const activeCatalog = ref<CampingItem[]>([
  {
    id: 'cmp-1',
    name: 'Camping Zona General (Pernoctar)',
    modality: 'pernoctar',
    pricePerPerson: 10000,
    maxCapacity: 150,
    description: 'Acceso a sitios con sombra natural, agua potable, baños con ducha de agua caliente y piscina al aire libre.',
    image: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
    features: [
      { icon: 'Bath', text: 'Baños con ducha' },
      { icon: 'Sun', text: 'Acceso a piscina' },
      { icon: 'Flame', text: 'Quinchos y parrillas' },
      { icon: 'Trees', text: 'Parque de árboles nativos' }
    ]
  },
  {
    id: 'cmp-2',
    name: 'Paseo de Campo por el Día',
    modality: 'diario',
    pricePerPerson: 10000,
    maxCapacity: 40,
    description: 'Uso de pérgolas, zonas de picnic, quinchos y áreas recreativas sin pernoctar.',
    image: 'https://images.unsplash.com/photo-1537225228614-56cc3556d7ed?auto=format&fit=crop&w=800&q=80',
    features: [
      { icon: 'Utensils', text: 'Áreas de picnic' },
      { icon: 'Sun', text: 'Piscina exterior' },
      { icon: 'Trees', text: 'Acceso a senderos y río' }
    ]
  }
])

const guests = computed(() => store.guestsCount || 1)
const isDiario = computed(() => store.campingType === 'diario')

const nightsCount = computed(() => {
  if (!store.checkInDate || !store.checkOutDate) return 1
  const start = new Date(store.checkInDate).getTime()
  const end = new Date(store.checkOutDate).getTime()
  const diffDays = Math.ceil((end - start) / (1000 * 3600 * 24))
  return diffDays > 0 ? diffDays : 1
})

const selectedOption = computed(() => activeCatalog.value.find(o => o.id === selectedOptionId.value))

const totalPrice = computed(() => {
  if (!selectedOption.value) return 0
  const perPerson = selectedOption.value.pricePerPerson * guests.value
  return isDiario.value ? perPerson : perPerson * nightsCount.value
})

const selectOption = (id: string) => {
  selectedOptionId.value = id
}

const handleBack = () => {
  store.prevStep()
  router.push({ name: 'camping-step1' })
}

const handleNext = () => {
  if (!selectedOptionId.value) return
  store.nextStep()
  router.push({ name: 'camping-step3' })
}
</script>