import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import './assets/main.css'
import { evitarZoomDobleToque } from './lib/sinZoomDobleToque'
import { corregirViewportTeclado } from './lib/corregirViewportTeclado'
import { inicializarAplicacion } from './lib/arranque'

/** Si los datos no se pudieron cargar no se monta la app: se explica y se deja reintentar. */
function mostrarErrorDeArranque(): void {
  const raiz = document.getElementById('app')
  if (!raiz) return
  raiz.innerHTML = ''
  const caja = document.createElement('div')
  caja.setAttribute('role', 'alert')
  caja.style.cssText = 'max-width:24rem;margin:3rem auto;padding:1.25rem;font-family:inherit;text-align:center'
  const titulo = document.createElement('h1')
  titulo.textContent = 'No pudimos cargar los datos'
  titulo.style.cssText = 'font-size:1.25rem;font-weight:900;margin-bottom:.5rem'
  const texto = document.createElement('p')
  texto.textContent = 'Revisa tu conexión e inténtalo de nuevo.'
  texto.style.cssText = 'font-size:1rem;font-weight:700;margin-bottom:1rem'
  const boton = document.createElement('button')
  boton.type = 'button'
  boton.textContent = 'Reintentar'
  boton.style.cssText = 'min-height:3rem;padding:0 1.5rem;border-radius:1rem;border:0;background:#1E4620;color:#fff;font-size:1rem;font-weight:900'
  boton.addEventListener('click', () => location.reload())
  caja.append(titulo, texto, boton)
  raiz.append(caja)
}

async function iniciar() {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia) // ¡Importante: registrar Pinia antes del router!

  try {
    await inicializarAplicacion()
  } catch (error) {
    console.error('[Arranque] No se pudieron cargar los datos:', error)
    mostrarErrorDeArranque()
    return
  }

  // El router se instala después de cargar los datos: sus guardas leen la sesión del administrador
  app.use(router)
  app.mount('#app')
  evitarZoomDobleToque()
  corregirViewportTeclado()
}

void iniciar()
