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
import { arrancarConReintentos } from './lib/arranqueConReintentos'
import { pantallaDeArranque } from './lib/pantallaDeArranque'
import { comprobarConDiagnostico, medirCargaDeDatos, registrarEventosDeRed } from './lib/diagnosticoDeRed' // TEMPORAL (SCRUM-274)
import { vigilarRed } from './lib/red'
import { comprobarRed } from './lib/supabase'
import { useActualizacionStore } from './stores/actualizacionStore'

function iniciar() {
  registrarEventosDeRed() // TEMPORAL (SCRUM-274)
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia) // ¡Importante: registrar Pinia antes del router!

  // La pantalla de carga ya está en index.html. Si los datos tardan, no hay conexión o fallan, se explica y la app se
  // recupera sola al volver internet (SCRUM-274). Solo cuando todo cargó se monta la app.
  arrancarConReintentos({
    iniciar: () => medirCargaDeDatos(inicializarAplicacion), // TEMPORAL (SCRUM-274): era `inicializarAplicacion`
    pantalla: pantallaDeArranque,
    // No se confía en `navigator.onLine` (en iPhone puede quedar pegado tras el modo avión): se pregunta al servidor.
    // Al reconectar la red puede tardar en funcionar, así que no se pide nada hasta que responda de verdad.
    comprobarServidor: () => comprobarConDiagnostico(comprobarRed), // TEMPORAL (SCRUM-274): era `comprobarRed`
    alRecuperarConexion: alVolver => {
      window.addEventListener('online', alVolver)
      return () => window.removeEventListener('online', alVolver)
    },
    alTerminar: () => {
      // El router se instala después de cargar los datos: sus guardas leen la sesión del administrador
      app.use(router)
      app.mount('#app')
      evitarZoomDobleToque()
      corregirViewportTeclado()
      // La red se vigila sola: si se cae, se vuelve a comprobar cada pocos segundos hasta que responda
      vigilarRed({ comprobar: comprobarRed })
      // Al volver a la app o recuperar internet, los datos se actualizan solos (SCRUM-273)
      useActualizacionStore(pinia).iniciar()
    }
  })
}

iniciar()
