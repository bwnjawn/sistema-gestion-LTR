// src/lib/pantallaDeArranque.ts
// La pantalla que se ve mientras la app carga o si no puede cargar (SCRUM-274). Usa las clases `.arranque` que
// define index.html, así se ve igual que la pantalla de carga inicial y no depende de que cargue el CSS de la app.

import type { PantallaDeArranque } from './arranqueConReintentos'
import { alActualizarDiagnostico, textoDiagnostico } from './diagnosticoDeRed' // TEMPORAL (SCRUM-274)

interface Contenido {
  titulo?: string
  texto: string
  conGiro: boolean
  boton?: { texto: string; alTocar: () => void }
}

// TEMPORAL (SCRUM-274)
alActualizarDiagnostico(() => {
  const elemento = document.getElementById('arranque-diagnostico')
  if (elemento) elemento.textContent = textoDiagnostico()
})

function pintar(contenido: Contenido): void {
  const raiz = document.getElementById('app')
  if (!raiz) return

  const caja = document.createElement('div')
  caja.className = 'arranque'
  caja.setAttribute('role', contenido.boton ? 'alert' : 'status')
  caja.setAttribute('aria-live', 'polite')

  const logo = document.createElement('img')
  logo.className = 'arranque__logo'
  logo.src = '/images/logo-negro.png'
  logo.alt = ''
  caja.append(logo)

  if (contenido.conGiro) {
    const giro = document.createElement('div')
    giro.className = 'arranque__giro'
    giro.setAttribute('aria-hidden', 'true')
    caja.append(giro)
  }
  if (contenido.titulo) {
    const titulo = document.createElement('h1')
    titulo.className = 'arranque__titulo'
    titulo.textContent = contenido.titulo
    caja.append(titulo)
  }
  const texto = document.createElement('p')
  texto.className = 'arranque__texto'
  texto.textContent = contenido.texto
  caja.append(texto)

  // TEMPORAL (SCRUM-274): diagnóstico de red, se repinta cada vez que cambia
  const diagnostico = document.createElement('pre')
  diagnostico.id = 'arranque-diagnostico'
  diagnostico.style.cssText = 'margin:1rem 0 0;max-width:23rem;text-align:left;white-space:pre-wrap;word-break:break-all;font:11px/1.35 ui-monospace,Menlo,monospace;color:#444'
  diagnostico.textContent = textoDiagnostico()
  caja.append(diagnostico)

  if (contenido.boton) {
    const boton = document.createElement('button')
    boton.type = 'button'
    boton.className = 'arranque__boton'
    boton.textContent = contenido.boton.texto
    boton.addEventListener('click', contenido.boton.alTocar)
    caja.append(boton)
  }
  raiz.replaceChildren(caja)
}

export const pantallaDeArranque: PantallaDeArranque = {
  mostrarCargando() {
    pintar({ texto: 'Cargando…', conGiro: true })
  },
  mostrarDemora(reintentar) {
    pintar({
      titulo: 'Está tardando más de lo normal',
      texto: 'Revisa tu conexión. Seguimos intentando y cargará sola cuando responda.',
      conGiro: true,
      boton: { texto: 'Reintentar', alTocar: reintentar }
    })
  },
  mostrarSinConexion(reintentar) {
    pintar({
      titulo: 'Sin conexión',
      texto: 'Conéctate a internet y la app cargará sola.',
      conGiro: false,
      boton: { texto: 'Reintentar', alTocar: reintentar }
    })
  },
  mostrarSugerenciaDeReinicio(reintentar) {
    pintar({
      titulo: 'El servidor no responde',
      texto: 'Si tu internet funciona, cierra la app del todo y vuelve a abrirla. Mientras tanto seguimos intentando.',
      conGiro: false,
      boton: { texto: 'Reintentar', alTocar: reintentar }
    })
  },
  mostrarError(reintentar) {
    pintar({
      titulo: 'No pudimos cargar los datos',
      texto: 'Inténtalo de nuevo en un momento.',
      conGiro: false,
      boton: { texto: 'Reintentar', alTocar: reintentar }
    })
  }
}
