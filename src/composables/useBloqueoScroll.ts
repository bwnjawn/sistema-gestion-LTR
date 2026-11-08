import { onBeforeUnmount, watch, type Ref } from 'vue'

// Contador compartido: varios modales pueden estar abiertos a la vez
let bloqueos = 0

function aplicar(bloquear: boolean) {
  document.documentElement.style.overflow = bloquear ? 'hidden' : ''
  document.body.style.overflow = bloquear ? 'hidden' : ''
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
