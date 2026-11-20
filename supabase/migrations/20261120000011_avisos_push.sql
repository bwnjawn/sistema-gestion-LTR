-- Avisos push de solicitudes nuevas a los administradores (SCRUM-68). Diseño: docs/specs/SCRUM-68.md.
--  - `suscripciones_push`: un dispositivo de un administrador que activó los avisos. Cada administrador solo ve y
--    borra las suyas (se registran con `registrar_suscripcion_push`); la función que envía los avisos las lee con la clave de servicio.
--  - `reservas.aviso_push_en`: marca que ya se avisó de esa solicitud. Hace el aviso idempotente: una solicitud
--    avisa una sola vez aunque alguien llame dos veces a la función.
--  - Un disparador llama a la Edge Function `avisar-solicitud` al crearse una solicitud del cliente (pg_net).

create extension if not exists pg_net with schema extensions;

create table public.suscripciones_push (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  agente text,
  creada_en timestamptz not null default now()
);
create index on public.suscripciones_push (admin_id);

alter table public.suscripciones_push enable row level security;
revoke all on public.suscripciones_push from anon;

create policy "admin_lee_las_suyas" on public.suscripciones_push for select to authenticated
  using ((select private.es_admin()) and admin_id = (select auth.uid()));
create policy "admin_elimina_las_suyas" on public.suscripciones_push for delete to authenticated
  using ((select private.es_admin()) and admin_id = (select auth.uid()));

-- Registrar un dispositivo: si ya estaba a nombre de otro administrador (teléfono compartido), pasa al actual.
create function public.registrar_suscripcion_push(p_endpoint text, p_p256dh text, p_auth text, p_agente text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if not (select private.es_admin()) then
    raise exception 'no_autorizado: solo un administrador puede activar los avisos';
  end if;
  insert into public.suscripciones_push (admin_id, endpoint, p256dh, auth, agente)
  values ((select auth.uid()), p_endpoint, p_p256dh, p_auth, p_agente)
  on conflict (endpoint) do update
    set admin_id = excluded.admin_id, p256dh = excluded.p256dh, auth = excluded.auth, agente = excluded.agente;
end;
$$;
revoke all on function public.registrar_suscripcion_push(text, text, text, text) from public, anon;
grant execute on function public.registrar_suscripcion_push(text, text, text, text) to authenticated;

alter table public.reservas add column aviso_push_en timestamptz;

-- Solo las solicitudes que crea el cliente avisan: lo que el administrador registra él mismo no.
create function private.avisar_solicitud_nueva() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.origen = 'cliente' then
    perform net.http_post(
      url := 'https://shzeaodsshckniadugof.supabase.co/functions/v1/avisar-solicitud',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('reserva_id', new.id)
    );
  end if;
  return new;
exception when others then
  -- Un fallo al avisar nunca debe impedir que la solicitud se guarde
  raise warning 'No se pudo pedir el aviso push de %: %', new.codigo, sqlerrm;
  return new;
end;
$$;
revoke all on function private.avisar_solicitud_nueva() from public, anon, authenticated;

create trigger avisar_solicitud_nueva after insert on public.reservas
  for each row execute function private.avisar_solicitud_nueva();
