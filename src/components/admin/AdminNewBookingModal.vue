<script setup lang="ts">
import { ref, computed } from 'vue'
import { X, Home, Tent, Utensils, Check } from 'lucide-vue-next'
import { useRequestsStore } from '../../stores/requestsStore'
import { useCatalogStore } from '../../stores/catalogStore'
import type { ServiceType } from '../../types/domain'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const requestsStore = useRequestsStore()
const catalogStore = useCatalogStore()

const serviceType = ref<ServiceType>('cabana')
const clientName = ref('')
const clientPhone = ref('+56 9 ')
const clientEmail = ref('')
const startDate = ref(new Date().toISOString().split('T')[0])
const endDate = ref('')
const guestsCount = ref(2)
const selectedResourceId = ref('')
const totalAmount = ref(0)
const depositPaid = ref(0)
const comments = ref('')
const isSubmitting = ref(false)

const resourceOptions = computed(() => {
  if (serviceType.value === 'cabana') {
    return catalogStore.cabins.map(c => ({ id: c.id, name: c.name, price: c.pricePerNight }))
  }
  if (serviceType.value === 'camping') {
    return catalogStore.campingSites.map(s => ({ id: s.id, name: s.name, price: s.pricePerPerson }))
  }
  return [{ id: 'restaurante', name: 'Mesa Restaurante', price: 0 }]
})

function onResourceChange() {
  const res = resourceOptions.value.find(r => r.id === selectedResourceId.value)
  if (res && res.price > 0) {
    totalAmount.value = res.price * guestsCount.value
    depositPaid.value = Math.round(totalAmount.value * 0.3)
  }
}

async function handleSubmit() {
  if (!clientName.value || !clientPhone.value || !startDate.value) return

  isSubmitting.value = true
  try {
    const code = `ADM-${Math.floor(1000 + Math.random() * 9000)}`
    const selectedResource = resourceOptions.value.find(r => r.id === selectedResourceId.value)

    await requestsStore.addRequest({
      requestCode: code,
      clientName: clientName.value,
      clientPhone: clientPhone.value,
      clientEmail: clientEmail.value || undefined,
      type: serviceType.value,
      resourceName: selectedResource ? selectedResource.name : 'Reserva Directa',
      date: startDate.value,
      timeOrDuration: endDate.value || '1 día',
      guestsCount: guestsCount.value,
      totalAmount: totalAmount.value,
      depositAmount: depositPaid.value,
      details: {
        comments: comments.value ? `[Reserva Admin] ${comments.value}` : '[Reserva Admin]',
        resourceId: selectedResourceId.value,
        startDate: startDate.value,
        endDate: endDate.value || startDate.value
      }
    })

    emit('created')
    emit('close')
  } catch (err) {
    console.error('Error al crear reserva directa:', err)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white w-full max-w-md rounded-3xl border-2 border-brand-border p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
      <div class="flex items-center justify-between border-b-2 border-brand-border/60 pb-3">
        <div>
          <span class="text-[10px] font-black text-brand-accent uppercase tracking-wider block">Panel de Control</span>
          <h3 class="text-base font-black text-brand-dark">Nueva Reserva Directa</h3>
        </div>
        <button 
          type="button" 
          @click="emit('close')"
          class="w-8 h-8 rounded-full bg-brand-light border border-brand-border text-brand-dark flex items-center justify-center"
        >
          <X class="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-3 text-xs font-bold">
        <div>
          <label class="block text-gray-600 mb-1">Tipo de Servicio:</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="serviceType = 'cabana'; selectedResourceId = ''"
              :class="['p-2 rounded-xl border flex items-center justify-center gap-1 font-black', serviceType === 'cabana' ? 'bg-brand-dark text-white border-brand-dark' : 'bg-gray-50 text-gray-700']"
            >
              <Home class="w-3.5 h-3.5" /> Cabaña
            </button>
            <button
              type="button"
              @click="serviceType = 'camping'; selectedResourceId = ''"
              :class="['p-2 rounded-xl border flex items-center justify-center gap-1 font-black', serviceType === 'camping' ? 'bg-brand-dark text-white border-brand-dark' : 'bg-gray-50 text-gray-700']"
            >
              <Tent class="w-3.5 h-3.5" /> Camping
            </button>
            <button
              type="button"
              @click="serviceType = 'restaurante'; selectedResourceId = ''"
              :class="['p-2 rounded-xl border flex items-center justify-center gap-1 font-black', serviceType === 'restaurante' ? 'bg-brand-dark text-white border-brand-dark' : 'bg-gray-50 text-gray-700']"
            >
              <Utensils class="w-3.5 h-3.5" /> Restorán
            </button>
          </div>
        </div>

        <div>
          <label class="block text-gray-600 mb-1">Recurso / Espacio:</label>
          <select 
            v-model="selectedResourceId" 
            @change="onResourceChange"
            class="w-full p-2.5 rounded-xl border border-brand-border bg-brand-light font-black"
          >
            <option value="">-- Seleccionar --</option>
            <option v-for="r in resourceOptions" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-gray-600 mb-1">Fecha Ingreso:</label>
            <input type="date" v-model="startDate" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" required />
          </div>
          <div>
            <label class="block text-gray-600 mb-1">Fecha Salida:</label>
            <input type="date" v-model="endDate" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-gray-600 mb-1">Comensales / Personas:</label>
            <input type="number" v-model.number="guestsCount" min="1" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" />
          </div>
          <div>
            <label class="block text-gray-600 mb-1">Monto Total (\$):</label>
            <input type="number" v-model.number="totalAmount" min="0" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" />
          </div>
        </div>

        <div>
          <label class="block text-gray-600 mb-1">Monto Abonado / Pagado (\$):</label>
          <input type="number" v-model.number="depositPaid" min="0" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" />
        </div>

        <div class="pt-2 border-t border-gray-100 space-y-2">
          <span class="text-[10px] font-black text-gray-400 uppercase block">Datos del Cliente</span>
          <div>
            <input type="text" v-model="clientName" placeholder="Nombre completo *" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" required />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" v-model="clientPhone" placeholder="Teléfono *" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" required />
            <input type="email" v-model="clientEmail" placeholder="Email (opcional)" class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-black" />
          </div>
        </div>

        <div>
          <textarea v-model="comments" placeholder="Notas adicionales..." class="w-full p-2 rounded-xl border border-brand-border bg-brand-light font-bold h-16"></textarea>
        </div>

        <div class="flex gap-2 pt-2">
          <button type="button" @click="emit('close')" class="flex-1 py-2.5 rounded-xl border border-brand-border font-black">Cancelar</button>
          <button type="submit" :disabled="isSubmitting" class="flex-1 py-2.5 rounded-xl bg-brand-dark text-white font-black flex items-center justify-center gap-1">
            <Check class="w-4 h-4" /> Guardar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>