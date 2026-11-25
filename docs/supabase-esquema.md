# Esquema de Supabase — Los Troncos de Repil

Historia: SCRUM-245 (diseño aprobado el 2026-11-11). **Estado al 2026-11-24: todo esto ya está aplicado** en el proyecto real de Supabase (SCRUM-246 y SCRUM-248 hechas). Lo que describen las secciones siguientes es el diseño original; la lista de lo realmente aplicado, con las migraciones 1 a 11 y sus diferencias con el diseño, está en la sección "Estado de la base". Cómo se opera: `despliegue-y-mantenimiento.md`.

Principios:
- **Los valores de los enums son idénticos a las uniones de `src/types/domain.ts`** (`pending`, `confirmed`, `cabana`, `diario`…), así el adaptador solo cambia de forma, no de vocabulario.
- Tablas y columnas en español, sin tildes ni eñes (`cabanas`, `acompanamientos`).
- Todo identificador es `uuid` (`gen_random_uuid()`).
- Importes en pesos chilenos enteros (`integer`). Sin decimales.
- Fechas de estadía como `date`; instantes como `timestamptz`.
- **Instantánea de precios:** la reserva copia nombre y precio de lo que contrató. Si el admin cambia el catálogo después, las reservas antiguas no cambian.
- **Borrado lógico** en catálogo (`activo`): nunca se borra una cabaña, un sitio o un plato que una reserva ya usó.

## 1. Tipos enumerados

| Tipo | Valores |
|---|---|
| `tipo_servicio` | `cabana`, `camping`, `restaurante`, `piscina` (solicitud solo informativa: nace `confirmed`, sin abono, no cuenta en cruces ni cupos; SCRUM-44) |
| `estado_reserva` | `pending`, `confirmed`, `rejected`, `cancelled` |
| `modalidad_camping` | `diario`, `pernoctar` |
| `tipo_comida` | `desayuno`, `almuerzo`, `once` |
| `tipo_cliente` | `Particular`, `Empresa`, `Organización`, `Paseo escolar`, `Institución` |
| `medio_pago` | `transferencia`, `efectivo`, `debito` |
| `modo_acompanamiento` | `none`, `fixed`, `choice` |
| `rol_admin` | `owner`, `admin`, `staff` |

`MealType` pasa a ser `'desayuno' | 'almuerzo' | 'once'` en `domain.ts` (hoy `Dish.mealCategory` es `'Desayuno' | 'Almuerzo' | 'Once' | string`, con mayúscula inicial). La migración de datos guardados normaliza a minúsculas.

## 2. Catálogo

```sql
create table cabanas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  capacidad integer not null check (capacidad > 0),
  precio_noche integer not null check (precio_noche >= 0),
  camas text,
  descripcion text,
  imagen_principal text,
  imagenes text[] not null default '{}',
  caracteristicas jsonb not null default '[]',   -- lista de textos; ver nota
  en_mantencion boolean not null default false,  -- temporal (SCRUM-266)
  activo boolean not null default true,          -- borrado lógico
  creada_en timestamptz not null default now()
);

create table sitios_camping (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  precio_persona integer not null check (precio_persona >= 0),
  capacidad_min integer not null check (capacidad_min >= 1),
  capacidad_max integer not null,
  es_especial boolean not null default false,
  modalidades modalidad_camping[] not null,      -- 'ambos' pasa a ser {diario,pernoctar}
  imagen_principal text,
  imagenes text[] not null default '{}',
  caracteristicas text[] not null default '{}',
  activo boolean not null default true,
  check (capacidad_max >= capacidad_min)
);

create table platos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio integer not null check (precio >= 0),
  descripcion text,
  comida tipo_comida not null,
  modo_acompanamiento modo_acompanamiento not null default 'none',
  acompanamiento_fijo text,                      -- solo si modo = 'fixed'
  imagen text,
  activo boolean not null default true
);

create table acompanamientos (                   -- lista global de acompañamientos
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  activo boolean not null default true
);

create table plato_acompanamientos (             -- solo si modo = 'choice'
  plato_id uuid references platos on delete cascade,
  acompanamiento_id uuid references acompanamientos,
  primary key (plato_id, acompanamiento_id)
);
```

