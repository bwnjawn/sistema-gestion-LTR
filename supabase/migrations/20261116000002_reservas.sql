-- Reservas, comidas, ítems y pagos (SCRUM-248). Diseño: docs/supabase-esquema.md, secciones 3 y 6.
-- El público NO puede leer ni escribir estas tablas directamente: solo las funciones `crear_solicitud` y
-- `fechas_ocupadas` (siguiente migración) lo hacen, y solo el administrador accede por la API.

create sequence public.codigo_solicitud_seq;
create sequence public.codigo_admin_seq;

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  origen text not null check (origen in ('cliente', 'admin')),
  tipo public.tipo_servicio not null,
  estado public.estado_reserva not null default 'pending',

  cliente_nombre text not null,
  cliente_telefono text not null,
  cliente_correo text,
  tipo_cliente public.tipo_cliente,

  cabana_id uuid references public.cabanas,
  sitio_id uuid references public.sitios_camping,
  modalidad_camping public.modalidad_camping,
  fecha_inicio date not null,
  fecha_fin date not null,
  personas integer not null check (personas > 0),
  hora_entrada time,
  hora_salida time,
  comentarios text,

  subtotal integer not null,
  iva_porcentaje numeric(5, 2) not null,
  iva_monto integer not null,
  total integer not null,
  abono_porcentaje numeric(5, 2) not null,
  abono_exigido integer not null,
  abono_vence_en timestamptz,

  evento_especial boolean not null default false,
  grupo_id uuid,
  en_conflicto boolean not null default false,
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now(),

  check (fecha_fin >= fecha_inicio),
  check ((tipo = 'cabana') = (cabana_id is not null)),
  check ((tipo = 'camping') = (sitio_id is not null and modalidad_camping is not null)),
  check (tipo = 'restaurante' or tipo_cliente is null)
);

-- Dos confirmadas no pueden cruzarse en la misma cabaña, en [entrada, salida)
alter table public.reservas add constraint reservas_sin_cruce_cabana
  exclude using gist (cabana_id with =, daterange(fecha_inicio, fecha_fin, '[)') with &&)
  where (tipo = 'cabana' and estado = 'confirmed');

create index on public.reservas (estado, tipo, fecha_inicio);
create index on public.reservas (grupo_id) where grupo_id is not null;
create index on public.reservas (sitio_id) where sitio_id is not null;

create table public.reserva_comidas (
  reserva_id uuid not null references public.reservas on delete cascade,
  comida public.tipo_comida not null,
  hora time not null,
  primary key (reserva_id, comida)
);

create table public.reserva_items (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null,
  comida public.tipo_comida not null,
  plato_id uuid references public.platos on delete set null,
  nombre text not null,
  precio_unitario integer not null,
  cantidad integer not null check (cantidad > 0),
  acompanamiento_fijo text,
  acompanamientos jsonb not null default '{}',
  foreign key (reserva_id, comida) references public.reserva_comidas (reserva_id, comida) on delete cascade
);
create index on public.reserva_items (reserva_id, comida);
create index on public.reserva_items (plato_id) where plato_id is not null;

create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references public.reservas on delete cascade,
  monto integer not null check (monto > 0),
  medio public.medio_pago not null,
  pagado_el date not null,
  notas text,
  registrado_por uuid references auth.users on delete set null,
  creado_en timestamptz not null default now()
);
create index on public.pagos (reserva_id);
create index on public.pagos (registrado_por) where registrado_por is not null;

-- Código SOL-00001 / ADM-00001: lo asigna la base al insertar, nunca el cliente
create function private.asignar_codigo_reserva() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := case new.origen
      when 'admin' then 'ADM-' || lpad(nextval('public.codigo_admin_seq')::text, 5, '0')
      else 'SOL-' || lpad(nextval('public.codigo_solicitud_seq')::text, 5, '0')
    end;
  end if;
  return new;
end;
$$;

create function private.tocar_actualizada_en() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.actualizada_en := now();
  return new;
end;
$$;

create trigger asignar_codigo before insert on public.reservas
  for each row execute function private.asignar_codigo_reserva();
create trigger tocar_actualizada_en before update on public.reservas
  for each row execute function private.tocar_actualizada_en();

-- Seguridad: solo el administrador accede; el público no tiene ningún permiso sobre estas tablas
alter table public.reservas enable row level security;
alter table public.reserva_comidas enable row level security;
alter table public.reserva_items enable row level security;
alter table public.pagos enable row level security;

revoke all on public.reservas, public.reserva_comidas, public.reserva_items, public.pagos from anon;
revoke all on sequence public.codigo_solicitud_seq, public.codigo_admin_seq from anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['reservas', 'reserva_comidas', 'reserva_items', 'pagos'] loop
    execute format('create policy "admin_lee" on public.%I for select to authenticated using ((select private.es_admin()))', t);
    execute format('create policy "admin_inserta" on public.%I for insert to authenticated with check ((select private.es_admin()))', t);
    execute format('create policy "admin_actualiza" on public.%I for update to authenticated using ((select private.es_admin())) with check ((select private.es_admin()))', t);
    execute format('create policy "admin_elimina" on public.%I for delete to authenticated using ((select private.es_admin()))', t);
  end loop;
end $$;
