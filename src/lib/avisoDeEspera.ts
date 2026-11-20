// src/lib/avisoDeEspera.ts
// Marca cuándo una carga lleva demasiado: pasados 8 segundos se avisa "Está tardando más de lo normal" y se deja
// reintentar, sin quitar el esqueleto (SCRUM-258). Se reinicia cada vez que una carga nueva empieza.

import { onScopeDispose, ref, watch, type Ref } from 'vue'

export const ESPERA_AVISO_CARGA_MS = 8000

export function useAvisoDeEspera(cargando: Ref<boolean>, milisegundos = ESPERA_AVISO_CARGA_MS) {
  const tardando = ref(false)
  let temporizador: ReturnType<typeof setTimeout> | null = null

  function parar(): void {
    if (temporizador) clearTimeout(temporizador)
    temporizador = null
  }

  watch(
    cargando,
    estaCargando => {
      parar()
      tardando.value = false
      if (estaCargando) temporizador = setTimeout(() => { tardando.value = true }, milisegundos)
    },
    { immediate: true }
  )
  onScopeDispose(parar)

  return { tardando }
}
