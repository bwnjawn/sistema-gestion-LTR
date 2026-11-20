// Edge Function `avisar-solicitud` (SCRUM-68): envía un aviso push a los administradores cuando llega una solicitud
// del cliente. La llama el disparador `avisar_solicitud_nueva` (migración 11) con { reserva_id }.
//
// Seguridad: se despliega sin verificar JWT (la llama la base, no un usuario), pero no se puede abusar de ella:
// el cuerpo solo trae un id de reserva, los datos salen de la base y cada reserva avisa UNA sola vez
// (`aviso_push_en` se marca de forma atómica antes de enviar).
//
// Secretos necesarios (Edge Functions → Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_ASUNTO.
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase.

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'
import { armarAviso } from './mensaje.ts'

const cliente = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false }
})

webpush.setVapidDetails(
  Deno.env.get('VAPID_ASUNTO') ?? 'mailto:avisos@example.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

const respuesta = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } })

Deno.serve(async req => {
  if (req.method !== 'POST') return respuesta({ error: 'método no permitido' }, 405)

  let reservaId: unknown
  try {
    reservaId = (await req.json()).reserva_id
  } catch {
    return respuesta({ error: 'cuerpo inválido' }, 400)
  }
  if (typeof reservaId !== 'string' || !/^[0-9a-f-]{36}$/i.test(reservaId)) return respuesta({ error: 'reserva_id inválido' }, 400)

  // Marcar y leer en un solo paso: si otra llamada ya la marcó, no devuelve filas y no se avisa dos veces
  const { data: reserva, error } = await cliente
    .from('reservas')
    .update({ aviso_push_en: new Date().toISOString() })
    .eq('id', reservaId)
    .eq('origen', 'cliente')
    .is('aviso_push_en', null)
    .select('id, codigo, tipo, cliente_nombre, fecha_inicio, fecha_fin, personas')
    .maybeSingle()
  if (error) return respuesta({ error: error.message }, 500)
  if (!reserva) return respuesta({ enviados: 0, motivo: 'ya avisada o no corresponde' })

  const aviso = armarAviso({
    id: reserva.id,
    codigo: reserva.codigo,
    tipo: reserva.tipo,
    clienteNombre: reserva.cliente_nombre,
    fechaInicio: reserva.fecha_inicio,
    fechaFin: reserva.fecha_fin,
    personas: reserva.personas
  })

  const { data: suscripciones, error: errorLectura } = await cliente.from('suscripciones_push').select('id, endpoint, p256dh, auth')
  if (errorLectura) return respuesta({ error: errorLectura.message }, 500)

  const caducadas: string[] = []
  let enviados = 0
  await Promise.all(
    (suscripciones ?? []).map(async s => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(aviso),
          { TTL: 60 * 60 * 24, urgency: 'high' }
        )
        enviados++
      } catch (e) {
        // 404 y 410: el dispositivo ya no existe (desinstaló la app o revocó el permiso). Se limpia solo.
        const estado = (e as { statusCode?: number }).statusCode
        if (estado === 404 || estado === 410) caducadas.push(s.id)
        else console.warn('No se pudo avisar a un dispositivo:', estado, (e as Error).message)
      }
    })
  )
  if (caducadas.length) await cliente.from('suscripciones_push').delete().in('id', caducadas)

  return respuesta({ enviados, caducadas: caducadas.length })
})
