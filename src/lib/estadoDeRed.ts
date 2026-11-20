// src/lib/estadoDeRed.ts
// Si el servidor responde o no, según lo que pasó de verdad en el último pedido (SCRUM-250). Es más fiable que
// `navigator.onLine`, que en iPhone puede decir "conectado" sin estarlo. Lo marcan los pedidos a Supabase.

import { ref } from 'vue'

/** El último pedido al servidor falló por red. Se limpia en cuanto uno funciona. */
export const servidorInalcanzable = ref(false)

export function marcarServidorCaido(): void {
  servidorInalcanzable.value = true
}

export function marcarServidorActivo(): void {
  servidorInalcanzable.value = false
}
