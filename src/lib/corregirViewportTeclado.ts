// En iPhone, con la app instalada, al cerrar el teclado el viewport a veces no se
// restaura del todo y las barras fijas quedan más arriba, con un margen debajo que
// dura hasta cerrar la app. Al cerrarse el teclado se fuerza a WebKit a recalcular el
// diseño con un desplazamiento mínimo que se deshace enseguida, sin mover al usuario.

const CAMPOS = 'input, select, textarea, [contenteditable="true"]'

function recalcular() {
  const y = window.scrollY
  // Si la página no tiene recorrido, scrollTo no hace nada y no pasa nada
  window.scrollTo(0, y + 1)
  requestAnimationFrame(() => window.scrollTo(0, y))
}

export function corregirViewportTeclado() {
  // Al soltar el foco de un campo sin pasar a otro, el teclado se está cerrando
  document.addEventListener('focusout', (e) => {
    if (!(e.target as HTMLElement | null)?.closest?.(CAMPOS)) return
    setTimeout(() => {
      const activo = document.activeElement as HTMLElement | null
      if (activo?.closest?.(CAMPOS)) return
      recalcular()
      setTimeout(recalcular, 300) // iOS termina la animación del teclado después
    }, 100)
  })

  // Refuerzo: cuando la parte visible vuelve a ser la ventana completa
  const vv = window.visualViewport
  if (vv) {
    let reducido = false
    vv.addEventListener('resize', () => {
      const completo = Math.abs(window.innerHeight - vv.height) < 2
      if (reducido && completo) setTimeout(recalcular, 50)
      reducido = !completo
    })
  }
}
