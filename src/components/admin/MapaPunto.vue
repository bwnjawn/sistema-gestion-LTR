<script setup lang="ts">
// Mapa de OpenStreetMap con un pin que el administrador toca o arrastra (SCRUM-281). Leaflet se descarga recién al
// abrir el mapa, para que no pese en el resto de la app. El pin se dibuja con SVG propio (los íconos por defecto de
// Leaflet no se resuelven bien al empaquetar).
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Map as MapaLeaflet, Marker } from 'leaflet'
import type { Coordenadas } from '../../services/ubicacion'
import { redondearCoordenadas } from '../../services/ubicacion'

const props = defineProps<{ modelValue: Coordenadas }>()
const emit = defineEmits<{ (e: 'update:modelValue', punto: Coordenadas): void }>()

const contenedor = ref<HTMLDivElement | null>(null)
const cargando = ref(true)
const fallo = ref(false)

let mapa: MapaLeaflet | null = null
let pin: Marker | null = null

const SVG_PIN =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="44" viewBox="0 0 30 42" aria-hidden="true">' +
  '<path d="M15 1C7 1 1 7.3 1 15c0 10.5 14 26 14 26s14-15.5 14-26C29 7.3 23 1 15 1z" fill="#1f3a2a" stroke="#ffffff" stroke-width="2"/>' +
  '<circle cx="15" cy="15" r="5.5" fill="#ffffff"/></svg>'

onMounted(async () => {
  try {
    const [L] = await Promise.all([import('leaflet'), import('leaflet/dist/leaflet.css')])
    if (!contenedor.value) return

    mapa = L.map(contenedor.value).setView([props.modelValue.lat, props.modelValue.lng], 16)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
    }).addTo(mapa)

    pin = L.marker([props.modelValue.lat, props.modelValue.lng], {
      draggable: true,
      keyboard: false,
      icon: L.divIcon({ className: '', html: SVG_PIN, iconSize: [32, 44], iconAnchor: [16, 44] })
    }).addTo(mapa)

    const elegir = (lat: number, lng: number) => emit('update:modelValue', redondearCoordenadas({ lat, lng }))
    pin.on('dragend', () => {
      const p = pin!.getLatLng()
      elegir(p.lat, p.lng)
    })
    mapa.on('click', (evento) => {
      pin!.setLatLng(evento.latlng)
      elegir(evento.latlng.lat, evento.latlng.lng)
    })

    // La hoja sube con una animación: se recalcula el tamaño cuando termina para que el mapa llene su espacio
    setTimeout(() => mapa?.invalidateSize(), 350)
    cargando.value = false
  } catch {
    fallo.value = true
    cargando.value = false
  }
})

// Cambios desde fuera (buscar una dirección o usar la ubicación actual): se mueve el pin y el mapa
watch(
  () => props.modelValue,
  (punto) => {
    if (!mapa || !pin) return
    const actual = pin.getLatLng()
    if (actual.lat === punto.lat && actual.lng === punto.lng) return
    pin.setLatLng([punto.lat, punto.lng])
    mapa.setView([punto.lat, punto.lng], Math.max(mapa.getZoom(), 16))
  }
)

onBeforeUnmount(() => {
  mapa?.remove()
  mapa = null
  pin = null
})
</script>

<template>
  <div class="relative h-[52dvh] min-h-64 bg-gray-100">
    <div ref="contenedor" class="absolute inset-0" role="application" aria-label="Mapa para marcar la ubicación del local"></div>
    <p v-if="cargando" class="absolute inset-0 flex items-center justify-center text-sm text-gray-600">Cargando el mapa…</p>
    <p v-if="fallo" role="alert" class="absolute inset-x-3 top-3 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm">
      No se pudo cargar el mapa. Revisa tu conexión e inténtalo de nuevo.
    </p>
  </div>
</template>
