// En iPhone, `touch-action: manipulation` no siempre evita el zoom del doble toque
// (sobre todo en tarjetas, calendario y botones dentro de contenedores con scroll).
// Esta defensa detecta el segundo toque rápido sobre el mismo lugar, cancela el zoom
// y le entrega igualmente el clic al elemento, para que contadores y botones sigan
// respondiendo a cada toque. El pellizco con dos dedos no se toca.

const VENTANA_MS = 400
const DESPLAZAMIENTO_MAX = 12 // píxeles: más que eso es un arrastre, no un toque
const CAMPOS = 'input, select, textarea, [contenteditable="true"]'

export function evitarZoomDobleToque() {
  let ultimoToque = 0
  let inicio: { x: number; y: number } | null = null

  document.addEventListener(
    'touchstart',
    (e) => {
      inicio = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null
    },
    { passive: true }
  )

  document.addEventListener(
    'touchend',
    (e) => {
      const toque = e.changedTouches[0]
      const fueToque =
        inicio !== null &&
        e.touches.length === 0 &&
        Math.abs(toque.clientX - inicio.x) < DESPLAZAMIENTO_MAX &&
        Math.abs(toque.clientY - inicio.y) < DESPLAZAMIENTO_MAX
      inicio = null
      if (!fueToque) {
        ultimoToque = 0
        return
      }

      const ahora = Date.now()
      const objetivo = e.target as HTMLElement | null
      if (ahora - ultimoToque < VENTANA_MS && objetivo && !objetivo.closest(CAMPOS)) {
        e.preventDefault() // cancela el zoom y también el clic que generaría el navegador
        objetivo.click() // se reemite el clic para no perder el segundo toque
      }
      ultimoToque = ahora
    },
    { passive: false }
  )
}
