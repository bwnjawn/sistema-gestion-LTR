<script setup lang="ts">
// Ajustes → Reglas de reservas: pagos y precios (abono, plazo, IVA, piscina) y cupos del camping.
// Los horarios y los cupos del restaurante están en el Catálogo (SCRUM-280).
import { ref } from 'vue'
import { formatCLP } from '../../../lib/format'
import { useSettingsStore } from '../../../stores/settingsStore'
import AjustesVolver from '../../../components/admin/AjustesVolver.vue'
import TarjetaAjuste from '../../../components/admin/TarjetaAjuste.vue'
import HojaModal from '../../../components/ui/HojaModal.vue'

const settingsStore = useSettingsStore()

// ---- Pagos y precios ----
const editandoPagos = ref(false)
const abono = ref(0)
const plazo = ref(0)
const iva = ref(0)
const precioPiscina = ref(0)

function abrirPagos() {
  abono.value = settingsStore.defaultDepositPercentage
  plazo.value = settingsStore.depositDeadlineHours
  iva.value = settingsStore.ivaPercentage
  precioPiscina.value = settingsStore.poolEntryPrice
  editandoPagos.value = true
}

async function guardarPagos() {
  const guardado = await settingsStore.updateParameters({
    defaultDepositPercentage: abono.value,
    depositDeadlineHours: Math.max(1, Number(plazo.value) || 1),
    ivaPercentage: iva.value,
    poolEntryPrice: Math.max(0, Math.round(Number(precioPiscina.value) || 0))
  })
  if (guardado) editandoPagos.value = false
}

// ---- Cupos del camping ----
const editandoCupos = ref(false)
const capacidadCamping = ref(0)
const margen = ref(0)

function abrirCupos() {
  capacidadCamping.value = settingsStore.capacityRules.maxCampingPeopleCapacity
  margen.value = settingsStore.marginPercentage
  editandoCupos.value = true
}

async function guardarCupos() {
  // El margen vive en los parámetros y también en las reglas de aforo: se guardan juntos para que no se desfasen
  const parametros = await settingsStore.updateParameters({ marginPercentage: margen.value })
  const reglas = await settingsStore.updateCapacityRules({
    maxCampingPeopleCapacity: capacidadCamping.value,
    marginPercentage: margen.value
  })
  if (parametros && reglas) editandoCupos.value = false
}
</script>

<template>
  <div class="space-y-4 max-w-md mx-auto w-full pb-20">
    <AjustesVolver />

    <TarjetaAjuste titulo="Pagos y precios" @editar="abrirPagos">
      <p class="flex justify-between gap-2"><span>Abono exigido</span><span class="font-bold text-brand-dark">{{ settingsStore.defaultDepositPercentage }}%</span></p>
      <p class="flex justify-between gap-2"><span>Plazo del abono</span><span class="font-bold text-brand-dark">{{ settingsStore.depositDeadlineHours }} horas</span></p>
      <p class="flex justify-between gap-2"><span>IVA</span><span class="font-bold text-brand-dark">{{ settingsStore.ivaPercentage }}%</span></p>
      <p class="flex justify-between gap-2"><span>Entrada a la piscina</span><span class="font-bold text-brand-dark">{{ formatCLP(settingsStore.poolEntryPrice) }}</span></p>
    </TarjetaAjuste>

    <TarjetaAjuste titulo="Cupos del camping" @editar="abrirCupos">
      <p class="flex justify-between gap-2"><span>Capacidad máxima</span><span class="font-bold text-brand-dark">{{ settingsStore.capacityRules.maxCampingPeopleCapacity }} personas</span></p>
      <p class="flex justify-between gap-2"><span>Margen de cupos</span><span class="font-bold text-brand-dark">{{ settingsStore.marginPercentage }}%</span></p>
    </TarjetaAjuste>

    <p class="text-sm text-gray-600 px-1">Los horarios y los cupos del restaurante se editan en Catálogo → Menú.</p>

    <HojaModal :abierto="editandoPagos" titulo="Pagos y precios" texto-guardar="Guardar" @cerrar="editandoPagos = false" @guardar="guardarPagos">
      <div>
        <label for="reg-abono" class="campo-etiqueta">Abono requerido (%)</label>
        <input id="reg-abono" v-model.number="abono" type="number" inputmode="numeric" min="0" max="100" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-plazo" class="campo-etiqueta">Plazo para abonar desde que llega la solicitud (horas)</label>
        <input id="reg-plazo" v-model.number="plazo" type="number" inputmode="numeric" min="1" max="720" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-iva" class="campo-etiqueta">IVA (%)</label>
        <input id="reg-iva" v-model.number="iva" type="number" inputmode="numeric" min="0" max="100" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-piscina" class="campo-etiqueta">Entrada a la piscina por persona ($, sin abono)</label>
        <input id="reg-piscina" v-model.number="precioPiscina" type="number" inputmode="numeric" min="0" max="1000000" class="campo-entrada" />
      </div>
    </HojaModal>

    <HojaModal :abierto="editandoCupos" titulo="Cupos del camping" texto-guardar="Guardar" @cerrar="editandoCupos = false" @guardar="guardarCupos">
      <div>
        <label for="reg-camping" class="campo-etiqueta">Capacidad máxima del camping (personas)</label>
        <input id="reg-camping" v-model.number="capacidadCamping" type="number" inputmode="numeric" min="1" max="1000" class="campo-entrada" />
      </div>
      <div>
        <label for="reg-margen" class="campo-etiqueta">Margen de cupos (%)</label>
        <input id="reg-margen" v-model.number="margen" type="number" inputmode="numeric" min="0" max="100" class="campo-entrada" />
      </div>
    </HojaModal>
  </div>
</template>
