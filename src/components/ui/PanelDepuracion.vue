<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// Panel temporal para medir el desfase de las barras fijas en iPhone (ver README de la
// sesión). Se activa con ?debug=1 en la URL, o tocando con tres dedos a la vez en
// cualquier pantalla (sirve en la app instalada). ?debug=0 o tres dedos de nuevo lo apaga.
const CLAVE = 'ltr_debug'
const visible = ref(false)
const lineas = ref<string[]>([])
const eventos = ref<string[]>([])
const maxHueco = ref(0)
const inicio = Date.now()

function leerPreferencia(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('debug')
    if (param === '1') localStorage.setItem(CLAVE, '1')
    if (param === '0') localStorage.removeItem(CLAVE)
    return localStorage.getItem(CLAVE) === '1'
  } catch {
    return false
  }
}

function guardar(valor: boolean) {
  visible.value = valor
  try {
    if (valor) localStorage.setItem(CLAVE, '1')
    else localStorage.removeItem(CLAVE)
  } catch {
    // Sin almacenamiento: solo dura esta sesión
  }
}

function registrar(texto: string) {
  const t = ((Date.now() - inicio) / 1000).toFixed(1)
  eventos.value = [`${t}s ${texto}`, ...eventos.value].slice(0, 7)
}

const n = (v: number) => (Math.round(v * 10) / 10).toString()

function medir() {
  const vv = window.visualViewport
  const barra = document.querySelector('.barra-fija-inferior') as HTMLElement | null
  const rect = barra?.getBoundingClientRect()
  const enc = (document.querySelector('.encabezado-fijo') as HTMLElement | null)?.getBoundingClientRect()
  // Altura de la zona segura inferior
  const sonda = document.createElement('div')
  sonda.style.cssText = 'position:fixed;left:0;bottom:0;width:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden'
  document.body.appendChild(sonda)
  const zonaSegura = sonda.offsetHeight
  sonda.remove()

  const hueco = rect ? window.innerHeight - rect.bottom : NaN
  if (!Number.isNaN(hueco)) maxHueco.value = Math.max(maxHueco.value, hueco)

  const filas = [
    `inner ${window.innerWidth}x${window.innerHeight}`,
    `screen ${screen.width}x${screen.height}`,
    `docElem.clientH ${document.documentElement.clientHeight}`,
    vv ? `vv h=${n(vv.height)} w=${n(vv.width)} scale=${Math.round(vv.scale * 1000) / 1000}` : 'vv: no disponible',
    vv ? `vv offsetTop=${n(vv.offsetTop)} pageTop=${n(vv.pageTop)}` : '',
    `scrollY=${n(window.scrollY)} docH=${document.documentElement.scrollHeight}`,
    `scrollX=${n(window.scrollX)} docW=${document.documentElement.scrollWidth} vv.left=${vv ? n(vv.offsetLeft) : '-'}`,
    `zonaSegura=${zonaSegura}`,
    `standalone=${(navigator as any).standalone === true || matchMedia('(display-mode: standalone)').matches}`,
    rect ? `barra top=${n(rect.top)} bottom=${n(rect.bottom)} h=${n(rect.height)}` : 'barra: no hay',
    rect ? `HUECO bajo barra=${n(hueco)} (máx ${n(maxHueco.value)})` : '',
    enc ? `encabezado top=${n(enc.top)} bottom=${n(enc.bottom)} (arriba visible=${vv ? n(enc.top - vv.offsetTop) : '-'})` : 'encabezado: no hay',
    vv && rect ? `hueco vs vv=${n(vv.height + vv.offsetTop - rect.bottom)}` : '',
    `ajuste aplicado=${getComputedStyle(document.documentElement).getPropertyValue('--vv-offset-y') || '0px'}`,
    `activo=${document.activeElement?.tagName ?? '-'}`
  ]
  lineas.value = filas.filter(Boolean)
}

let temporizador: ReturnType<typeof setInterval> | undefined

function alTocar(e: TouchEvent) {
  if (e.touches.length === 3) guardar(!visible.value)
}

const escuchas: Array<[EventTarget, string, EventListener]> = []
function escuchar(objetivo: EventTarget | null | undefined, tipo: string, fn: EventListener) {
  if (!objetivo) return
  objetivo.addEventListener(tipo, fn, { passive: true } as AddEventListenerOptions)
  escuchas.push([objetivo, tipo, fn])
}

onMounted(() => {
  visible.value = leerPreferencia()
  escuchar(document, 'touchstart', alTocar as EventListener)
  escuchar(document, 'focusin', () => registrar('focusin'))
  escuchar(document, 'focusout', () => registrar('focusout'))
  escuchar(window, 'resize', () => registrar(`resize ${window.innerWidth}x${window.innerHeight}`))
  escuchar(window.visualViewport, 'resize', () => registrar(`vv.resize h=${n(window.visualViewport!.height)}`))
  escuchar(window, 'ltr:viewport', ((e: CustomEvent) => registrar(e.detail)) as EventListener)
  escuchar(window.visualViewport, 'scroll', () => registrar(`vv.scroll top=${n(window.visualViewport!.offsetTop)}`))
  temporizador = setInterval(() => { if (visible.value) medir() }, 250)
})

onBeforeUnmount(() => {
  clearInterval(temporizador)
  escuchas.forEach(([o, t, f]) => o.removeEventListener(t, f))
})
</script>

<template>
  <div
    v-if="visible"
    class="fixed left-1 z-[100] max-w-[92vw] rounded-lg bg-black/80 text-white p-2 font-mono text-[11px] leading-snug pointer-events-none"
    style="top: calc(env(safe-area-inset-top, 0px) + 4px)"
    aria-hidden="true"
  >
    <p v-for="(l, i) in lineas" :key="'l' + i">{{ l }}</p>
    <p class="mt-1 text-emerald-300">Eventos:</p>
    <p v-for="(e, i) in eventos" :key="'e' + i" class="text-emerald-200">{{ e }}</p>
    <p class="mt-1 text-gray-300">Tres dedos a la vez para cerrar</p>
  </div>
</template>
