<script setup lang="ts">
// Hoja para marcar la ubicación del local (SCRUM-281): toca el mapa o arrastra el pin; también se puede buscar una
// dirección o usar la ubicación actual del teléfono (útil estando en el local).
import { ref, watch } from 'vue'
import { LocateFixed, Search } from 'lucide-vue-next'
import { buscarDireccion } from '../../lib/buscarDireccion'
import { UBICACION_POR_DEFECTO, textoCoordenadas, type Coordenadas } from '../../services/ubicacion'
import HojaModal from '../ui/HojaModal.vue'
import MapaPunto from './MapaPunto.vue'

const props = defineProps<{
  abierto: boolean
  /** Punto ya guardado; si no hay, el mapa parte del lugar del local. */
  punto: Coordenadas | null
  /** Dirección escrita, para precargar la búsqueda. */
  direccion?: string
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
  (e: 'usar', punto: Coordenadas): void
}>()

const elegido = ref<Coordenadas>({ ...UBICACION_POR_DEFECTO })
const consulta = ref('')
const mensaje = ref<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
const buscando = ref(false)

watch(
  () => props.abierto,
  (abierto) => {
    if (!abierto) return
    elegido.value = { ...(props.punto ?? UBICACION_POR_DEFECTO) }
    consulta.value = props.direccion ?? ''
    mensaje.value = null
  },
  { immediate: true }
)

async function buscar() {
  if (!consulta.value.trim() || buscando.value) return
  buscando.value = true
  mensaje.value = null
  try {
    const encontrado = await buscarDireccion(consulta.value)
    if (encontrado) {
      elegido.value = encontrado
      mensaje.value = { tipo: 'ok', texto: 'Encontramos el lugar. Ajusta el pin si no queda justo donde va.' }
    } else {
      mensaje.value = { tipo: 'error', texto: 'No encontramos esa dirección. Mueve el pin en el mapa hasta el punto exacto.' }
    }
  } catch {
    mensaje.value = { tipo: 'error', texto: 'No se pudo buscar. Revisa tu conexión o mueve el pin en el mapa.' }
  } finally {
    buscando.value = false
  }
}

function usarMiUbicacion() {
  mensaje.value = null
  if (!navigator.geolocation) {
    mensaje.value = { tipo: 'error', texto: 'Este dispositivo no permite saber dónde estás.' }
    return
  }
  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      elegido.value = { lat: posicion.coords.latitude, lng: posicion.coords.longitude }
      mensaje.value = { tipo: 'ok', texto: 'Usamos tu ubicación actual. Ajusta el pin si hace falta.' }
    },
    () => {
      mensaje.value = { tipo: 'error', texto: 'No pudimos saber dónde estás. Revisa que hayas dado permiso de ubicación.' }
    },
    { enableHighAccuracy: true, timeout: 15000 }
  )
}
</script>

<template>
  <HojaModal
    :abierto="abierto"
    ancho="amplio"
    titulo="Ubicación del local"
    texto-guardar="Usar esta ubicación"
    sin-relleno
    :nivel="60"
    :cerrar-al-tocar-fuera="false"
    @cerrar="emit('cerrar')"
    @guardar="emit('usar', elegido)"
  >
    <div class="p-4 space-y-3">
      <div class="flex gap-2">
        <input
          v-model="consulta"
          type="search"
          aria-label="Buscar una dirección"
          placeholder="Buscar una dirección"
          class="campo-entrada min-w-0 flex-1"
          @keydown.enter.prevent="buscar"
        />
        <button
          type="button"
          aria-label="Buscar"
          :disabled="buscando || !consulta.trim()"
          class="w-12 shrink-0 flex items-center justify-center rounded-xl border border-brand-dark text-brand-dark disabled:opacity-50 active:scale-95"
          @click="buscar"
        >
          <Search class="w-5 h-5 stroke-2" aria-hidden="true" />
        </button>
      </div>
      <button type="button" class="w-full py-3 rounded-xl border border-brand-dark text-brand-dark font-bold flex items-center justify-center gap-2 active:scale-95" @click="usarMiUbicacion">
        <LocateFixed class="w-5 h-5 stroke-2" aria-hidden="true" /> Usar mi ubicación actual
      </button>
      <p
        v-if="mensaje"
        role="status"
        :class="['p-3 rounded-xl text-sm border', mensaje.tipo === 'ok' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-300 text-rose-800']"
      >{{ mensaje.texto }}</p>
    </div>

    <MapaPunto v-model="elegido" />

    <p class="p-4 text-sm text-gray-600">
      Toca el mapa o arrastra el pin hasta el punto exacto del local. Punto elegido: <span class="font-bold text-brand-dark">{{ textoCoordenadas(elegido) }}</span>
    </p>
  </HojaModal>
</template>
