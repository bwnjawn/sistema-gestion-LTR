-- Aforo, disponibilidad pública y envío de solicitudes (SCRUM-248). Diseño: docs/supabase-esquema.md, sección 6.
--
-- El público no lee la tabla `reservas`. Para el flujo del cliente existen dos funciones (se llaman con
-- `supabase.rpc`):
--   fechas_ocupadas(desde, hasta)  -> solo agregados confirmados, sin datos personales.
--   crear_solicitud(p jsonb)       -> valida, recalcula precio y abono en el servidor y registra la solicitud.
-- Los límites de aforo salen de `ajustes.parametros.capacityRules` (lo mismo que usa la app).
--
-- Contrato de `crear_solicitud(p)`. Todas las claves en español y snake_case:
--   id (uuid, opcional)    el cliente lo genera: reenviar la misma solicitud no la duplica (modo sin conexión)
--   tipo                   'cabana' | 'camping' | 'restaurante' | 'piscina'
--   cliente_nombre, cliente_telefono, cliente_correo (opcional), tipo_cliente (solo restaurante)
--   fecha_inicio, fecha_fin (yyyy-mm-dd), personas, comentarios (opcional)
--   cabana_id | sitio_id + modalidad_camping
--   comidas: [{ comida, hora }]  e  items: [{ comida, plato_id, cantidad, acompanamiento_fijo?, acompanamientos? }]
-- Devuelve { id, codigo, estado, total, abono_exigido, abono_vence_en }. Los errores empiezan con un código
-- estable ("fecha_no_disponible: ...") para que la app los traduzca.