**Nota sobre `caracteristicas` de cabaña:** hoy es `string | { text, name, icon }`. En la base queda `jsonb` con una lista de textos; el adaptador normaliza los objetos antiguos a su `text`/`name`. Si hace falta ícono, se agrega en otra historia.

**`en_mantencion` ≠ `activo`:** mantención es temporal, reversible y se muestra en el catálogo del admin; `activo = false` es el borrado lógico (desaparece de todo menos del historial de reservas).

## 3. Reservas

```sql
create sequence codigo_solicitud_seq;
create sequence codigo_admin_seq;

create table reservas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,                    -- SOL-00001 / ADM-00001, lo genera un trigger
  origen text not null check (origen in ('cliente','admin')),
  tipo tipo_servicio not null,
  estado estado_reserva not null default 'pending',

  -- Cliente
  cliente_nombre text not null,
  cliente_telefono text not null,
  cliente_correo text,
  tipo_cliente tipo_cliente,                      -- solo restaurante

  -- Qué reserva (según el servicio)
  cabana_id uuid references cabanas,              -- solo cabaña
  sitio_id uuid references sitios_camping,        -- solo camping
  modalidad_camping modalidad_camping,            -- solo camping
  fecha_inicio date not null,
  fecha_fin date not null,                        -- cabaña y pernoctar: salida (excluida); resto (incluida piscina) = fecha_inicio
  personas integer not null check (personas > 0),
  hora_entrada time,                              -- cabaña y camping: horario vigente al reservar
  hora_salida time,
  comentarios text,

  -- Precio y abono (instantánea al enviar)
  subtotal integer not null,
  iva_porcentaje numeric(5,2) not null,
  iva_monto integer not null,
  total integer not null,
  abono_porcentaje numeric(5,2) not null,
  abono_exigido integer not null,                 -- 0 si es Institución en restaurante o si es piscina
  abono_vence_en timestamptz,                     -- solo pendientes con abono exigido

  -- Grupos y sincronización
  grupo_id uuid,                                  -- varias cabañas de una familia (SCRUM-265)
  en_conflicto boolean not null default false,    -- sin conexión: choca con una confirmada (SCRUM-250)
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now(),

  check (fecha_fin >= fecha_inicio),
  check ((tipo = 'cabana')  = (cabana_id is not null)),
  check ((tipo = 'camping') = (sitio_id is not null and modalidad_camping is not null)),
  check (tipo = 'restaurante' or tipo_cliente is null)
);

-- Dos confirmadas no pueden cruzarse en la misma cabaña, en [entrada, salida)
alter table reservas add constraint reservas_sin_cruce_cabana
  exclude using gist (cabana_id with =, daterange(fecha_inicio, fecha_fin, '[)') with &&)
  where (tipo = 'cabana' and estado = 'confirmed');
-- requiere: create extension btree_gist;

create index on reservas (estado, tipo, fecha_inicio);
create index on reservas (grupo_id) where grupo_id is not null;
```

**Equivalencias con el modelo actual:**

| `ReservationRequest` | `reservas` |
|---|---|
| `requestCode` | `codigo` |
| `clientName`, `clientPhone`, `clientEmail` | `cliente_nombre`, `cliente_telefono`, `cliente_correo` |
| `details.clientType` | `tipo_cliente` |
| `type` | `tipo` |
| `resourceName` | se obtiene por join (`cabanas.nombre` / `sitios_camping.nombre`); en restaurante es el texto "Restaurante" |
| `details.resourceId` | `cabana_id` o `sitio_id` |
| `details.startDate`, `details.endDate` | `fecha_inicio`, `fecha_fin` |
| `date` y `timeOrDuration` (heredados) | desaparecen; el adaptador los reconstruye para mostrar |
| `guestsCount` | `personas` |
| `details.campingType` | `modalidad_camping` |
| `details.schedule` | `hora_entrada`, `hora_salida` |
| `details.pricing` y `totalAmount`, `depositRequired` | `subtotal`, `iva_*`, `total`, `abono_*` |
| `depositDueAt` | `abono_vence_en` |
| `details.comments` | `comentarios` |
| `status` | `estado` |
| `payments` | tabla `pagos` |
| `details.selectedMeals`, `selectedMealTypes`, `mealTimes` | tablas `reserva_items` y `reserva_comidas` |
| `createdAt` | `creada_en` |

