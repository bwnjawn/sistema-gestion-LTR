<script setup lang="ts">
import { ref, watch } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { reservasDeFranja, type FranjaDisponibilidad } from '../../services/availability'
import { puntoDeEstado } from './estadoFranja'
import TarjetaReservaDia from './TarjetaReservaDia.vue'
import type { ReservationRequest } from '../../types/domain'

const props = defineProps<{
  franjas: FranjaDisponibilidad[]
  /** Solicitudes activas del día de los servicios mostrados. */
  reservas: ReservationRequest[]
  /** Fecha del día: al cambiar de día se pliega lo que estaba abierto. */
  fecha: string
  seCruza: (id: string) => boolean
}>()
defineEmits<{ (e: 'abrir', id: string): void }>()

const NOMBRE_SERVICIO: Record<string, string> = {
  cabana: 'Cabañas',
  restaurante: 'Restaurante',
  camping: 'Camping',
  piscina: 'Piscina'
}

const abierta = ref<string | null>(null)
watch(() => props.fecha, () => { abierta.value = null })

function llave(f: FranjaDisponibilidad): string {
  return f.servicio + f.clave
}

/** "Restaurante · Almuerzo"; las cabañas y la piscina llevan solo su nombre. */
function nombre(f: FranjaDisponibilidad): string {
  const servicio = NOMBRE_SERVICIO[f.servicio]
  return f.etiqueta === servicio ? servicio : `${servicio} · ${f.etiqueta}`
}

function cupo(f: FranjaDisponibilidad): string {
  if (f.capacidad > 0) return `${f.ocupado} de ${f.capacidad} ${f.unidad}`
  return f.ocupado > 0 ? `${f.ocupado} personas` : 'sin reservas'
}

/** Hay pendientes (o reservas que se topan) en esta fila; el detalle está en las reservas de abajo. */
function porResolver(f: FranjaDisponibilidad): boolean {
  return f.pendientes > 0 || f.estado === 'sobrecupo'
}

function alternar(f: FranjaDisponibilidad) {
  abierta.value = abierta.value === llave(f) ? null : llave(f)
}
</script>

<template>
  <div class="space-y-1.5">
    <span class="text-sm font-bold text-brand-accent block">Disponibilidad y reservas del día</span>
    <ul class="space-y-1.5">
      <li v-for="f in franjas" :key="llave(f)" class="space-y-1.5">
        <button
          type="button"
          @click="alternar(f)"
          :aria-expanded="abierta === llave(f)"
          class="w-full flex items-center gap-2 text-base bg-brand-light rounded-xl border border-brand-border px-3 py-2.5 text-left touch-target active:scale-[0.99] transition-transform"
        >
          <span class="w-3 h-3 rounded-full shrink-0" :class="puntoDeEstado(f.estado)" aria-hidden="true"></span>
          <span class="text-brand-dark font-bold">{{ nombre(f) }}</span>
          <span class="ml-auto text-right text-gray-700">{{ cupo(f) }}</span>
          <!-- Mismo punto que en el calendario: solo avisa que hay pendientes o reservas que se topan -->
          <span
            v-if="porResolver(f)"
            class="w-2.5 h-2.5 rounded-full bg-white border-2 border-amber-600 shrink-0"
            title="Hay pendientes por resolver"
            aria-hidden="true"
          ></span>
          <span v-if="porResolver(f)" class="sr-only">Hay pendientes por resolver</span>
          <ChevronDown class="w-4 h-4 text-brand-dark shrink-0 transition-transform" :class="abierta === llave(f) ? 'rotate-180' : ''" />
        </button>

        <div v-if="abierta === llave(f)" class="space-y-1.5 pl-1">
          <TarjetaReservaDia
            v-for="r in reservasDeFranja(f, reservas)"
            :key="r.id"
            :request="r"
            :se-cruza="seCruza(r.id)"
            @abrir="$emit('abrir', $event)"
          />
          <p v-if="reservasDeFranja(f, reservas).length === 0" class="text-center py-3 text-gray-700 text-base">
            Sin reservas en {{ nombre(f).toLowerCase() }} este día.
          </p>
        </div>
      </li>
    </ul>
  </div>
</template>
