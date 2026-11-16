import { onBeforeUnmount, watch, type Ref } from 'vue'

// Contador compartido: varios modales pueden estar abiertos a la vez
let bloqueos = 0

/** ¿Hay un contenedor con scroll propio entre el dedo y el fondo? (la hoja del modal puede deslizarse) */
function dentroDeUnaZonaConScroll(destino: EventTarget | null): boolean {
  let el = destino instanceof HTMLElement ? destino : null
  while (el && el !== document.body && el !== document.documentElement) {
    const { overflowY } = getComputedStyle(el)
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return true
    el = el.parentElement
  }
  return false
}

// iOS Safari ignora `overflow: hidden` en <body>: el fondo se sigue deslizando. Se frena el gesto
// salvo dentro de una zona que sí tiene scroll propio (el contenido del modal).
function frenarGestoFuera(evento: TouchEvent) {
  if (evento.touches.length > 1) return
  if (!dentroDeUnaZonaConScroll(evento.target)) evento.preventDefault()
}

function aplicar(bloquear: boolean) {
  document.documentElement.style.overflow = bloquear ? 'hidden' : ''
  document.body.style.overflow = bloquear ? 'hidden' : ''
  document.documentElement.style.overscrollBehavior = bloquear ? 'none' : ''
  if (bloquear) document.addEventListener('touchmove', frenarGestoFuera, { passive: false })
  else document.removeEventListener('touchmove', frenarGestoFuera)
}

/**
 * Bloquea el scroll del fondo mientras `abierto` sea verdadero.
 * Se libera solo al cerrar o al destruir el componente.
 */
export function useBloqueoScroll(abierto: Ref<boolean>) {
  let activo = false

  const poner = (valor: boolean) => {
    if (valor === activo) return
    activo = valor
    bloqueos += valor ? 1 : -1
    aplicar(bloqueos > 0)
  }

  watch(abierto, poner, { immediate: true })
  onBeforeUnmount(() => poner(false))
}