**Adaptadores:** `src/services/adaptadoresReserva.ts` (`requestToBooking` y `bookingToRequest`), con pruebas de ida y vuelta en `tests/adaptadoresReserva.test.ts`. Lo que no viaja a la base porque no tiene columna: `details.isSpecialEvent` (SCRUM-261, bloqueada), `details.restaurantTime` (campo antiguo; la hora vive en `reserva_comidas`) y `details.nights` (se calcula desde las fechas). Una solicitud antigua sin desglose de precio entra con IVA 0 en vez de inventarlo. `updatedAt` se rellena con `createdAt`, porque la solicitud no guarda la última modificación.

### Restaurante: comidas e ítems

```sql
create table reserva_comidas (                    -- horario por comida
  reserva_id uuid references reservas on delete cascade,
  comida tipo_comida,
  hora time not null,
  primary key (reserva_id, comida)
);

create table reserva_items (                      -- platos elegidos, con la comida a la que pertenecen
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null,
  comida tipo_comida not null,
  plato_id uuid references platos,                -- puede quedar nulo si el plato se borra de verdad
  nombre text not null,                           -- instantánea
  precio_unitario integer not null,
  cantidad integer not null check (cantidad > 0),
  acompanamiento_fijo text,
  acompanamientos jsonb not null default '{}',    -- { "Papas fritas": 2, "Ensalada": 1 }
  foreign key (reserva_id, comida) references reserva_comidas
);
```

`reserva_items` apunta a `reserva_comidas`: un plato no puede pertenecer a una comida que la reserva no eligió. Así `SelectedMealPayload.mealType` deja de ser opcional.

### Pagos

```sql
create table pagos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas on delete cascade,
  monto integer not null check (monto > 0),
  medio medio_pago not null,
  pagado_el date not null,
  notas text,
  registrado_por uuid references auth.users,
  creado_en timestamptz not null default now()
);
```

El abono pagado se sigue calculando sumando `pagos`. "Confirmada sin abono" y "Abono vencido" siguen derivándose en `services/payments.ts`, no se guardan.

## 4. Aforo y ajustes

```sql
create table espacios_restaurante (               -- aforo por espacio (SCRUM-244)
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  capacidad integer not null check (capacidad > 0),
  activo boolean not null default true
);

create table ajustes (                            -- una fila por clave; el valor es un jsonb tipado en la app
  clave text primary key,
  valor jsonb not null,
  actualizado_en timestamptz not null default now()
);
```

Claves de `ajustes` (las mismas que hoy usa `settingsRepository` en `localStorage`): `contacto`, `transferencia`, `parametros` (abono por defecto, plazo en horas, margen, precio de la entrada a la piscina), `horarios_restaurante`, `horarios_camping`, `horarios_cabana`, `limites_aforo` (camping, topes de grupo y variedades de menú), `reglamento_camping` (SCRUM-51) y `fotos_inicio` (SCRUM-271: foto de cada tarjeta del inicio; lectura pública).

Las reglas de aforo **no tienen tabla propia**: el aforo de camping y la regla de variedades de menú son valores de `ajustes`, y el del restaurante es la suma de `espacios_restaurante`. Los límites de camping y restaurante no pueden ser una restricción de exclusión (dependen de sumar personas); se validan en la función `crear_solicitud` y al confirmar (ver sección 6).

## 5. Administradores

```sql
create table perfiles_admin (
  id uuid primary key references auth.users on delete cascade,
  nombre text,
  rol rol_admin not null default 'admin',
  creado_en timestamptz not null default now()
);
```

Las contraseñas las guarda Supabase Auth, no la app (cierra el punto 13 de la auditoría).

## 6. Seguridad (RLS)

Todas las tablas con `enable row level security`. Dos roles: **público** (clave anónima, sin sesión) y **admin** (sesión con fila en `perfiles_admin`).

