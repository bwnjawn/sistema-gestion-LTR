// En iPhone, tras abrir y cerrar el teclado en la app instalada, el viewport visual
// queda más bajo que el de diseño (vv.height menor que innerHeight) y al hacer scroll
// se desplaza dentro de él: visualViewport.offsetTop crece. Las barras `fixed` y el
// encabezado `sticky` siguen al viewport de diseño, así que se separan del borde de la
// pantalla justo esa cantidad. Aquí se copia ese desfase a la variable CSS
// --vv-offset-y, que usan .barra-fija-inferior y .encabezado-fijo para compensarlo.
// Con el viewport normal el desfase es 0 y no cambia nada.

export function ajustarBarrasAlViewport() {
  const vv = window.visualViewport
  if (!vv) return

  const raiz = document.documentElement
  let pendiente = false

  const aplicar = () => {
    pendiente = false
    // Con zoom de pellizco las coordenadas cambian: no se corrige nada
    // Solo se compensa cuando el viewport visual quedó más bajo que la ventana (el caso
    // del teclado) y nunca más que ese déficit: así el rebote o el scroll normal no mueven nada
    const deficit = window.innerHeight - vv.height
    const desfase = vv.scale === 1 && deficit > 2 ? Math.min(Math.max(0, vv.offsetTop), deficit) : 0
    raiz.style.setProperty('--vv-offset-y', `${Math.round(desfase * 10) / 10}px`)
  }

  const programar = () => {
    if (pendiente) return
    pendiente = true
    requestAnimationFrame(aplicar)
  }

  // Reinicio del viewport: si tras cerrar el teclado queda más bajo que la ventana, o con
  // un zoom residual (p. ej. 1.007 tras un doble toque), se cambia un instante el meta
  // viewport para que WebKit recalcule. Solo actúa ante la anomalía; si no, no hace nada.
  const meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null
  let reinicioPendiente: ReturnType<typeof setTimeout> | undefined

  const hayAnomalia = () =>
    vv.scale !== 1 || window.innerHeight - vv.height > 2 || window.innerWidth - vv.width > 2

  const reiniciar = () => {
    const activo = document.activeElement as HTMLElement | null
    if (!meta || activo?.closest?.('input, select, textarea') || !hayAnomalia()) return
    const original = meta.content
    window.dispatchEvent(new CustomEvent('ltr:viewport', {
      detail: `reinicio viewport (vv ${Math.round(vv.height)}/${window.innerHeight}, escala ${vv.scale})`
    }))
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover'
    setTimeout(() => { meta.content = original }, 80)
  }

  const programarReinicio = () => {
    clearTimeout(reinicioPendiente)
    reinicioPendiente = setTimeout(reiniciar, 400)
  }

  document.addEventListener('focusout', programarReinicio)
  vv.addEventListener('resize', programarReinicio, { passive: true })

  vv.addEventListener('scroll', programar, { passive: true })
  vv.addEventListener('resize', programar, { passive: true })
  window.addEventListener('scroll', programar, { passive: true })
  aplicar()
}
