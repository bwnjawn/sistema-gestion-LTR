<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Dish, MealType, SideDishMode } from '../../types/domain'
import { ETIQUETAS_COMIDA, ORDEN_COMIDAS, comidaAdmiteAcompanamiento, validarNombreAcompanamiento, validarPlato } from '../../services/menus'
import ImageGalleryEditor from '../ui/ImageGalleryEditor.vue'
import ListaFilas from '../ui/ListaFilas.vue'
import HojaModal from '../ui/HojaModal.vue'

const props = defineProps<{
  isOpen: boolean
  dish?: Dish | null
  isEditable?: boolean
  globalSideDishes?: string[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', dishData: Partial<Dish>): void
  (e: 'add-global-side', sideName: string): void
}>()

const isEditing = ref(false)

const form = ref<{
  name: string
  price: number
  description: string
  mealType: MealType
  sideMode: SideDishMode
  fixedSide: string
  availableSides: string[]
  images: string[]
  mainImage: string
}>({
  name: '',
  price: 10000,
  description: '',
  mealType: 'almuerzo',
  sideMode: 'choice',
  fixedSide: '',
  availableSides: [],
  images: [],
  mainImage: ''
})

const newSideInput = ref('')

const MODOS: Array<{ valor: SideDishMode; etiqueta: string }> = [
  { valor: 'choice', etiqueta: 'A elección' },
  { valor: 'fixed', etiqueta: 'Fijo' },
  { valor: 'none', etiqueta: 'Ninguno' }
]
/** Mensaje de error del formulario (nombre repetido, configuración incompleta). */
const errorForm = ref<string | null>(null)

watch(() => [props.dish, props.isOpen], () => { errorForm.value = null })

watch(() => props.dish, (newDish) => {
  if (newDish) {
    isEditing.value = true
    const currentSides = newDish.availableSides || []
    const mode: SideDishMode = newDish.sideMode
    const initialImg = newDish.image || ''
    
    form.value = {
      name: newDish.name || '',
      price: newDish.price || 10000,
      description: newDish.description || '',
      mealType: newDish.mealType,
      sideMode: mode,
      fixedSide: newDish.fixedSide || '',
      availableSides: [...currentSides],
      images: initialImg ? [initialImg] : [],
      mainImage: initialImg
    }
  } else {
    isEditing.value = false
    form.value = {
      name: '',
      price: 10000,
      description: '',
      mealType: 'almuerzo',
      sideMode: 'choice',
      fixedSide: '',
      availableSides: props.globalSideDishes ? [...props.globalSideDishes] : [],
      images: [],
      mainImage: ''
    }
  }
}, { immediate: true })

/** Desayuno y once no llevan acompañamiento: la sección se oculta. */
const admiteAcompanamiento = computed(() => comidaAdmiteAcompanamiento(form.value.mealType))

/** Acompañamientos del catálogo que aún no se ofrecen en este plato (opciones del selector). */
const sidesPorAgregar = computed(() => (props.globalSideDishes ?? []).filter(s => !form.value.availableSides.includes(s)))

/** Se elige en el selector del teléfono y pasa a la lista de opciones del plato. */
function agregarSide(event: Event) {
  const select = event.target as HTMLSelectElement
  if (select.value && !form.value.availableSides.includes(select.value)) form.value.availableSides.push(select.value)
  select.value = ''
}

function quitarSide(side: string) {
  form.value.availableSides = form.value.availableSides.filter(s => s !== side)
}

function handleAddGlobalSide() {
  const trimmed = newSideInput.value.trim()
  if (!trimmed) return
  const invalido = validarNombreAcompanamiento(trimmed, props.globalSideDishes ?? [])
  if (invalido) {
    errorForm.value = invalido
    return
  }
  errorForm.value = null
  emit('add-global-side', trimmed)
  if (!form.value.availableSides.includes(trimmed)) {
    form.value.availableSides.push(trimmed)
  }
  newSideInput.value = ''
}

function handleSave() {
  const invalido = validarPlato({
    name: form.value.name,
    mealType: form.value.mealType,
    sideMode: form.value.sideMode,
    fixedSide: form.value.fixedSide,
    availableSides: form.value.availableSides
  })
  if (invalido) {
    errorForm.value = invalido
    return
  }
  errorForm.value = null
  const imgUrl = form.value.mainImage || (form.value.images && form.value.images[0]) || ''
  emit('save', {
    name: form.value.name,
    price: form.value.price,
    description: form.value.description,
    mealType: form.value.mealType,
    sideMode: admiteAcompanamiento.value ? form.value.sideMode : 'none',
    fixedSide: admiteAcompanamiento.value && form.value.sideMode === 'fixed' ? form.value.fixedSide : '',
    availableSides: admiteAcompanamiento.value && form.value.sideMode === 'choice' ? form.value.availableSides : [],
    image: imgUrl
  })
  emit('close')
}

function close() {
  emit('close')
}
</script>

<template>
  <HojaModal
    :abierto="isOpen"
    ancho="amplio"
        :titulo="isEditing ? 'Editar plato' : 'Nuevo plato'"
        :subtitulo="isEditing ? form.name : undefined"
        texto-guardar="Guardar plato"
        @cerrar="close"
        @guardar="handleSave"
      >
        <div>
          <label class="campo-etiqueta" for="plato-nombre">Nombre del plato</label>
          <input id="plato-nombre" v-model="form.name" required type="text" placeholder="Ej: Asado de cordero" class="campo-entrada" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="campo-etiqueta" for="plato-precio">Precio</label>
            <input id="plato-precio" v-model.number="form.price" required type="number" inputmode="numeric" min="0" step="500" class="campo-entrada" />
          </div>
          <div>
            <label class="campo-etiqueta" for="plato-comida">Comida</label>
            <select id="plato-comida" v-model="form.mealType" class="campo-entrada">
              <option v-for="comida in ORDEN_COMIDAS" :key="comida" :value="comida">{{ ETIQUETAS_COMIDA[comida] }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="campo-etiqueta" for="plato-descripcion">Descripción</label>
          <textarea id="plato-descripcion" v-model="form.description" rows="3" placeholder="Qué incluye el plato…" class="campo-entrada"></textarea>
        </div>

        <!-- Fotografía -->
        <ImageGalleryEditor
          v-model:images="form.images"
          v-model:mainImage="form.mainImage"
          :max-images="1"
          label="Fotografía"
        />

        <!-- Acompañamientos: solo el almuerzo los lleva -->
        <div>
          <h4 class="font-bold text-brand-dark mb-3">Acompañamientos</h4>

          <p v-if="!admiteAcompanamiento" class="campo-ayuda mt-0">
            El desayuno y la once se sirven completos: no llevan acompañamiento. Lo que incluyen va en la descripción.
          </p>

          <template v-else>
            <div class="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-xl" role="group" aria-label="Tipo de acompañamiento">
              <button
                v-for="opcion in MODOS"
                :key="opcion.valor"
                type="button"
                :aria-pressed="form.sideMode === opcion.valor"
                :class="[
                  'py-2.5 px-1 rounded-lg text-sm',
                  form.sideMode === opcion.valor ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-600'
                ]"
                @click="form.sideMode = opcion.valor"
              >
                {{ opcion.etiqueta }}
              </button>
            </div>

            <!-- Acompañamiento fijo -->
            <div v-if="form.sideMode === 'fixed'" class="mt-4">
              <label class="campo-etiqueta" for="plato-fijo">Acompañamiento incluido</label>
              <input id="plato-fijo" v-model="form.fixedSide" type="text" placeholder="Ej: Pan amasado y sopaipillas" class="campo-entrada" />
            </div>

            <!-- Acompañamiento a elección: se agrega con el selector del teléfono -->
            <div v-else-if="form.sideMode === 'choice'" class="mt-4 space-y-4">
              <div class="space-y-3">
                <label class="campo-etiqueta !mb-0" for="plato-agregar-side">
                  Opciones entre las que elegirá el cliente<span v-if="form.availableSides.length > 0"> ({{ form.availableSides.length }})</span>
                </label>
                <ListaFilas
                  :items="form.availableSides"
                  vacio="Aún no hay opciones. Agrega al menos una."
                  @quitar="quitarSide"
                />
                <select
                  v-if="sidesPorAgregar.length > 0"
                  id="plato-agregar-side"
                  class="campo-entrada"
                  @change="agregarSide"
                >
                  <option value="">Agregar acompañamiento…</option>
                  <option v-for="side in sidesPorAgregar" :key="side" :value="side">{{ side }}</option>
                </select>
                <p v-else-if="form.availableSides.length > 0" class="campo-ayuda mt-0">Ya agregaste todos los acompañamientos disponibles.</p>
              </div>

              <div>
                <label class="campo-etiqueta" for="plato-nuevo-side">¿Falta uno? Créalo aquí</label>
                <div class="flex gap-2">
                  <input id="plato-nuevo-side" v-model="newSideInput" type="text" placeholder="Ej: Puré de papas" class="campo-entrada min-w-0 flex-1" @keydown.enter.prevent="handleAddGlobalSide" />
                  <button type="button" class="px-4 rounded-xl border border-brand-dark text-brand-dark font-bold active:scale-95" @click="handleAddGlobalSide">Crear</button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <p v-if="errorForm" role="alert" class="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm">{{ errorForm }}</p>
  </HojaModal>
</template>