| Tabla | Público | Admin |
|---|---|---|
| `cabanas`, `sitios_camping`, `platos`, `acompanamientos`, `plato_acompanamientos`, `espacios_restaurante` | Solo lectura de filas con `activo` | Todo |
| `ajustes` | Solo lectura de `contacto`, `transferencia`, `horarios_*` y `parametros` | Todo |
| `reservas`, `reserva_comidas`, `reserva_items`, `pagos` | **Nada** (ni leer ni escribir directo) | Todo |
| `perfiles_admin` | Nada | Solo `owner` |

**El público no lee reservas.** Para que el cliente vea fechas bloqueadas sin exponer datos personales, y para que envíe una solicitud, se usan dos funciones `security definer` (se llaman con `supabase.rpc`):

- `fechas_ocupadas(desde, hasta)`: devuelve solo agregados, sin nombre ni teléfono, con la forma de `FechasOcupadas` (`src/types/disponibilidad.ts`): una fila por cabaña y noche si hay una confirmada; por comida y día, las personas ya confirmadas; por modalidad y día, las personas de camping (cada noche de una estadía de pernoctar). Cuenta solo `confirmed` (SCRUM-263) y no incluye la piscina.
- `crear_solicitud(payload jsonb)`: valida el payload, vuelve a calcular precio y abono en el servidor (no confía en los totales del cliente), fija `estado = 'pending'` y `origen = 'cliente'` (**salvo `piscina`, que nace `confirmed`**, sin abono y sin validar cupos), genera el código y devuelve `{ id, codigo }`.

**Al confirmar** (trigger sobre `estado`): la restricción de exclusión impide dos cabañas confirmadas cruzadas; para restaurante y camping, el trigger suma las personas ya confirmadas del mismo día y comida/modalidad y rechaza si superan el aforo. En la reconexión sin conexión (SCRUM-250), el error de la restricción es lo que marca `en_conflicto = true` en lugar de perder la reserva.

### Estado de la base (actualizado 2026-11-24)

Proyecto `sistema-gestion-LTR` (id `shzeaodsshckniadugof`, región us-east-1). Los archivos SQL están en `supabase/migrations/` y ya están aplicados:
1. `tipos_y_catalogo`: enums, catálogo, ajustes, administradores y sus reglas de acceso.
2. `reservas`: reservas, comidas, ítems, pagos, restricción de cruces, códigos y reglas de acceso.
3. `funciones_aforo_y_solicitudes`: `fechas_ocupadas`, `crear_solicitud` y el aforo al confirmar.
4. `semillas`: catálogo y ajustes de fábrica, con los mismos id que `src/data/seed.ts`.
5. `admin_guardar_reserva`: guarda una reserva con sus comidas e ítems en una sola operación (solo administradores).
6. `perfiles_admin_correo`: columna `correo` en los perfiles de administrador.
7. `tiempo_real_reservas`: `reservas`, `pagos` y `reserva_comidas` en la publicación `supabase_realtime` (SCRUM-273).
8. `reglamento_camping` (SCRUM-51): bucket público `documentos` (solo PDF, hasta 10 MB; solo un administrador sube, reemplaza o borra) y lectura pública de la clave `reglamento_camping` de `ajustes`.
9. `fotos_inicio` (SCRUM-271): lectura pública de la clave `fotos_inicio` de `ajustes` (foto de cada tarjeta del inicio).
10. `camping_dia_sin_rango` (SCRUM-277): `crear_solicitud` deja de exigir el rango de personas del espacio cuando la modalidad es `diario` (por el día todos los espacios de camping son iguales); al pernoctar se sigue validando. El cupo total del día lo sigue validando el trigger de aforo.
11. `avisos_push` (SCRUM-68): tabla `suscripciones_push` (un dispositivo de un administrador; cada uno ve y borra solo las suyas), función `registrar_suscripcion_push`, columna `reservas.aviso_push_en` (hace el aviso idempotente) y el disparador `avisar_solicitud_nueva`, que al crearse una solicitud del cliente (`origen = 'cliente'`) llama por `pg_net` a la Edge Function `avisar-solicitud`. Un fallo al avisar nunca impide guardar la solicitud. Detalle en `docs/specs/SCRUM-68.md` y operación en `docs/despliegue-y-mantenimiento.md`.

