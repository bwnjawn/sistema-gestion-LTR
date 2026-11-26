import { onBeforeUnmount, watch, type Ref } from 'vue'

// Contador compartido: varios modales pueden estar abiertos a la vez
let bloqueos = 0

/** La zona con scroll propio más cercana al dedo (vertical u horizontal), o null si no hay ninguna. */
function zonaConScroll(destino: EventTarget | null): HTMLElement | null {
  let el = destino instanceof HTMLElement ? destino : null
  while (el && el !== document.body && el !== document.documentElement) {
    const { overflowY, overflowX } = getComputedStyle(el)
    const vertical = (overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight
    const horizontal = (overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth
    if (vertical || horizontal) return el
    el = el.parentElement
  }
  return null
}

/**
 * Frena el arrastre que empieza sobre una zona que no se desplaza (encabezado, barras, fondo de un modal): en iOS
 * movería la página entera y dejaría ver el fondo vacío. Dentro de una zona con scroll propio no hace nada, así que
 * se conserva el rebote normal de iOS. Lo usa el marco de la app (`MarcoApp`) y el bloqueo de los modales.
 */
export function frenarArrastreSinScroll(evento: TouchEvent) {
  if (evento.touches.length > 1) return
  if (!zonaConScroll(evento.target)) evento.preventDefault()
}

// Posición vertical donde empezó el gesto, para saber hacia dónde arrastra el dedo
let inicioY = 0
function anotarInicio(evento: TouchEvent) {
  inicioY = evento.touches[0]?.clientY ?? 0
}

// Con el teclado abierto, un arrastre que ya no tiene nada que desplazar (la zona está en su tope o en su final)
// movería toda la pantalla y la hoja del modal se saldría de la vista. Se frena también ese caso.
function frenarGestoModal(evento: TouchEvent) {
  if (evento.touches.length > 1) return
  const zona = zonaConScroll(evento.target)
  if (!zona) {
    evento.preventDefault()
    return
  }
  if (zona.scrollHeight <= zona.clientHeight) return // solo se desplaza en horizontal
  const dy = (evento.touches[0]?.clientY ?? 0) - inicioY
  const enElTope = zona.scrollTop <= 0
  const enElFinal = zona.scrollTop + zona.clientHeight >= zona.scrollHeight - 1
  if ((dy > 0 && enElTope) || (dy < 0 && enElFinal)) evento.preventDefault()
}

function aplicar(bloquear: boolean) {
  document.documentElement.style.overflow = bloquear ? 'hidden' : ''
  document.body.style.overflow = bloquear ? 'hidden' : ''
  document.documentElement.style.overscrollBehavior = bloquear ? 'none' : ''
  if (bloquear) {
    document.addEventListener('touchstart', anotarInicio, { passive: true })
    document.addEventListener('touchmove', frenarGestoModal, { passive: false })
  } else {
    document.removeEventListener('touchstart', anotarInicio)
    document.removeEventListener('touchmove', frenarGestoModal)
  }
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
