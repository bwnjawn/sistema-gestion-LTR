<script setup lang="ts">
import { onBeforeUnmount, onMounted, provide, ref } from 'vue'
import { DESTINO_BARRA_INFERIOR } from './marcoApp'
import { frenarArrastreSinScroll } from '../../composables/useBloqueoScroll'
import { usePantallaAncha } from '../../composables/usePantallaAncha'

// Marco de altura fija de la app en teléfono (SCRUM-259). En iPhone, con la app instalada, las barras `fixed` se
// desprendían al tirar de la página o al cerrar el teclado, porque la que se desplazaba era la página entera. Aquí la
// página queda quieta: el encabezado (slot `encabezado`) arriba, la barra inferior (slot `pie`, o cualquier barra
// envuelta en `AnclaBarraInferior`) abajo, y solo el contenido del medio se desplaza. Desde 1024 px (PC) no hace
// nada: la página se desplaza como siempre. Los estilos están en `main.css` (`.marco-app`).
const destinoBarra = ref<HTMLElement | null>(null)
provide(DESTINO_BARRA_INFERIOR, destinoBarra)

const { esAncha } = usePantallaAncha()

// Arrastrar sobre una zona que no se desplaza (encabezado, barras) movería la página entera y dejaría ver el fondo vacío
function alArrastrar(evento: TouchEvent) {
  if (!esAncha.value) frenarArrastreSinScroll(evento)
}

// Al abrir el teclado iOS desplaza la ventana para mostrar el campo, y al cerrarlo no siempre la devuelve: el
// encabezado queda tapado hasta cambiar de pantalla. Cuando ya no hay ningún campo enfocado (teclado cerrado) se
// vuelve a 0. Mientras el teclado está abierto no se toca: pelearía con iOS y la hoja quedaría tapada.
// Además corrige el área visible atascada (ver `ajustarAlAreaVisible`).
const CAMPOS = 'input, select, textarea, [contenteditable="true"]'
// iOS puede dejar el área visible (`visualViewport`) más baja que la ventana y corrida hacia abajo después del
// teclado (por ejemplo 780 de 848 px, corrida 29). Es el defecto del ticket SCRUM-259 y `scrollTo` no lo corrige,
// porque no es el scroll de la página. Con el teclado cerrado, el marco se ajusta entonces al área visible: se
// baja `offsetTop` y se mantiene la altura de la ventana, así el encabezado y la barra quedan dentro de lo que
// se ve. Si el área visible vuelve a la normalidad, el ajuste se quita solo.
const estiloMarco = ref<Record<string, string>>({})
function ajustarAlAreaVisible() {
  const vv = window.visualViewport
  const hayCampo = !!(document.activeElement as HTMLElement | null)?.closest?.(CAMPOS)
  const atascado = !!vv && !esAncha.value && !hayCampo && vv.scale <= 1.01 && window.innerHeight - vv.height > 2
  if (!atascado || !vv) {
    if (Object.keys(estiloMarco.value).length) estiloMarco.value = {}
    return
  }
  // La altura es la de la ventana, no la de `vv`: con el teclado cerrado la pantalla muestra la ventana completa
  // aunque iOS informe un área visible más baja (si se usara `vv.height`, la barra quedaría 68 px más arriba)
  estiloMarco.value = { transform: `translateY(${Math.round(vv.offsetTop)}px)`, height: `${Math.round(window.innerHeight)}px` }
}

function volverArriba() {
  if (esAncha.value) return
  ajustarAlAreaVisible()
  if ((document.activeElement as HTMLElement | null)?.closest?.(CAMPOS)) return
  if (window.scrollY !== 0 || (window.visualViewport?.offsetTop ?? 0) !== 0) {
    window.scrollTo(0, 0)
    if (document.scrollingElement) document.scrollingElement.scrollTop = 0
  }
}
// iOS termina de animar el teclado y de desplazar la ventana en un momento que no se conoce: tras soltar el foco se
// vuelve a comprobar cada 80 ms durante 2 s, en vez de hacerlo una sola vez.
let repetidor: ReturnType<typeof setInterval> | undefined
function alSoltarFoco() {
  clearInterval(repetidor)
  const fin = Date.now() + 2000
  repetidor = setInterval(() => {
    volverArriba()
    if (Date.now() > fin) clearInterval(repetidor)
  }, 80)
}

onMounted(() => {
  document.documentElement.classList.add('con-marco')
  document.addEventListener('touchmove', alArrastrar, { passive: false })
  document.addEventListener('focusout', alSoltarFoco)
  window.visualViewport?.addEventListener('resize', volverArriba)
  window.visualViewport?.addEventListener('scroll', volverArriba)
})
onBeforeUnmount(() => {
  document.documentElement.classList.remove('con-marco')
  document.removeEventListener('touchmove', alArrastrar)
  document.removeEventListener('focusout', alSoltarFoco)
  window.visualViewport?.removeEventListener('resize', volverArriba)
  window.visualViewport?.removeEventListener('scroll', volverArriba)
  clearInterval(repetidor)
})
</script>

<template>
  <div class="marco-app" :style="estiloMarco">
    <slot name="encabezado" />
    <div class="marco-scroll">
      <slot />
    </div>
    <div ref="destinoBarra" class="marco-barra">
      <slot name="pie" />
    </div>
  </div>
</template>
