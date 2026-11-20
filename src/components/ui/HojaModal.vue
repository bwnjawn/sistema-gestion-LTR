<script lang="ts">
// Niveles de las hojas abiertas en este momento (compartido por todas las hojas)
const abiertas: number[] = []
</script>

<script setup lang="ts">
// Hoja de la aplicación (SCRUM-279): TODO modal (formularios, detalles y confirmaciones) usa esta base.
// En el teléfono sube desde abajo, con el título y los botones fijos y solo el contenido con scroll; en pantallas
// anchas queda centrada. El fondo es negro neutro, sin color de marca ni desenfoque. Solo las ayudas "?"
// (`ModalAyuda`) son una caja centrada.
//
// Uso básico: <HojaModal :abierto titulo texto-guardar="Guardar" @cerrar @guardar> …campos… </HojaModal>
// - Sin `texto-guardar` no hay pie estándar: se puede poner uno propio en el slot `pie`.
// - Slot `cabecera`: reemplaza al encabezado estándar (por ejemplo, un carrusel de fotos arriba).
// - `sin-relleno`: el contenido ocupa todo el ancho, sin margen ni separación (lo maneja quien lo usa).
// - `sin-manija`: sin la barrita superior (cuando arriba va una foto a todo el ancho).
// - `ocultar-cierre`: sin la X del encabezado (confirmaciones, que ya traen sus botones).
// - `nivel`: z-index; una hoja que se abre encima de otra (confirmar sobre un detalle) usa un número mayor.
// - `cerrar-al-tocar-fuera`: por defecto, tocar el fondo cierra. Se apaga en formularios largos para no perder lo escrito.
import { onBeforeUnmount, toRef, watch } from 'vue'
import { X } from 'lucide-vue-next'
import { useBloqueoScroll } from '../../composables/useBloqueoScroll'

const props = withDefaults(defineProps<{
  abierto: boolean
  titulo: string
  /** Texto pequeño bajo el título (por ejemplo, qué se está editando). */
  subtitulo?: string
  /** Si se indica, el pie trae "Cancelar" y este botón, que envía el formulario. */
  textoGuardar?: string
  /** Deshabilita el botón de guardar mientras se guarda. */
  guardando?: boolean
  sinRelleno?: boolean
  ocultarCierre?: boolean
  sinManija?: boolean
  nivel?: number
  cerrarAlTocarFuera?: boolean
}>(), {
  nivel: 50,
  cerrarAlTocarFuera: true
})

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'guardar'): void
}>()

useBloqueoScroll(toRef(props, 'abierto'))

// Esc cierra solo la hoja de más arriba: si hay otra abierta con un nivel mayor, esta no responde.
function alTeclear(evento: KeyboardEvent) {
  if (evento.key !== 'Escape') return
  if (Math.max(...abiertas) === props.nivel) emit('cerrar')
}
watch(
  () => props.abierto,
  (abierto) => {
    if (abierto) {
      abiertas.push(props.nivel)
      window.addEventListener('keydown', alTeclear)
    } else {
      const i = abiertas.indexOf(props.nivel)
      if (i >= 0) abiertas.splice(i, 1)
      window.removeEventListener('keydown', alTeclear)
    }
  },
  { immediate: true }
)
onBeforeUnmount(() => {
  const i = abiertas.indexOf(props.nivel)
  if (i >= 0) abiertas.splice(i, 1)
  window.removeEventListener('keydown', alTeclear)
})

function alTocarFondo() {
  if (props.cerrarAlTocarFuera) emit('cerrar')
}
</script>

<template>
  <!-- Teleport: el encabezado del panel tiene backdrop-blur y ese efecto encierra a los elementos fijos que lleva dentro -->
  <Teleport to="body">
    <Transition name="hoja">
      <div
        v-if="abierto"
        class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center sm:p-4"
        :style="{ zIndex: nivel }"
        @click.self="alTocarFondo"
      >
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="titulo"
          class="hoja-panel bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90dvh] overflow-hidden"
        >
          <!-- Con `texto-guardar` es un formulario (Enter envía); si no, un contenedor, porque el contenido puede traer sus propios formularios -->
          <component :is="textoGuardar ? 'form' : 'div'" class="flex flex-col min-h-0 grow" @submit.prevent="emit('guardar')">
            <!-- Manija: indica en el teléfono que es una hoja -->
            <div v-if="!sinManija" class="sm:hidden pt-2 shrink-0" aria-hidden="true">
              <div class="w-10 h-1.5 rounded-full bg-gray-300 mx-auto"></div>
            </div>

            <slot name="cabecera">
              <header class="flex items-center justify-between gap-3 px-5 py-3 border-b border-gray-200 shrink-0">
                <div class="min-w-0">
                  <h2 class="text-xl font-bold text-brand-dark leading-tight">{{ titulo }}</h2>
                  <p v-if="subtitulo" class="text-sm text-gray-600 truncate">{{ subtitulo }}</p>
                </div>
                <button
                  v-if="!ocultarCierre"
                  type="button"
                  aria-label="Cerrar"
                  class="w-11 h-11 shrink-0 flex items-center justify-center rounded-full border border-gray-300 bg-white text-brand-dark active:scale-95"
                  @click="emit('cerrar')"
                >
                  <X class="w-5 h-5 stroke-2" />
                </button>
              </header>
            </slot>

            <div :class="['overflow-y-auto grow min-h-0', sinRelleno ? '' : 'px-5 py-5 space-y-5']">
              <slot />
            </div>

            <footer v-if="textoGuardar || $slots.pie" class="px-5 pt-4 pb-seguro-nav border-t border-gray-200 bg-white shrink-0">
              <slot name="pie">
                <div class="flex gap-3">
                  <button type="button" class="flex-1 py-3.5 rounded-2xl border border-brand-dark bg-white text-brand-dark font-bold" @click="emit('cerrar')">
                    Cancelar
                  </button>
                  <button type="submit" :disabled="guardando" class="flex-1 py-3.5 rounded-2xl border border-brand-dark bg-brand-dark text-white font-bold disabled:opacity-60">
                    {{ guardando ? 'Guardando…' : textoGuardar }}
                  </button>
                </div>
              </slot>
            </footer>
          </component>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
