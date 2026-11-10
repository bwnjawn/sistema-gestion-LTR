import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@fontsource/atkinson-hyperlegible/latin-400.css'
import '@fontsource/atkinson-hyperlegible/latin-700.css'
import './assets/main.css'
import { evitarZoomDobleToque } from './lib/sinZoomDobleToque'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia) // ¡Importante: registrar Pinia antes del router!
app.use(router)
app.mount('#app')
evitarZoomDobleToque()