-- 1. Lectura de ajustes y aforo
create function private.parametro(ruta text[], defecto numeric) returns numeric
language sql stable security definer set search_path = ''
as $$ select coalesce((select (valor #>> ruta)::numeric from public.ajustes where clave = 'parametros'), defecto) $$;

create function private.aforo_restaurante() returns integer
language sql stable security definer set search_path = ''
as $$
  select coalesce(
    (select sum((e ->> 'capacidad')::integer)::integer
       from public.ajustes a, jsonb_array_elements(a.valor #> '{capacityRules,restaurantSpaces}') e
      where a.clave = 'parametros'),
    200)
$$;

create function private.aforo_camping() returns integer
language sql stable security definer set search_path = ''
as $$ select private.parametro(array['capacityRules', 'maxCampingPeopleCapacity'], 150)::integer $$;

-- Días que ocupa una reserva de camping: el diario, solo el día; pernoctar, cada noche [entrada, salida)
create function private.dias_camping(modalidad public.modalidad_camping, inicio date, fin date) returns setof date
language sql immutable set search_path = ''
as $$
  select d::date
    from generate_series(
      inicio::timestamp,
      (case when modalidad = 'diario' then inicio else greatest(inicio, fin - 1) end)::timestamp,
      interval '1 day') d
$$;

-- 2. Aforo de las confirmadas: restaurante por comida y día, camping por modalidad y día
create function private.validar_aforo(p_reserva uuid) returns void
language plpgsql security definer set search_path = ''
as $$
declare
  r public.reservas;
  exceso record;
begin
  select * into r from public.reservas where id = p_reserva;
  if not found or r.estado <> 'confirmed' then
    return;
  end if;

  if r.tipo = 'restaurante' then
    perform pg_advisory_xact_lock(hashtext('aforo_restaurante'));
    select rc.comida, sum(x.personas) as total into exceso
      from public.reserva_comidas rc
      join public.reserva_comidas rc2 on rc2.comida = rc.comida
      join public.reservas x on x.id = rc2.reserva_id
       and x.tipo = 'restaurante' and x.estado = 'confirmed' and x.fecha_inicio = r.fecha_inicio
     where rc.reserva_id = r.id
     group by rc.comida
    having sum(x.personas) > private.aforo_restaurante()
     limit 1;
    if found then
      raise exception 'aforo_excedido: el restaurante no tiene cupo para % el %', exceso.comida, r.fecha_inicio
        using errcode = '23P01';
    end if;

  elsif r.tipo = 'camping' then
    perform pg_advisory_xact_lock(hashtext('aforo_camping'));
    select dias.d as dia, sum(x.personas) as total into exceso
      from private.dias_camping(r.modalidad_camping, r.fecha_inicio, r.fecha_fin) as dias(d)
      join public.reservas x on x.tipo = 'camping' and x.estado = 'confirmed' and x.modalidad_camping = r.modalidad_camping
      join lateral private.dias_camping(x.modalidad_camping, x.fecha_inicio, x.fecha_fin) as xd(d) on xd.d = dias.d
     group by dias.d
    having sum(x.personas) > private.aforo_camping()
     limit 1;
    if found then
      raise exception 'aforo_excedido: el camping no tiene cupo el %', exceso.dia
        using errcode = '23P01';
    end if;
  end if;
end;
$$;

create function private.trg_validar_aforo_reserva() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.validar_aforo(new.id);
  return null;
end;
$$;

create function private.trg_validar_aforo_comida() returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.validar_aforo(new.reserva_id);
  return null;
end;
$$;

create trigger validar_aforo after insert or update of estado, personas, fecha_inicio, fecha_fin, modalidad_camping
  on public.reservas for each row
  when (new.estado = 'confirmed' and new.tipo in ('restaurante', 'camping'))
  execute function private.trg_validar_aforo_reserva();

-- El restaurante guarda sus comidas después de la reserva: también se valida al agregarlas o cambiarlas
create trigger validar_aforo after insert or update on public.reserva_comidas
  for each row execute function private.trg_validar_aforo_comida();

-- 3. Fechas ocupadas (público): solo reservas confirmadas, sin datos personales ni la piscina
create function public.fechas_ocupadas(desde date, hasta date) returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if desde is null or hasta is null or hasta < desde then
    raise exception 'rango_invalido: la fecha final debe ser posterior a la inicial';
  end if;
  if hasta - desde > 800 then
    raise exception 'rango_invalido: el rango no puede superar 800 días';
  end if;

  return jsonb_build_object(
    'cabanas', coalesce((
      select jsonb_agg(jsonb_build_object('cabinId', t.cabana_id, 'noche', t.noche) order by t.noche, t.cabana_id)
        from (
          select r.cabana_id, d::date as noche
            from public.reservas r
            cross join lateral generate_series(
              greatest(r.fecha_inicio, desde)::timestamp, least(r.fecha_fin - 1, hasta)::timestamp, interval '1 day') d
           where r.tipo = 'cabana' and r.estado = 'confirmed' and r.fecha_inicio <= hasta and r.fecha_fin > desde
        ) t), '[]'::jsonb),
    'restaurante', coalesce((
      select jsonb_agg(jsonb_build_object('dia', t.dia, 'tipo', t.comida, 'personas', t.personas) order by t.dia, t.comida)
        from (
          select r.fecha_inicio as dia, rc.comida, sum(r.personas)::integer as personas
            from public.reservas r
            join public.reserva_comidas rc on rc.reserva_id = r.id
           where r.tipo = 'restaurante' and r.estado = 'confirmed' and r.fecha_inicio between desde and hasta
           group by r.fecha_inicio, rc.comida
        ) t), '[]'::jsonb),
    'camping', coalesce((
      select jsonb_agg(jsonb_build_object('dia', t.dia, 'tipo', t.modalidad, 'personas', t.personas) order by t.dia, t.modalidad)
        from (
          select d.d as dia, r.modalidad_camping as modalidad, sum(r.personas)::integer as personas
            from public.reservas r
            cross join lateral private.dias_camping(r.modalidad_camping, r.fecha_inicio, r.fecha_fin) as d(d)
           where r.tipo = 'camping' and r.estado = 'confirmed' and d.d between desde and hasta
           group by d.d, r.modalidad_camping
        ) t), '[]'::jsonb)
  );
end;
$$;

-- 4. Crear solicitud (público)
create function public.crear_solicitud(p jsonb) returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_hoy date := (now() at time zone 'America/Santiago')::date;
  v_id uuid;
  v_tipo public.tipo_servicio;
  v_nombre text;
  v_telefono text;
  v_correo text;
  v_tipo_cliente public.tipo_cliente;
  v_inicio date;
  v_fin date;
  v_personas integer;
  v_comentarios text;
  v_cabana public.cabanas;
  v_sitio public.sitios_camping;
  v_plato public.platos;
  v_modalidad public.modalidad_camping;
  v_estado public.estado_reserva := 'pending';
  v_subtotal integer := 0;
  v_iva_pct numeric := 0;
  v_dep_pct numeric := 0;
  v_plazo numeric;
  v_iva integer := 0;
  v_total integer;
  v_abono integer := 0;
  v_vence timestamptz;
  v_hora_ent time;
  v_hora_sal time;
  v_noches integer;
  v_existente public.reservas;
  v_nueva public.reservas;
  v_comida jsonb;
  v_item jsonb;
  v_comida_t public.tipo_comida;
  v_cantidad integer;
  v_dia date;
  v_ya integer;
begin
  if p is null or jsonb_typeof(p) <> 'object' then
    raise exception 'dato_invalido: la solicitud está vacía';
  end if;

  -- Reenvío de la misma solicitud (modo sin conexión): se devuelve la que ya existe
  v_id := coalesce(nullif(p ->> 'id', '')::uuid, gen_random_uuid());
  select * into v_existente from public.reservas where id = v_id;
  if found then
    if v_existente.origen <> 'cliente' then
      raise exception 'dato_invalido: identificador no válido';
    end if;
    return jsonb_build_object('id', v_existente.id, 'codigo', v_existente.codigo, 'estado', v_existente.estado,
      'total', v_existente.total, 'abono_exigido', v_existente.abono_exigido, 'abono_vence_en', v_existente.abono_vence_en);
  end if;

  -- Datos generales
  v_tipo := (p ->> 'tipo')::public.tipo_servicio;
  v_nombre := btrim(coalesce(p ->> 'cliente_nombre', ''));
  v_telefono := btrim(coalesce(p ->> 'cliente_telefono', ''));
  v_correo := nullif(btrim(coalesce(p ->> 'cliente_correo', '')), '');
  v_comentarios := nullif(btrim(coalesce(p ->> 'comentarios', '')), '');
  v_inicio := (p ->> 'fecha_inicio')::date;
  v_fin := coalesce((p ->> 'fecha_fin')::date, v_inicio);
  v_personas := (p ->> 'personas')::integer;

  if v_nombre = '' or length(v_nombre) > 120 then
    raise exception 'dato_invalido: falta el nombre';
  end if;
  if regexp_replace(v_telefono, '\D', '', 'g') !~ '^\d{8,15}$' then
    raise exception 'dato_invalido: el teléfono no es válido';
  end if;
  if v_personas is null or v_personas < 1 or v_personas > 1000 then
    raise exception 'dato_invalido: la cantidad de personas no es válida';
  end if;
  if v_inicio is null or v_inicio < v_hoy then
    raise exception 'fecha_pasada: la fecha ya pasó';
  end if;
  if v_fin < v_inicio then
    raise exception 'fechas_invalidas: la salida es anterior a la llegada';
  end if;

  -- Contra el abuso: un mismo teléfono no puede enviar más de 8 solicitudes por hora
  select count(*) into v_ya from public.reservas
   where origen = 'cliente' and creada_en > now() - interval '1 hour'
     and regexp_replace(cliente_telefono, '\D', '', 'g') = regexp_replace(v_telefono, '\D', '', 'g');
  if v_ya >= 8 then
    raise exception 'demasiadas_solicitudes: espera un momento antes de enviar otra solicitud';
  end if;

  -- Porcentajes de la configuración del administrador (valores de fábrica si falta alguno)
  v_plazo := private.parametro(array['depositDeadlineHours'], 48);

  if v_tipo = 'cabana' then
    select * into v_cabana from public.cabanas where id = (p ->> 'cabana_id')::uuid and activo;
    if not found then raise exception 'recurso_no_disponible: la cabaña no existe o no está disponible'; end if;
    if v_cabana.en_mantencion then raise exception 'recurso_no_disponible: la cabaña está en mantención'; end if;
    if v_personas > v_cabana.capacidad then
      raise exception 'capacidad_excedida: la cabaña admite hasta % personas', v_cabana.capacidad;
    end if;
    if v_fin <= v_inicio then raise exception 'fechas_invalidas: la salida debe ser posterior a la llegada'; end if;
    if exists (
      select 1 from public.reservas
       where tipo = 'cabana' and estado = 'confirmed' and cabana_id = v_cabana.id
         and daterange(fecha_inicio, fecha_fin, '[)') && daterange(v_inicio, v_fin, '[)')
    ) then
      raise exception 'fecha_no_disponible: la cabaña ya está reservada en esas fechas';
    end if;
    v_noches := v_fin - v_inicio;
    v_subtotal := v_cabana.precio_noche * v_noches;
    select nullif(valor ->> 'checkIn', '')::time, nullif(valor ->> 'checkOut', '')::time
      into v_hora_ent, v_hora_sal from public.ajustes where clave = 'horarios_cabana';

  elsif v_tipo = 'camping' then
    v_modalidad := (p ->> 'modalidad_camping')::public.modalidad_camping;
    select * into v_sitio from public.sitios_camping where id = (p ->> 'sitio_id')::uuid and activo;
    if not found then raise exception 'recurso_no_disponible: el espacio de camping no existe o no está disponible'; end if;
    if not (v_modalidad = any (v_sitio.modalidades)) then
      raise exception 'recurso_no_disponible: ese espacio no admite la modalidad elegida';
    end if;
    if v_personas < v_sitio.capacidad_min or v_personas > v_sitio.capacidad_max then
      raise exception 'capacidad_excedida: ese espacio admite de % a % personas', v_sitio.capacidad_min, v_sitio.capacidad_max;
    end if;
    if v_modalidad = 'diario' then
      v_fin := v_inicio;
      v_noches := 1;
    else
      if v_fin <= v_inicio then raise exception 'fechas_invalidas: la salida debe ser posterior a la llegada'; end if;
      v_noches := v_fin - v_inicio;
    end if;
    -- Cupo del camping: personas ya confirmadas por día y modalidad + este grupo
    for v_dia in select private.dias_camping(v_modalidad, v_inicio, v_fin) loop
      select coalesce(sum(x.personas), 0) into v_ya
        from public.reservas x
        cross join lateral private.dias_camping(x.modalidad_camping, x.fecha_inicio, x.fecha_fin) as xd(d)
       where x.tipo = 'camping' and x.estado = 'confirmed' and x.modalidad_camping = v_modalidad and xd.d = v_dia;
      if v_ya + v_personas > private.aforo_camping() then
        raise exception 'sin_cupo: el camping no tiene cupo para % personas el %', v_personas, v_dia;
      end if;
    end loop;
    v_subtotal := v_sitio.precio_persona * greatest(1, v_personas) * v_noches;
    select nullif(valor -> v_modalidad::text ->> 'checkIn', '')::time, nullif(valor -> v_modalidad::text ->> 'checkOut', '')::time
      into v_hora_ent, v_hora_sal from public.ajustes where clave = 'horarios_camping';

  elsif v_tipo = 'restaurante' then
    v_fin := v_inicio;
    v_tipo_cliente := nullif(p ->> 'tipo_cliente', '')::public.tipo_cliente;
    if jsonb_typeof(p -> 'comidas') <> 'array' or jsonb_array_length(p -> 'comidas') = 0 then
      raise exception 'dato_invalido: falta elegir al menos una comida';
    end if;
    if jsonb_typeof(p -> 'items') <> 'array' or jsonb_array_length(p -> 'items') = 0 then
      raise exception 'dato_invalido: falta elegir platos';
    end if;
    -- Cupo por comida
    for v_comida in select * from jsonb_array_elements(p -> 'comidas') loop
      v_comida_t := (v_comida ->> 'comida')::public.tipo_comida;
      select coalesce(sum(x.personas), 0) into v_ya
        from public.reservas x join public.reserva_comidas rc on rc.reserva_id = x.id
       where x.tipo = 'restaurante' and x.estado = 'confirmed' and x.fecha_inicio = v_inicio and rc.comida = v_comida_t;
      if v_ya + v_personas > private.aforo_restaurante() then
        raise exception 'sin_cupo: el restaurante no tiene cupo para % personas en % el %', v_personas, v_comida_t, v_inicio;
      end if;
    end loop;
    -- Subtotal con los precios actuales del catálogo (no se confía en los del cliente)
    for v_item in select * from jsonb_array_elements(p -> 'items') loop
      select * into v_plato from public.platos where id = (v_item ->> 'plato_id')::uuid and activo;
      if not found then raise exception 'recurso_no_disponible: un plato elegido ya no está disponible'; end if;
      v_cantidad := (v_item ->> 'cantidad')::integer;
      if v_cantidad is null or v_cantidad < 1 or v_cantidad > 1000 then
        raise exception 'dato_invalido: la cantidad de un plato no es válida';
      end if;
      v_subtotal := v_subtotal + v_plato.precio * v_cantidad;
    end loop;

  elsif v_tipo = 'piscina' then
    v_fin := v_inicio;
    v_subtotal := round(private.parametro(array['poolEntryPrice'], 3000) * v_personas)::integer;
    v_estado := 'confirmed';  -- solicitud solo informativa (SCRUM-44): sin abono, sin cupos
  end if;

  -- Precio y abono, calculados aquí con la configuración vigente
  if v_tipo <> 'piscina' then
    v_iva_pct := private.parametro(array['ivaPercentage'], 19);
    v_dep_pct := private.parametro(array['defaultDepositPercentage'], 30);
    v_iva := round(v_subtotal * v_iva_pct / 100.0)::integer;
    v_total := v_subtotal + v_iva;
    v_abono := round(v_total * v_dep_pct / 100.0)::integer;
    if v_tipo = 'restaurante' and v_tipo_cliente = 'Institución' then
      v_abono := 0;
    end if;
    if v_abono > 0 then
      v_vence := now() + make_interval(secs => (v_plazo * 3600)::double precision);
    end if;
  else
    v_total := v_subtotal;
  end if;

  begin
    insert into public.reservas (
      id, origen, tipo, estado, cliente_nombre, cliente_telefono, cliente_correo, tipo_cliente,
      cabana_id, sitio_id, modalidad_camping, fecha_inicio, fecha_fin, personas, hora_entrada, hora_salida, comentarios,
      subtotal, iva_porcentaje, iva_monto, total, abono_porcentaje, abono_exigido, abono_vence_en
    ) values (
      v_id, 'cliente', v_tipo, v_estado, v_nombre, v_telefono, v_correo, v_tipo_cliente,
      v_cabana.id, v_sitio.id, v_modalidad, v_inicio, v_fin, v_personas, v_hora_ent, v_hora_sal, v_comentarios,
      v_subtotal, v_iva_pct, v_iva, v_total, case when v_tipo = 'piscina' then 0 else v_dep_pct end, v_abono, v_vence
    ) returning * into v_nueva;
  exception when unique_violation then
    -- Dos envíos simultáneos con el mismo id: gana el primero y se devuelve ese
    select * into v_existente from public.reservas where id = v_id and origen = 'cliente';
    if not found then raise; end if;
    return jsonb_build_object('id', v_existente.id, 'codigo', v_existente.codigo, 'estado', v_existente.estado,
      'total', v_existente.total, 'abono_exigido', v_existente.abono_exigido, 'abono_vence_en', v_existente.abono_vence_en);
  end;

  if v_tipo = 'restaurante' then
    for v_comida in select * from jsonb_array_elements(p -> 'comidas') loop
      insert into public.reserva_comidas (reserva_id, comida, hora)
      values (v_id, (v_comida ->> 'comida')::public.tipo_comida, (v_comida ->> 'hora')::time);
    end loop;
    for v_item in select * from jsonb_array_elements(p -> 'items') loop
      select * into v_plato from public.platos where id = (v_item ->> 'plato_id')::uuid;
      insert into public.reserva_items (reserva_id, comida, plato_id, nombre, precio_unitario, cantidad, acompanamiento_fijo, acompanamientos)
      values (v_id, (v_item ->> 'comida')::public.tipo_comida, v_plato.id, v_plato.nombre, v_plato.precio,
        (v_item ->> 'cantidad')::integer,
        coalesce(nullif(v_item ->> 'acompanamiento_fijo', ''), v_plato.acompanamiento_fijo),
        coalesce(v_item -> 'acompanamientos', '{}'::jsonb));
    end loop;
  end if;

  return jsonb_build_object('id', v_nueva.id, 'codigo', v_nueva.codigo, 'estado', v_nueva.estado,
    'total', v_nueva.total, 'abono_exigido', v_nueva.abono_exigido, 'abono_vence_en', v_nueva.abono_vence_en);
end;
$$;

-- Permisos: solo estas dos funciones son públicas; las de apoyo no se pueden llamar desde la API
revoke all on function private.parametro(text[], numeric) from public;
revoke all on function private.aforo_restaurante() from public;
revoke all on function private.aforo_camping() from public;
revoke all on function private.dias_camping(public.modalidad_camping, date, date) from public;
revoke all on function private.validar_aforo(uuid) from public;
revoke all on function private.trg_validar_aforo_reserva() from public;
revoke all on function private.trg_validar_aforo_comida() from public;
revoke all on function private.asignar_codigo_reserva() from public;
revoke all on function private.tocar_actualizada_en() from public;

revoke all on function public.fechas_ocupadas(date, date) from public;
revoke all on function public.crear_solicitud(jsonb) from public;
grant execute on function public.fechas_ocupadas(date, date) to anon, authenticated;
grant execute on function public.crear_solicitud(jsonb) to anon, authenticated;
