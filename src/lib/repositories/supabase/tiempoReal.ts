// src/lib/repositories/supabase/tiempoReal.ts
// Avisos en tiempo real (Supabase Realtime) para el panel del administrador (SCRUM-273). Solo avisan DE QUE algo
// cambió: no traen los datos. Quien escucha vuelve a pedir la lista, así hay una sola forma de leer las solicitudes.
// Las reglas de acceso (RLS) valen también aquí: sin sesión de administrador no llega ningún aviso.

import { supabase } from '../../supabase'

/** Tablas cuyos cambios afectan a lo que ve el administrador (están en la publicación `supabase_realtime`). */
const TABLAS = ['reservas', 'pagos', 'reserva_comidas'] as const

let contador = 0

/**
 * Escucha los cambios de las reservas. `alCambiar` se llama por cada cambio y cada vez que la conexión en vivo
 * se establece (la primera vez y tras un corte), para no perder lo ocurrido mientras no había conexión.
 * Devuelve la función que deja de escuchar.
 */
export function escucharCambiosDeReservas(alCambiar: () => void): () => void {
  const cliente = supabase()
  // Un nombre distinto por suscripción: reusar uno que aún se está cerrando haría que no se cree el canal nuevo
  const canal = cliente.channel(`cambios-reservas-${++contador}`)
  for (const tabla of TABLAS) {
    canal.on('postgres_changes', { event: '*', schema: 'public', table: tabla }, () => alCambiar())
  }
  canal.subscribe(estado => {
    if (estado === 'SUBSCRIBED') alCambiar()
  })
  return () => {
    void cliente.removeChannel(canal)
  }
}
