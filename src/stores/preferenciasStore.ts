// src/stores/preferenciasStore.ts
// Preferencias de pantalla del dispositivo (SCRUM-276). Por ahora, el tamaño de la letra del administrador:
// "Normal" por defecto y "Grande" (todo +12,5 %). Solo se aplica con sesión de administrador; el cliente siempre ve
// el tamaño normal. El administrador lo cambia en el menú de su cuenta. Vale con sesión y en toda la zona `/admin`
// (así el inicio de sesión del administrador ya se ve en su tamaño).

import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { repositorios } from '../lib/repositories'
import { avisarError } from '../lib/avisos'
import { mensajeDeError } from '../lib/errores'
import { escalaDeLetra, TAMANO_DE_LETRA_INICIAL, type TamanoLetra } from '../services/preferencias'
import { useAuthStore } from './authStore'

export const usePreferenciasStore = defineStore('preferencias', () => {
  const tamanoLetra = ref<TamanoLetra>(TAMANO_DE_LETRA_INICIAL)
  /** La pantalla actual es de la zona del administrador (`/admin/…`, también el inicio de sesión). */
  const enAreaAdmin = ref(false)
  let pararVigilancia: (() => void) | null = null

  /** La escala que se aplica ahora a toda la página (vacía si no corresponde agrandar). */
  const escala = computed(() => escalaDeLetra(tamanoLetra.value, useAuthStore().isAuthenticated || enAreaAdmin.value))

  function definirAreaAdmin(valor: boolean): void {
    enAreaAdmin.value = valor
  }

  function aplicar(valor: string): void {
    if (typeof document !== 'undefined') document.documentElement.style.fontSize = valor
  }

  /** Lee lo guardado y deja la página al día cada vez que cambia el tamaño o la sesión. Se llama una vez al arrancar. */
  async function iniciar(): Promise<void> {
    try {
      tamanoLetra.value = await repositorios().preferencias.leerTamanoLetra()
    } catch (e) {
      console.warn('[Preferencias] No se pudo leer el tamaño de la letra:', e)
    }
    pararVigilancia?.()
    pararVigilancia = watch(escala, aplicar, { immediate: true })
  }

  async function cambiarTamanoLetra(tamano: TamanoLetra): Promise<void> {
    if (tamano === tamanoLetra.value) return
    const anterior = tamanoLetra.value
    tamanoLetra.value = tamano
    try {
      await repositorios().preferencias.guardarTamanoLetra(tamano)
    } catch (e) {
      // Se queda así mientras la app esté abierta; el aviso explica que no se recordará
      avisarError(mensajeDeError(e, 'No se pudo guardar el tamaño de la letra.'))
      console.warn('[Preferencias] No se pudo guardar:', e, 'antes:', anterior)
    }
  }

  return { tamanoLetra, enAreaAdmin, escala, iniciar, cambiarTamanoLetra, definirAreaAdmin }
})
