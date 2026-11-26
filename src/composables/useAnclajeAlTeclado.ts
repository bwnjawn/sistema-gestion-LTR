import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

// Diferencia mínima entre la ventana y el área visible para considerar que hay un teclado abierto
const UMBRAL_TECLADO_PX = 120

/**
 * Estilo para el fondo de una hoja que sube desde abajo: con el teclado abierto la ajusta al área visible
 * (`visualViewport`), porque en iOS el teclado no encoge la ventana y la hoja quedaría tapada o arrastrada. Sin
 * teclado devuelve un estilo vacío y la hoja ocupa toda la pantalla como siempre (SCRUM-259).
 */
export function useAnclajeAlTeclado(abierto: Ref<boolean>) {
  const estilo = ref<Record<string, string>>({})
  const vv = typeof window !== 'undefined' ? window.visualViewport : null

  function actualizar() {
    if (!vv || !abierto.value || window.innerHeight - vv.height <= UMBRAL_TECLADO_PX) {
      if (Object.keys(estilo.value).length) estilo.value = {}
      return
    }
    estilo.value = { inset: 'auto', left: '0', right: '0', top: `${vv.offsetTop}px`, height: `${vv.height}px` }
  }
  // iOS termina de animar el teclado después de soltar el foco: se vuelve a medir
  const alSoltarFoco = () => setTimeout(actualizar, 350)

  function escuchar(activo: boolean) {
    if (!vv) return
    const accion = activo ? 'addEventListener' : 'removeEventListener'
    vv[accion]('resize', actualizar)
    vv[accion]('scroll', actualizar)
    document[accion]('focusout', alSoltarFoco)
    if (activo) actualizar()
    else estilo.value = {}
  }

  watch(abierto, escuchar, { immediate: true })
  onBeforeUnmount(() => escuchar(false))

  return estilo
}
