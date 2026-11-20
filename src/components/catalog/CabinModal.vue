<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, ChevronLeft, ChevronRight, Users, BedDouble, Check } from 'lucide-vue-next'
import type { Cabin } from '../../types/catalog'
import ImageGalleryEditor from '../ui/ImageGalleryEditor.vue'
import ListaEtiquetas from '../ui/ListaEtiquetas.vue'
import HojaModal from '../ui/HojaModal.vue'
import BaseButton from '../ui/BaseButton.vue'
import { formatCLP } from '../../lib/format'

const props = withDefaults(defineProps<{
  isOpen: boolean
  cabin?: Cabin | null
  isEditable?: boolean
  nightsCount?: number
}>(), {
  isEditable: false,
  nightsCount: 1
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', cabinData: Partial<Cabin>): void
  (e: 'select', cabin: Cabin): void
}>()

// ===================================================
// ESTADO Y LÓGICA MODO CLIENTE (VISUALIZACIÓN / CARRUSEL)
// ===================================================
const currentImageIndex = ref(0)

const cabinImages = computed<string[]>(() => {
  if (!props.cabin) return []
  if (props.cabin.images && props.cabin.images.length > 0) return props.cabin.images
  if (props.cabin.mainImage) return [props.cabin.mainImage]
  return ['https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80']
})

const activeImage = computed<string>(() => {
  return cabinImages.value[currentImageIndex.value] || ''
})

function prevImage() {
  if (cabinImages.value.length === 0) return
  currentImageIndex.value = (currentImageIndex.value - 1 + cabinImages.value.length) % cabinImages.value.length
}

function nextImage() {
  if (cabinImages.value.length === 0) return
  currentImageIndex.value = (currentImageIndex.value + 1) % cabinImages.value.length
}

function handleSelectFromModal() {
  if (props.cabin) {
    emit('select', props.cabin)
  }
  emit('close')
}

// ===================================================
// ESTADO Y LÓGICA MODO ADMINISTRADOR (EDICIÓN)
// ===================================================
const isEditing = ref(false)
const form = ref<Partial<Cabin>>({
  name: '',
  capacity: 2,
  pricePerNight: 50000,
  bedsDescription: '',
  description: '',
  mainImage: '',
  images: [],
  features: [],
  enMantencion: false
})

watch(() => props.cabin, (newCabin) => {
  currentImageIndex.value = 0
  if (newCabin) {
    isEditing.value = true
    const featStrings = [...(newCabin.features || [])]
    form.value = {
      name: newCabin.name || '',
      capacity: newCabin.capacity || 2,
      pricePerNight: newCabin.pricePerNight || 50000,
      bedsDescription: newCabin.bedsDescription || '',
      description: newCabin.description || '',
      mainImage: newCabin.mainImage || '',
      images: newCabin.images ? [...newCabin.images] : (newCabin.mainImage ? [newCabin.mainImage] : []),
      features: featStrings,
      enMantencion: newCabin.enMantencion === true
    }
  } else {
    isEditing.value = false
    form.value = {
      name: '',
      capacity: 2,
      pricePerNight: 50000,
      bedsDescription: '',
      description: '',
      mainImage: '',
      images: [],
      features: [],
      enMantencion: false
    }
  }
}, { immediate: true })

function handleSave() {
  const images = form.value.images || []
  const main = form.value.mainImage || (images.length > 0 ? images[0] : '')
  emit('save', {
    ...form.value,
    mainImage: main
  })
  emit('close')
}

function close() {
  emit('close')
}
</script>

<template>
  <!-- Detalle para el cliente: foto arriba, ficha con scroll y botones fijos -->
  <HojaModal v-if="cabin" :abierto="isOpen && !isEditable" :titulo="cabin.name" sin-manija sin-relleno @cerrar="close">
    <template #cabecera>
        <!-- Carrusel de Fotografías -->
        <div class="relative h-60 sm:h-64 w-full bg-black shrink-0 overflow-hidden">
          <img 
            :src="activeImage" 
            :alt="cabin.name"
            class="w-full h-full object-cover transition-all duration-300"
          />

          <!-- Manija de la hoja, sobre la foto (la hoja no la dibuja porque la foto llega hasta arriba) -->
          <div class="sm:hidden absolute top-2 inset-x-0 z-10 pointer-events-none" aria-hidden="true">
            <div class="w-10 h-1.5 rounded-full bg-white/90 shadow-sm mx-auto"></div>
          </div>
          
          <!-- Botón Cerrar -->
          <button aria-label="Cerrar" 
            type="button"
            @click="close"
            class="absolute top-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full backdrop-blur-xs touch-target flex items-center justify-center z-10 active:scale-95"
          >
            <X class="w-5 h-5 stroke-[2.5]" />
          </button>

          <!-- Flechas de Navegación -->
          <button 
            v-if="cabinImages.length > 1"
            type="button"
            @click="prevImage"
            class="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full touch-target flex items-center justify-center active:scale-95"
          >
            <ChevronLeft class="w-5 h-5 stroke-[2.5]" />
          </button>

          <button 
            v-if="cabinImages.length > 1"
            type="button"
            @click="nextImage"
            class="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full touch-target flex items-center justify-center active:scale-95"
          >
            <ChevronRight class="w-5 h-5 stroke-[2.5]" />
          </button>

          <!-- Contador N/M -->
          <div v-if="cabinImages.length > 0" class="absolute bottom-3 right-3 bg-black/70 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-xs">
            {{ currentImageIndex + 1 }} / {{ cabinImages.length }}
          </div>
        </div>

    </template>

        <!-- Ficha de Información de Cabaña -->
        <div class="p-5 space-y-4">
          <div>
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-brand-dark leading-tight">{{ cabin.name }}</h3>
              <span class="bg-brand-light text-brand-dark border border-brand-border px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1.5">
                <Users class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
                Hasta {{ cabin.capacity }} Personas
              </span>
            </div>
            <p v-if="cabin.bedsDescription" class="text-sm font-bold text-brand-accent mt-1 flex items-center gap-1.5">
              <BedDouble class="w-4 h-4 stroke-[2.5]" />
              {{ cabin.bedsDescription }}
            </p>
          </div>

          <div v-if="cabin.description" class="space-y-1">
            <h4 class="text-sm text-gray-700">Descripción</h4>
            <p class="text-base text-gray-700 leading-relaxed bg-brand-light p-3 rounded-2xl border border-brand-border">
              {{ cabin.description }}
            </p>
          </div>

          <!-- Equipamientos -->
          <div v-if="cabin.features && cabin.features.length > 0" class="space-y-2">
            <h4 class="text-sm text-gray-700">Servicios y Equipamiento</h4>
            <div class="flex flex-wrap gap-1.5">
              <span 
                v-for="(feature, fIdx) in cabin.features" 
                :key="fIdx"
                class="bg-brand-light text-brand-dark border border-brand-border px-3 py-1 rounded-xl text-sm font-bold flex items-center gap-1.5"
              >
                <Check class="w-3.5 h-3.5 text-brand-accent stroke-[2.5]" />
                {{ feature }}
              </span>
            </div>
          </div>

          <!-- Presupuesto Estimado -->
          <div class="bg-brand-light p-4 rounded-2xl border-2 border-brand-border flex items-center justify-between">
            <div>
              <span class="text-sm text-gray-700 block">Tarifa por noche</span>
              <span class="text-sm font-bold text-gray-800">{{ formatCLP(cabin.pricePerNight) }}</span>
            </div>
            <div class="text-right">
              <span class="text-sm font-bold text-brand-accent block">Total por {{ nightsCount }} Noches</span>
              <span class="text-lg font-bold text-brand-dark">
                {{ formatCLP(cabin.pricePerNight * nightsCount) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Pie de Botones -->
        <template #pie>
        <div class="flex items-center gap-2">
          <BaseButton variant="outline" class="flex-1" @click="close">
            Cerrar
          </BaseButton>

          <BaseButton variant="primary" class="flex-[1.5]" @click="handleSelectFromModal">
            <Check class="w-4 h-4 mr-1 stroke-[2.5]" />
            Elegir esta Cabaña
          </BaseButton>
        </div>
        </template>
  </HojaModal>

  <!-- Formulario de edición (administrador) -->
  <HojaModal
        :abierto="isOpen && (isEditable || !cabin)"
        :titulo="isEditing ? 'Editar cabaña' : 'Nueva cabaña'"
        :subtitulo="isEditing ? form.name : undefined"
        texto-guardar="Guardar cabaña"
        @cerrar="close"
        @guardar="handleSave"
      >
        <div>
          <label class="campo-etiqueta" for="cabana-nombre">Nombre de la cabaña</label>
          <input id="cabana-nombre" v-model="form.name" required type="text" placeholder="Ej: Cabaña 6" class="campo-entrada" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="campo-etiqueta" for="cabana-capacidad">Capacidad máxima</label>
            <input id="cabana-capacidad" v-model.number="form.capacity" required type="number" inputmode="numeric" min="1" max="20" class="campo-entrada" />
          </div>
          <div>
            <label class="campo-etiqueta" for="cabana-precio">Precio por noche</label>
            <input id="cabana-precio" v-model.number="form.pricePerNight" required type="number" inputmode="numeric" min="0" step="1000" class="campo-entrada" />
          </div>
        </div>

        <div>
          <label class="campo-etiqueta" for="cabana-camas">Distribución de camas</label>
          <input id="cabana-camas" v-model="form.bedsDescription" type="text" placeholder="Ej: 1 cama matrimonial + 2 literas" class="campo-entrada" />
        </div>

        <div>
          <label class="campo-etiqueta" for="cabana-descripcion">Descripción</label>
          <textarea id="cabana-descripcion" v-model="form.description" rows="3" placeholder="Cabaña totalmente equipada…" class="campo-entrada"></textarea>
        </div>

        <!-- Marca de servicio o mantención (SCRUM-266) -->
        <label class="flex items-start gap-3 bg-amber-50 p-4 rounded-2xl border border-amber-400 cursor-pointer">
          <input type="checkbox" v-model="form.enMantencion" class="mt-0.5 w-6 h-6 shrink-0 accent-brand-dark" />
          <span class="space-y-1">
            <span class="block font-bold text-amber-950">En mantención</span>
            <span class="block text-sm text-amber-950">
              No se ofrece para nuevas reservas. Las que ya tiene no cambian.
            </span>
          </span>
        </label>

        <!-- Galería de fotos (hasta 8) -->
        <ImageGalleryEditor
          v-model:images="form.images!"
          v-model:mainImage="form.mainImage"
          :max-images="8"
          label="Fotografías"
        />

        <ListaEtiquetas
          :model-value="(form.features as string[] | undefined) ?? []"
          etiqueta="Servicios incluidos"
          placeholder="Ej: Estufa a leña"
          @update:model-value="form.features = $event"
        />
  </HojaModal>
</template>