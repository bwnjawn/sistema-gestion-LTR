// src/lib/avisos.ts
// Aviso global de error: cuando algo no se pudo guardar, la pantalla lo dice (en vez de un `alert()`).
// Lo muestra `components/ui/AvisoErrores.vue`, montado una sola vez en `App.vue`.

import { ref } from 'vue'

export const avisoDeError = ref<string | null>(null)

export function avisarError(mensaje: string): void {
  avisoDeError.value = mensaje
}

export function descartarAviso(): void {
  avisoDeError.value = null
}
