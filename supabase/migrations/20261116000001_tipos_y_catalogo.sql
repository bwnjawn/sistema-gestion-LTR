-- Tipos, catálogo, ajustes y administradores (SCRUM-248).
-- Diseño: docs/supabase-esquema.md. Todas las tablas llevan RLS: el público (clave anónima) solo lee
-- lo activo del catálogo y los ajustes públicos; el administrador (fila en perfiles_admin) puede todo.

create extension if not exists btree_gist with schema extensions;

-- 1. Tipos enumerados (mismos valores que src/types/domain.ts)
create type public.tipo_servicio as enum ('cabana', 'camping', 'restaurante', 'piscina');
create type public.estado_reserva as enum ('pending', 'confirmed', 'rejected', 'cancelled');
create type public.modalidad_camping as enum ('diario', 'pernoctar');
create type public.tipo_comida as enum ('desayuno', 'almuerzo', 'once');
create type public.tipo_cliente as enum ('Particular', 'Empresa', 'Organización', 'Paseo escolar', 'Institución');
create type public.medio_pago as enum ('transferencia', 'efectivo', 'debito');
create type public.modo_acompanamiento as enum ('none', 'fixed', 'choice');
create type public.rol_admin as enum ('owner', 'admin', 'staff');

-- 2. Administradores (las contraseñas las guarda Supabase Auth)
create table public.perfiles_admin (
  id uuid primary key references auth.users on delete cascade,
  nombre text,
  rol public.rol_admin not null default 'admin',
  creado_en timestamptz not null default now()
);

-- Funciones de apoyo para las políticas. Viven en el esquema `private`, que la API no expone.
create schema if not exists private;
grant usage on schema private to anon, authenticated;

create function private.es_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.perfiles_admin where id = (select auth.uid())) $$;

create function private.es_owner() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.perfiles_admin where id = (select auth.uid()) and rol = 'owner') $$;

revoke all on function private.es_admin() from public;
revoke all on function private.es_owner() from public;
grant execute on function private.es_admin() to anon, authenticated;
grant execute on function private.es_owner() to anon, authenticated;

-- 3. Catálogo
create table public.cabanas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  capacidad integer not null check (capacidad > 0),
  precio_noche integer not null check (precio_noche >= 0),
  camas text,
  descripcion text,
  imagen_principal text,
  imagenes text[] not null default '{}',
  caracteristicas jsonb not null default '[]',
  en_mantencion boolean not null default false,
  activo boolean not null default true,
  creada_en timestamptz not null default now()
);

create table public.sitios_camping (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio_persona integer not null check (precio_persona >= 0),
  capacidad_min integer not null check (capacidad_min >= 1),
  capacidad_max integer not null,
  es_especial boolean not null default false,
  modalidades public.modalidad_camping[] not null,
  imagen_principal text,
  imagenes text[] not null default '{}',
  caracteristicas text[] not null default '{}',
  activo boolean not null default true,
  check (capacidad_max >= capacidad_min)
);

create table public.platos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio integer not null check (precio >= 0),
  descripcion text,
  comida public.tipo_comida not null,
  modo_acompanamiento public.modo_acompanamiento not null default 'none',
  acompanamiento_fijo text,
  imagen text,
  activo boolean not null default true
);

create table public.acompanamientos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true
);

create table public.plato_acompanamientos (
  plato_id uuid not null references public.platos on delete cascade,
  acompanamiento_id uuid not null references public.acompanamientos,
  primary key (plato_id, acompanamiento_id)
);
create index on public.plato_acompanamientos (acompanamiento_id);

create table public.espacios_restaurante (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  capacidad integer not null check (capacidad > 0),
  activo boolean not null default true
);

-- 4. Ajustes: una fila por clave, el valor es un jsonb que tipa la app
create table public.ajustes (
  clave text primary key,
  valor jsonb not null,
  actualizado_en timestamptz not null default now()
);

-- 5. Seguridad (RLS)
alter table public.perfiles_admin enable row level security;
create policy "lee_su_perfil_o_owner" on public.perfiles_admin for select to authenticated
  using (id = (select auth.uid()) or (select private.es_owner()));
create policy "owner_inserta" on public.perfiles_admin for insert to authenticated
  with check ((select private.es_owner()));
create policy "owner_actualiza" on public.perfiles_admin for update to authenticated
  using ((select private.es_owner())) with check ((select private.es_owner()));
create policy "owner_elimina" on public.perfiles_admin for delete to authenticated
  using ((select private.es_owner()));

-- Catálogo con borrado lógico: el público ve lo activo; el administrador ve y edita todo
do $$
declare t text;
begin
  foreach t in array array['cabanas', 'sitios_camping', 'platos', 'acompanamientos', 'espacios_restaurante'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "lectura_publica_activos" on public.%I for select to anon, authenticated using (activo or (select private.es_admin()))', t);
    execute format('create policy "admin_inserta" on public.%I for insert to authenticated with check ((select private.es_admin()))', t);
    execute format('create policy "admin_actualiza" on public.%I for update to authenticated using ((select private.es_admin())) with check ((select private.es_admin()))', t);
    execute format('create policy "admin_elimina" on public.%I for delete to authenticated using ((select private.es_admin()))', t);
  end loop;
end $$;

alter table public.plato_acompanamientos enable row level security;
create policy "lectura_publica" on public.plato_acompanamientos for select to anon, authenticated using (true);
create policy "admin_inserta" on public.plato_acompanamientos for insert to authenticated with check ((select private.es_admin()));
create policy "admin_actualiza" on public.plato_acompanamientos for update to authenticated using ((select private.es_admin())) with check ((select private.es_admin()));
create policy "admin_elimina" on public.plato_acompanamientos for delete to authenticated using ((select private.es_admin()));

-- Ajustes: el público solo lee las claves que necesita el flujo del cliente
alter table public.ajustes enable row level security;
create policy "lectura_publica_de_claves_permitidas" on public.ajustes for select to anon, authenticated
  using (
    clave in ('contacto', 'transferencia', 'parametros', 'horarios_restaurante', 'horarios_camping', 'horarios_cabana', 'limites_aforo')
    or (select private.es_admin())
  );
create policy "admin_inserta" on public.ajustes for insert to authenticated with check ((select private.es_admin()));
create policy "admin_actualiza" on public.ajustes for update to authenticated using ((select private.es_admin())) with check ((select private.es_admin()));
create policy "admin_elimina" on public.ajustes for delete to authenticated using ((select private.es_admin()));