Diferencias con lo descrito arriba:
- `reservas.evento_especial boolean` se agregó (SCRUM-261): así `details.isSpecialEvent` ya no se pierde.
- `ajustes`: el público también lee `limites_aforo`, porque el flujo del cliente (camping) lo usa.
- Las funciones de apoyo de las políticas (`es_admin`, `es_owner`) viven en el esquema `private`, que la API no expone.
- Probado en la base: el público no puede leer `reservas`; una pendiente convive con una confirmada; dos confirmadas cruzadas se rechazan; salida y entrada el mismo día no cruzan.
- **Aforo:** sale de `ajustes.parametros.capacityRules` (suma de `restaurantSpaces` y `maxCampingPeopleCapacity`), lo mismo que usa la app. La tabla `espacios_restaurante` no se usa por ahora.
- **`crear_solicitud(p jsonb)`** (la llama el público con `supabase.rpc`): el cliente genera el `id` (reenviar no duplica); el servidor valida, recalcula precio, IVA, abono y plazo con el catálogo y la configuración vigentes, y devuelve `{ id, codigo, estado, total, abono_exigido, abono_vence_en }`. Claves del payload: `id`, `tipo`, `cliente_nombre`, `cliente_telefono`, `cliente_correo`, `tipo_cliente`, `fecha_inicio`, `fecha_fin`, `personas`, `comentarios`, `cabana_id`, `sitio_id`, `modalidad_camping`, `comidas: [{comida, hora}]`, `items: [{comida, plato_id, cantidad, acompanamiento_fijo, acompanamientos}]`. Los errores empiezan con un código estable: `fecha_no_disponible`, `sin_cupo`, `capacidad_excedida`, `recurso_no_disponible`, `fecha_pasada`, `fechas_invalidas`, `dato_invalido`, `demasiadas_solicitudes` (más de 8 por hora desde el mismo teléfono).
- **`fechas_ocupadas(desde, hasta)`** devuelve `{ cabanas: [{cabinId, noche}], restaurante: [{dia, tipo, personas}], camping: [{dia, tipo, personas}] }`, solo confirmadas y sin datos personales (máximo 800 días).
- **Aforo al confirmar:** un trigger rechaza (`aforo_excedido`, mismo código de error que el cruce de cabañas) confirmar más personas que el aforo por comida en el restaurante o por modalidad y día en el camping.
- **Avisos de seguridad que se aceptan a propósito:** Supabase marca `crear_solicitud` y `fechas_ocupadas` como funciones `SECURITY DEFINER` ejecutables por el público. Es intencional: son la única puerta del cliente a la base. Las funciones de apoyo viven en el esquema `private` y no son llamables.
- **`admin_guardar_reserva(p jsonb)`** (solo administradores; corre con sus permisos): crea o reemplaza una reserva con sus comidas e ítems de forma atómica; sin `codigo` la base asigna `ADM-`/`SOL-`. No toca `pagos`.
- **Pendiente:** Storage de imágenes, crear administradores desde la app (hoy se crean en el panel de Supabase: Authentication > Users, y luego se les da un perfil en `perfiles_admin`), validar en el servidor la regla de variedades de menú (hoy solo la valida la app).

### Actualización del panel (SCRUM-273)

La app ya no carga las solicitudes una sola vez: `src/stores/actualizacionStore.ts` mantiene los datos al día.
- **Al volver a la app** (pestaña visible otra vez, página restaurada en iPhone) y **al recuperar internet**: vuelve a pedir ajustes, catálogo, disponibilidad y, con sesión, las solicitudes. Al volver no repite si se actualizó hace menos de 20 s.
- **En tiempo real, solo administrador:** `RequestRepository.escucharCambios` usa Supabase Realtime sobre `reservas`, `pagos` y `reserva_comidas`. Los avisos solo dicen que algo cambió (se juntan en una actualización cada 400 ms) y se vuelve a pedir la lista; también se actualiza cuando la conexión en vivo se restablece. El público no recibe nada (RLS).
- **A mano:** botón de actualizar en el encabezado del panel (rutas con `meta.actualizable`), con "Actualizado hace X min".
- No se pisa lo que el administrador está guardando: `requestsStore.refrescar` se pospone mientras hay una escritura en curso y no toca la pantalla si no cambió nada.

