-- Guardado atómico de una reserva por el administrador (SCRUM-248).
-- La app necesita crear o reemplazar una reserva con sus comidas e ítems en una sola operación: la API de
-- tablas no tiene transacciones, así que se hace aquí. Corre con los permisos de quien llama (SECURITY INVOKER),
-- o sea con las reglas RLS: solo un administrador puede usarla, y el aforo y los cruces los valida la base.
--
-- Contrato de `admin_guardar_reserva(p jsonb)`: las columnas de `reservas` en snake_case, más
--   comidas: [{ comida, hora }]
--   items:   [{ comida, plato_id, nombre, precio_unitario, cantidad, acompanamiento_fijo, acompanamientos }]
-- Sin `codigo` la base asigna SOL-/ADM-. Con un `id` que ya existe, reemplaza la reserva (no toca `pagos`).
-- Devuelve { id, codigo }.

create function public.admin_guardar_reserva(p jsonb) returns jsonb
language plpgsql set search_path = ''
as $$
declare
  v_id uuid;
  v_reserva public.reservas;
  v_comida jsonb;
  v_item jsonb;
begin
  if not (select private.es_admin()) then
    raise exception 'no_autorizado: solo un administrador puede guardar reservas' using errcode = '42501';
  end if;
  if p is null or jsonb_typeof(p) <> 'object' then
    raise exception 'dato_invalido: la reserva está vacía';
  end if;

  v_id := coalesce(nullif(p ->> 'id', '')::uuid, gen_random_uuid());

  insert into public.reservas (
    id, codigo, origen, tipo, estado, cliente_nombre, cliente_telefono, cliente_correo, tipo_cliente,
    cabana_id, sitio_id, modalidad_camping, fecha_inicio, fecha_fin, personas, hora_entrada, hora_salida, comentarios,
    subtotal, iva_porcentaje, iva_monto, total, abono_porcentaje, abono_exigido, abono_vence_en,
    evento_especial, grupo_id, en_conflicto, creada_en
  ) values (
    v_id, nullif(p ->> 'codigo', ''), p ->> 'origen', (p ->> 'tipo')::public.tipo_servicio,
    coalesce((p ->> 'estado')::public.estado_reserva, 'pending'),
    p ->> 'cliente_nombre', p ->> 'cliente_telefono', nullif(p ->> 'cliente_correo', ''),
    nullif(p ->> 'tipo_cliente', '')::public.tipo_cliente,
    nullif(p ->> 'cabana_id', '')::uuid, nullif(p ->> 'sitio_id', '')::uuid,
    nullif(p ->> 'modalidad_camping', '')::public.modalidad_camping,
    (p ->> 'fecha_inicio')::date, (p ->> 'fecha_fin')::date, (p ->> 'personas')::integer,
    nullif(p ->> 'hora_entrada', '')::time, nullif(p ->> 'hora_salida', '')::time, nullif(p ->> 'comentarios', ''),
    (p ->> 'subtotal')::integer, (p ->> 'iva_porcentaje')::numeric, (p ->> 'iva_monto')::integer, (p ->> 'total')::integer,
    (p ->> 'abono_porcentaje')::numeric, (p ->> 'abono_exigido')::integer,
    nullif(p ->> 'abono_vence_en', '')::timestamptz,
    coalesce((p ->> 'evento_especial')::boolean, false), nullif(p ->> 'grupo_id', '')::uuid,
    coalesce((p ->> 'en_conflicto')::boolean, false), coalesce(nullif(p ->> 'creada_en', '')::timestamptz, now())
  )
  on conflict (id) do update set
    estado = excluded.estado,
    cliente_nombre = excluded.cliente_nombre,
    cliente_telefono = excluded.cliente_telefono,
    cliente_correo = excluded.cliente_correo,
    tipo_cliente = excluded.tipo_cliente,
    cabana_id = excluded.cabana_id,
    sitio_id = excluded.sitio_id,
    modalidad_camping = excluded.modalidad_camping,
    fecha_inicio = excluded.fecha_inicio,
    fecha_fin = excluded.fecha_fin,
    personas = excluded.personas,
    hora_entrada = excluded.hora_entrada,
    hora_salida = excluded.hora_salida,
    comentarios = excluded.comentarios,
    subtotal = excluded.subtotal,
    iva_porcentaje = excluded.iva_porcentaje,
    iva_monto = excluded.iva_monto,
    total = excluded.total,
    abono_porcentaje = excluded.abono_porcentaje,
    abono_exigido = excluded.abono_exigido,
    abono_vence_en = excluded.abono_vence_en,
    evento_especial = excluded.evento_especial,
    grupo_id = excluded.grupo_id,
    en_conflicto = excluded.en_conflicto
  returning * into v_reserva;

  -- Las comidas y los ítems se reemplazan completos
  delete from public.reserva_items where reserva_id = v_id;
  delete from public.reserva_comidas where reserva_id = v_id;

  if jsonb_typeof(p -> 'comidas') = 'array' then
    for v_comida in select * from jsonb_array_elements(p -> 'comidas') loop
      insert into public.reserva_comidas (reserva_id, comida, hora)
      values (v_id, (v_comida ->> 'comida')::public.tipo_comida, (v_comida ->> 'hora')::time);
    end loop;
  end if;

  if jsonb_typeof(p -> 'items') = 'array' then
    for v_item in select * from jsonb_array_elements(p -> 'items') loop
      insert into public.reserva_items (reserva_id, comida, plato_id, nombre, precio_unitario, cantidad, acompanamiento_fijo, acompanamientos)
      values (
        v_id, (v_item ->> 'comida')::public.tipo_comida, nullif(v_item ->> 'plato_id', '')::uuid,
        v_item ->> 'nombre', (v_item ->> 'precio_unitario')::integer, (v_item ->> 'cantidad')::integer,
        nullif(v_item ->> 'acompanamiento_fijo', ''), coalesce(v_item -> 'acompanamientos', '{}'::jsonb)
      );
    end loop;
  end if;

  return jsonb_build_object('id', v_reserva.id, 'codigo', v_reserva.codigo);
end;
$$;

revoke all on function public.admin_guardar_reserva(jsonb) from public, anon;
grant execute on function public.admin_guardar_reserva(jsonb) to authenticated;
