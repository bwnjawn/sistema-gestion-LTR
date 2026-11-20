import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Solo la URL y la clave pública (publishable). La clave secreta no debe estar nunca en el front.
const supabaseUrl: string | undefined = import.meta.env.VITE_SUPABASE_URL
const supabaseClavePublica: string | undefined = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** Hay una URL y una clave reales (no los marcadores de `.env.example`). Sin ellas la app usa el almacenamiento local. */
// Las pruebas (modo `test`) nunca usan la base real, aunque `.env` esté completo, salvo las de integración, que
// se activan a propósito con `VITE_PROBAR_SUPABASE=1` (ver tests/integracion).
export const supabaseConfigurado: boolean =
  (import.meta.env.MODE !== 'test' || import.meta.env.VITE_PROBAR_SUPABASE === '1') &&
  !!supabaseUrl &&
  !!supabaseClavePublica &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl)

let cliente: SupabaseClient | null = null

/** El cliente de Supabase, creado la primera vez que se pide. Lanza si falta la configuración. */
export function supabase(): SupabaseClient {
  if (!supabaseConfigurado || !supabaseUrl || !supabaseClavePublica) {
    throw new Error('Supabase no está configurado: completa VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en .env.')
  }
  if (!cliente) {
    cliente = createClient(supabaseUrl, supabaseClavePublica, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
      // Sin señal, supabase-js reintenta cada lectura 3 veces (1 s + 2 s + 4 s) antes de fallar y la app tardaría
      // 7 s en abrir con la copia guardada. La app ya reintenta sola (cola de envío y actualización al volver).
      db: { retry: false }
    })
  }
  return cliente
}