### Conexión de la app (SCRUM-248)

Con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` reales en `.env`, `repositorios()` entrega los de `src/lib/repositories/supabase/` (`modo: 'supabase'`); sin ellos, los locales (`modo: 'local'`). En las pruebas siempre son locales, salvo las de integración (`VITE_PROBAR_SUPABASE=1`).

- El público carga ajustes, catálogo activo y `fechas_ocupadas`. Las solicitudes y el catálogo completo (con lo dado de baja) solo se cargan con sesión de administrador (`cargarDatosDeAdministrador` en `src/lib/arranque.ts`) y se descartan al cerrarla.
- El cliente envía con `crear_solicitud`: la app se queda con el código, el estado, el total y el plazo que devuelve el servidor, no con los calculados en el navegador.
- Claves de ajustes: `contact_info`→`contacto`, `transfer_info`→`transferencia`, `parameters`→`parametros`, `*_schedules`→`horarios_*`.
- Los errores de la base (`sin_cupo`, `fecha_no_disponible`…) se muestran como mensajes en español (`src/lib/repositories/supabase/errores.ts`).
- Pruebas: `tests/mapeosSupabase.test.ts` (traducciones, sin red) y `tests/integracion/` (contra la base real: `VITE_PROBAR_SUPABASE=1 npx vitest run tests/integracion`; las de administrador piden además `PRUEBA_ADMIN_CORREO` y `PRUEBA_ADMIN_CLAVE`). Las 17 pasan contra la base real (16/11). Las de administrador se limpian solas al terminar; las de público dejan solicitudes `PRUEBA-INTEGRACION…` que esa limpieza también borra si corre con la cuenta de administrador (si no, `delete from reservas where cliente_nombre like 'PRUEBA-INTEGRACION%'`). Conviene reiniciar las secuencias de códigos después (`alter sequence codigo_solicitud_seq restart with 1`). Los ítems de una reserva cuelgan de la comida (clave foránea `(reserva_id, comida)`), por eso `SELECT_RESERVA` los anida dentro de `reserva_comidas`.

## 7. Qué queda fuera de este esquema

- Eventos especiales (SCRUM-261, bloqueada por decisiones de diseño, D6).
- Dónde viven las imágenes (Supabase Storage vs. URLs): hoy son texto; se decide en SCRUM-248.
- Datos de prueba y migración de lo guardado en `localStorage` hacia la base: SCRUM-246/248.
- Notificaciones al admin por conflictos: SCRUM-250.

## 8. Decisiones (aprobadas el 11/11)

1. **Valores de enums en inglés** (`pending`, `confirmed`) por coherencia con `domain.ts`, aunque tablas y columnas estén en español. ¿Prefieres enums en español y traducir en el adaptador?
2. **`reservas` como una sola tabla** para los tres servicios, con columnas nulas según el tipo (restringidas por `check`). La alternativa son tres tablas; esto simplifica las consultas del calendario y la lista de solicitudes.
3. **Códigos `SOL-`/`ADM-` con secuencia** (reemplaza los aleatorios de 3 y 4 dígitos).
4. **Instantánea de precios en `reserva_items`** en vez de apuntar siempre al plato.
5. **Una cabaña por reserva**; las familias se enlazan con `grupo_id` (SCRUM-265), sin tabla de grupos.

## 9. Capa de datos en la app (SCRUM-246)

Las vistas llaman al **store de Pinia**; el store llama a un **repositorio por entidad** (`src/lib/repositories/`). Hoy los implementa el almacenamiento local; SCRUM-248 agrega otra implementación de las mismas interfaces y la registra en `src/lib/repositories/index.ts` (`repositorios()` / `usarRepositorios()`), sin tocar stores ni vistas.

| Interfaz | Operaciones | Tabla en Supabase |
|---|---|---|
| `Repositorio<T>` (cabañas, espacios de camping, platos, administradores) | `list`, `getById`, `create`, `update(id, cambios)`, `remove` | `cabanas`, `sitios_camping`, `platos`, `perfiles_admin` |
| `RequestRepository` (extiende `Repositorio`) | además `listByRange(desde, hasta)` | `reservas` (+ `reserva_comidas`, `reserva_items`), con los adaptadores de `services/adaptadoresReserva.ts` en el borde |
| `PaymentRepository` | `listByRequest`, `add`, `remove` | `pagos` |
| `AvailabilityRepository` | `fechasOcupadas(desde, hasta)` → `FechasOcupadas` | función `fechas_ocupadas` (el público no lee `reservas`) |
| `GlobalSideRepository` | `list`, `add`, `remove` (lista de nombres) | `acompanamientos` |
| `SettingsRepository` | `get(clave, porDefecto)`, `save(clave, valor)` | `ajustes` |
| `AuthRepository` | `admins` (un `Repositorio`), `getSession`, `saveSession`, `clearSession` | Supabase Auth (reemplaza este repositorio) |

Reglas de la capa:
- **Sin `watch` que guarden.** Cada acción aplica el cambio en pantalla, llama al repositorio y, si falla, lo **revierte** y muestra el aviso global (`persistirConReversion`, `AvisoAccion`); y al revés, cuando sí se guardó avisa arriba qué se hizo (SCRUM-288, `docs/specs/SCRUM-288.md`). El repositorio lanza `ErrorDeAlmacenamiento` / `ErrorNoEncontrado` (`src/lib/errores.ts`).
- **`init()` asíncrono** en cada store; `main.ts` no monta la app hasta que todos cargan (`src/lib/arranque.ts`). Si falla, muestra una pantalla con "Reintentar".
- **Semillas** (`src/data/seed.ts`) solo las usa el repositorio local, mientras no haya nada guardado. Los valores de fábrica de los ajustes están en `src/data/ajustesPorDefecto.ts`.
- **`migrateLegacyData()`** (`src/lib/migrarDatosLocales.ts`) lleva lo guardado en el navegador al formato vigente al arrancar. Solo existe para el almacenamiento local; en Supabase los datos nacen en el formato vigente, así que el código ya no acepta valores antiguos (`'cabaña'`, `'confirmada'`, `'pendiente'`…).
- **Claves unificadas:** los acompañamientos globales usan solo `global_sides` (la clave `global_side_dishes` se borra al migrar).
- **El cliente no lee solicitudes.** Las pantallas del cliente (cabaña, camping y restaurante, pasos 1 y 2) toman la disponibilidad del `disponibilidadStore`, que pide `fechasOcupadas` al arrancar (hoy + 730 días) y la vuelve a pedir cuando el admin confirma, cancela, rechaza o mueve una reserva. Las reglas están en `services/disponibilidad.ts` y `tests/disponibilidad.test.ts` comprueba que dan lo mismo que las de `services/availability.ts`, que sigue usando el administrador con la lista completa.

### Pendiente para SCRUM-248 (no cubierto por 246)
1. **Enviar la solicitud del cliente** será `crear_solicitud`, que recalcula el precio y asigna el código; hoy el store genera el id y el código (`generateRequestCode`). El store deberá quedarse con lo que devuelva `RequestRepository.create`.
2. **No cargar todas las solicitudes para el cliente.** `requestsStore.init()` pide la lista completa al arrancar; con las reglas de acceso solo debe cargarse con sesión de administrador (por ejemplo, desde la guarda de las rutas `/admin`). Hoy se carga para todos porque el código `SOL-` se genera comparando con los existentes.
3. **Datos frescos entre dispositivos:** los stores cargan una sola vez; hará falta refrescar o usar realtime, y pedir por mes con `listByRange`.
4. **Sin conexión (SCRUM-250):** la reversión de `persistirConReversion` asume que un fallo se deshace; offline una solicitud debe quedar en cola y no revertirse.
5. **Migración de lo guardado en los navegadores** hacia la base.
