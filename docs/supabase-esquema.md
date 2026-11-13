# Esquema de Supabase — Los Troncos de Repil

Historia: SCRUM-245. Estado: **decisiones aprobadas** (2026-11-11); tipos, migración del catálogo y adaptadores listos (SCRUM-245); falta cablearlos a los repositorios (SCRUM-246). Nada de esto está aplicado todavía: la creación del proyecto, la autenticación y las migraciones reales son SCRUM-248; el cableado de los repositorios es SCRUM-246.

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

Claves de `ajustes` (las mismas que hoy usa `settingsRepository` en `localStorage`): `contacto`, `transferencia`, `parametros` (abono por defecto, plazo en horas, margen, precio de la entrada a la piscina), `horarios_restaurante`, `horarios_camping`, `horarios_cabana`, `limites_aforo` (camping, topes de grupo y variedades de menú).

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

- `fechas_ocupadas(tipo, desde, hasta)`: devuelve solo agregados, sin nombre ni teléfono: por cabaña y noche si hay una confirmada; por comida y día, las personas ya confirmadas; por modalidad y día, las personas de camping. Cuenta solo `confirmed` (SCRUM-263).
- `crear_solicitud(payload jsonb)`: valida el payload, vuelve a calcular precio y abono en el servidor (no confía en los totales del cliente), fija `estado = 'pending'` y `origen = 'cliente'` (**salvo `piscina`, que nace `confirmed`**, sin abono y sin validar cupos), genera el código y devuelve `{ id, codigo }`.

**Al confirmar** (trigger sobre `estado`): la restricción de exclusión impide dos cabañas confirmadas cruzadas; para restaurante y camping, el trigger suma las personas ya confirmadas del mismo día y comida/modalidad y rechaza si superan el aforo. En la reconexión sin conexión (SCRUM-250), el error de la restricción es lo que marca `en_conflicto = true` en lugar de perder la reserva.

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
