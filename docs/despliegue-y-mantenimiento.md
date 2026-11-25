# Despliegue y mantenimiento

Guía operativa para quien mantenga la aplicación después de la entrega. Complementa a `supabase-esquema.md` (cómo es la base) y `reglas-negocio.md` (qué reglas aplica el negocio).

> **Esta guía no contiene claves ni contraseñas, y no debe llevarlas.** Dice dónde va cada valor, no cuál es. Las claves se piden al dueño del proyecto o se generan de nuevo.

## 1. Mapa del sistema

| Pieza | Qué es | Dónde vive |
|---|---|---|
| Aplicación (PWA) | Vue 3 + Vite, una sola página. Dos "apps" en una: la del cliente (`/`) y la de administrador (`/admin`) | Código en GitHub; publicada en Cloudflare |
| Hosting | Worker de Cloudflare con archivos estáticos, nombre `sistema-gestion-ltr` | Panel de Cloudflare; configuración en `wrangler.jsonc` |
| Worker de `/admin` | Reescribe el HTML de `/admin` para que iPhone instale la app de administrador con su propio ícono y nombre | `worker/index.js` |
| Base de datos, cuentas, tiempo real, archivos | Supabase, proyecto `sistema-gestion-LTR` (id `shzeaodsshckniadugof`, región us-east-1) | Panel de Supabase; SQL en `supabase/migrations/` |
| Avisos push | Edge Function `avisar-solicitud` de Supabase | `supabase/functions/avisar-solicitud/` |
| Integración continua | GitHub Actions: pruebas y build en cada push y PR | `.github/workflows/ci.yml` |

Dirección actual de la app: `https://sistema-gestion-ltr.benjaminojedaval.workers.dev/`. El nombre y el dominio definitivos pueden cambiar; si cambian, ver la sección 7.

## 2. Variables de entorno

| Variable | Qué es | Es secreta |
|---|---|---|
| `VITE_SUPABASE_URL` | Dirección del proyecto de Supabase | No |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clave pública (`sb_publishable_…`) | No, pero va solo la pública |
| `VITE_VAPID_PUBLIC_KEY` | Clave pública de los avisos push | No |
| `NODE_VERSION` | `22` (solo en Cloudflare) | No |

- **Todo lo que empieza con `VITE_` queda visible en el navegador de cualquier visitante.** Nunca poner ahí la clave secreta (`service_role` o `secret`) de Supabase.
- **En tu computador:** archivo `.env` en la raíz (no se sube a git; la plantilla es `.env.example`). Si falta, la app corre en **modo local**: guarda todo en `localStorage` y no habla con Supabase.
- **En Cloudflare:** Settings → Build → **Variables and secrets** (la sección de *Build*, no la de *Runtime*; son valores que se incrustan al construir). Tras cambiarlas hay que volver a desplegar.
- **Respaldar el `.env` antes de cambiar de rama** o hacer operaciones de git grandes: una vez git lo borró al cambiar de rama.

## 3. Trabajar en local

```
npm install
npm run dev          # contra Supabase (usa el .env), puerto 5173
npm run dev:local    # sin Supabase, datos en localStorage, puerto 5180
npm test             # pruebas de reglas de negocio
npm run build        # revisa tipos (vue-tsc) y construye en dist/
```

`dev` y `dev:local` usan puertos distintos, así que sus datos no se mezclan. Atención: `npm run dev` **escribe en la base real** si el `.env` apunta a ella.

## 4. Despliegue de la aplicación (Cloudflare)

### Cómo funciona

El Worker está conectado al repositorio de GitHub. Cada vez que un PR se integra a `main`, Cloudflare ejecuta:

- Build: `npm run build`
- Deploy: `npx wrangler deploy`

y publica `dist/` más el Worker de `worker/index.js`. No hay paso manual.

### Reglas del flujo

- `main` es siempre estable: nunca se hace commit ni push directo.
- Una rama y un PR por tarea; la CI (`ci.yml`) debe quedar en verde antes de integrar; se integra con *squash and merge*.
- Detalle del flujo y de los nombres de rama en `CLAUDE.md`.

### Configuración (`wrangler.jsonc`)

- `name` debe ser **idéntico** al nombre del Worker en el panel de Cloudflare. Si no coincide, el despliegue falla o crea otro Worker.
- `not_found_handling: single-page-application`: cualquier ruta (`/admin`, `/reservas`…) carga la app en vez de dar 404.
- `run_worker_first: ["/admin", "/admin/*"]`: esas rutas pasan primero por `worker/index.js`.
- `previews: {}`: obligatorio para que las ramas distintas de `main` se publiquen como vista previa.

### Vistas previas de ramas

Cada rama con cambios se publica como `<rama>-sistema-gestion-ltr.<subdominio>.workers.dev`. Sirven para probar antes de integrar. Tres cosas a saber:

1. **Usan la base real de Supabase.** Lo que se cree desde una vista previa queda guardado de verdad (por eso conviene usar datos de prueba reconocibles y borrarlos).
2. Se construyen aparte, y **una vista previa puede salir sin las variables `VITE_*`**. En ese caso corre en modo local y el inicio de sesión es imposible. Para comprobarlo: buscar `supabase.co` en los archivos de `/assets` de esa vista previa (`curl` al `.js` principal); si no aparece, falta la variable.
3. Las vistas previas de ramas ya integradas dan 404: es normal.

### La app de administrador en iPhone

- iOS toma el manifiesto, el ícono y el nombre del **HTML** que recibe al "Agregar a inicio", no del JavaScript. Por eso existe `worker/index.js`.
- Las apps **ya instaladas** no actualizan ícono, nombre ni `start_url`: hay que borrar el ícono del teléfono y volver a agregarlo.
- Si se cambia la estructura de `index.html`, revisar que el Worker siga encontrando los elementos que reescribe (`link[rel="manifest"]`, `link[rel="apple-touch-icon"]`, `meta[name="theme-color"]`).

### Problemas frecuentes

| Síntoma | Causa probable | Qué hacer |
|---|---|---|
| La app corre pero no inicia sesión ni muestra datos reales | Se construyó sin `VITE_SUPABASE_*` (modo local) | Revisar variables en Build y volver a desplegar |
| Un cambio no se ve en el teléfono | El service worker sirve la versión en caché | Cerrar y reabrir la app; si persiste, borrarla y reinstalarla |
| Falla el build en Cloudflare pero no en local | Versión de Node | Verificar `NODE_VERSION=22` |
| 404 al abrir `/admin` directo | Falta `not_found_handling` o el Worker no está en `main` | Revisar `wrangler.jsonc` |

## 5. Base de datos y migraciones (Supabase)

### Migraciones

Los archivos están en `supabase/migrations/` con el formato `AAAAMMDDNNNNNN_nombre.sql`. **Hoy son 11 y todas están aplicadas** en el proyecto real. Se aplican en orden.

| N.º | Archivo | Qué hace |
|---|---|---|
| 1 | `tipos_y_catalogo` | Tipos enumerados, catálogo (cabañas, camping, platos…), ajustes, perfiles de administrador y funciones `es_admin()` / `es_owner()` |
| 2 | `reservas` | Reservas, comidas, ítems y pagos; restricción que impide cruzar cabañas confirmadas; códigos `SOL-` y `ADM-` |
| 3 | `funciones_aforo_y_solicitudes` | `fechas_ocupadas`, `crear_solicitud` y control de aforo al confirmar |
| 4 | `semillas` | Catálogo y ajustes de fábrica (mismos id que `src/data/seed.ts`) |
| 5 | `admin_guardar_reserva` | Guardado atómico de una reserva con comidas e ítems (solo administradores) |
| 6 | `perfiles_admin_correo` | Columna `correo` en los perfiles de administrador |
| 7 | `tiempo_real_reservas` | Publica `reservas`, `pagos` y `reserva_comidas` en Realtime |
| 8 | `reglamento_camping` | Bucket público `documentos` (solo PDF, 10 MB; escribe solo un administrador) y lectura pública del ajuste del reglamento |
| 9 | `fotos_inicio` | Lectura pública del ajuste de fotos del inicio |
| 10 | `camping_dia_sin_rango` | Por el día, todos los espacios de camping son iguales; no se exige rango de personas del espacio |
| 11 | `avisos_push` | Tabla `suscripciones_push`, columna `reservas.aviso_push_en` y disparador que llama a la Edge Function |

### Cómo agregar una migración

1. Crear el archivo en `supabase/migrations/` con la fecha y el siguiente número (por ejemplo `20261201000012_descripcion.sql`). Comentar arriba qué hace y por qué, con el SCRUM-N si existe.
2. Si reemplaza una función (`create or replace function`), copiar la versión vigente completa y cambiar solo lo necesario; los permisos (`revoke`/`grant`) se conservan al reemplazar.
3. Probar antes en una rama de Supabase o con un bloque `DO` que termine en `raise exception 'PRUEBAS_OK'` para deshacerlo todo. Un error dentro de un lote deshace **todas** las sentencias del lote.
4. Aplicarla en el proyecto (panel de Supabase → SQL, o la CLI `supabase db push`) y comprobar con el asesor de seguridad (Advisors) que no aparecen avisos nuevos.
5. Actualizar la sección "Estado de la base" de `supabase-esquema.md`.

### Reglas de seguridad de la base (importante)

- Todas las tablas tienen **RLS** (seguridad por fila). El público solo lee lo activo del catálogo y los ajustes públicos; las reservas solo las ve un administrador (quien tiene fila en `perfiles_admin`). Toda tabla nueva debe nacer con RLS activado y con políticas explícitas.
- `crear_solicitud` y `fechas_ocupadas` son `SECURITY DEFINER` y ejecutables por el público. Los avisos del asesor de seguridad sobre ellas son **intencionales**: son la única puerta del cliente a la base. Las funciones de apoyo viven en el esquema `private`, que la API no expone.
- **Nunca reiniciar las secuencias de códigos** (`SOL-`, `ADM-`) a 1 si ya hay reservas: se repetirían los códigos. Si hay que moverlas, usar `setval` con el máximo actual + 1.
- **No crear usuarios escribiendo en `auth.users` por SQL.** Las cuentas se crean en el panel (sección 6).
- No tocar otros proyectos que existan en la misma cuenta de Supabase.
- Nunca poner la clave secreta (`service_role`) en el código del navegador ni en variables `VITE_*`.

### Probar contra la base real

```
VITE_PROBAR_SUPABASE=1 npx vitest run tests/integracion
```

Son 17 pruebas. Las de administrador piden además las variables `PRUEBA_ADMIN_CORREO` y `PRUEBA_ADMIN_CLAVE` de una cuenta de prueba creada solo para eso:

1. Crear la cuenta de prueba en el panel (Authentication → Users).
2. Darle rol `admin` en `perfiles_admin`.
3. Correr las pruebas. Las de administrador se limpian solas; las de público dejan solicitudes con nombre `PRUEBA-INTEGRACION…`: borrarlas con `delete from reservas where cliente_nombre like 'PRUEBA-INTEGRACION%'`.
4. **Al terminar, quitar el perfil de la cuenta de prueba y borrarla** del panel. No reutilizar su contraseña.

### Plan de Supabase y respaldos

En el plan gratuito el proyecto **se pausa tras 7 días sin uso** y no ofrece respaldos descargables (confirmar las condiciones vigentes en la página de precios de Supabase). Para un servicio real conviene un plan de pago a nombre del cliente. Mientras tanto, una visita semanal a la app evita la pausa. Si el proyecto se pausa, se reactiva desde el panel (Restore).

## 6. Cuentas de administrador

Hoy **no se pueden crear administradores desde la app** (el botón de Ajustes → Equipo falla con Supabase). El procedimiento manual es:

1. En el panel de Supabase: **Authentication → Users → Add user**. Escribir el correo y una contraseña; marcar **Auto Confirm User**.
2. En SQL, dar el rol a esa cuenta (la fila de `perfiles_admin` usa el `id` del usuario de Auth). Roles: `owner` (dueño, puede gestionar el equipo) y `admin`. Sin esa fila la cuenta existe pero no entra al panel.
3. Entregar la contraseña a la persona por un canal privado y pedirle que la cambie. **Nunca** guardarla en el código, en documentos ni en el chat.

Para quitar acceso: borrar la fila de `perfiles_admin` (corta el acceso al panel) y, si corresponde, eliminar el usuario en Authentication → Users.

Mejora prevista (fuera de la entrega): invitar administradores por correo desde la app (SCRUM-282). Necesita una Edge Function con la clave secreta y un servicio de correo propio; el correo por defecto de Supabase tiene un tope bajo y solo envía a miembros de la organización.

## 7. Avisos push de solicitudes nuevas

Spec completo: `specs/SCRUM-68.md`. Resumen operativo:

**Cómo fluye:** el cliente crea una solicitud → un disparador de la base (`avisar_solicitud_nueva`, vía `pg_net`) llama a la Edge Function `avisar-solicitud` → la función marca la solicitud como avisada (solo avisa una vez) y envía el aviso con Web Push (VAPID) a los dispositivos registrados en `suscripciones_push`, borrando las suscripciones caducadas. Si el aviso falla, la solicitud igual se guarda.

**Secretos de la función** (se cargan en Supabase, no en el repositorio): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_ASUNTO` (un `mailto:` de contacto). `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los pone Supabase solos. La clave pública también va en `VITE_VAPID_PUBLIC_KEY`.

**Generar claves nuevas** (solo si se pierden o se filtra la privada): `npx web-push generate-vapid-keys`. Al cambiar las claves, todos los administradores deben reactivar los avisos. Guardar la privada solo como secreto de la función; no dejarla en archivos sueltos.

**Redesplegar la función.** Editar el código del repositorio **no cambia** la función que corre en Supabase; hay que desplegarla:

```
npx supabase login
npx supabase functions deploy avisar-solicitud --remote=shzeaodsshckniadugof --no-verify-jwt --yes
```

- `--no-verify-jwt` es obligatorio: la llama la base de datos, que no tiene sesión de usuario.
- `supabase login` pide un navegador: hay que hacerlo en una terminal propia (no desde una herramienta sin terminal interactiva).
- Cambiar el título o el texto de la notificación (`mensaje.ts`) requiere redesplegar.

**Texto del aviso:** título "Nueva solicitud de cabaña" (o camping, restaurante, piscina) y cuerpo "Nombre · fechas · personas". A propósito no lleva teléfono, correo, precio ni comentarios, porque se ve en la pantalla de bloqueo.

**Límites de iOS:**
- Solo funciona con la app **instalada** ("Agregar a inicio", iOS 16.4 o superior) y abierta desde el ícono.
- La app aparece en Ajustes → Notificaciones del iPhone solo después de pedir el permiso una vez (botón en Ajustes → Avisos de la app).
- Si el usuario toca "No permitir", la web no puede volver a preguntar ni abrir los Ajustes de iOS: debe activarlo a mano en Ajustes → Notificaciones.
- La línea "from Admin Troncos" la agrega iOS y no se puede quitar.
- La suscripción está **atada a la dirección** de la app: si cambia el dominio, hay que reactivar los avisos.

## 8. Si cambia el nombre o el dominio

Cambiar la dirección de la app tiene efectos en cadena. Hacerlo todo junto y probar al final:

1. Cloudflare: nuevo dominio (Settings → Domains & Routes) o nuevo Worker; cargar de nuevo las variables de Build.
2. Supabase → Authentication → **URL Configuration**: actualizar *Site URL* y *Redirect URLs*.
3. Reactivar los avisos push en cada dispositivo (la suscripción estaba atada al origen anterior).
4. Reinstalar la PWA en los teléfonos (borrar el ícono y volver a agregarlo).
5. Si el Worker cambia de nombre, actualizar `name` en `wrangler.jsonc`.
6. Avisar a los clientes del nuevo enlace (reglamento, redes, códigos QR…).

## 9. Lista rápida de verificación tras un cambio

- [ ] `npm test` y `npm run build` pasan en local.
- [ ] La CI del PR está en verde.
- [ ] Probado en la vista previa de la rama (recordando que usa la base real).
- [ ] Si hubo migración: aplicada, asesor de seguridad sin avisos nuevos, `supabase-esquema.md` actualizado.
- [ ] Si cambió una regla de negocio: `reglas-negocio.md` actualizado.
- [ ] Si cambió la Edge Function: redesplegada.
- [ ] Tras integrar a `main`: abrir la app publicada y comprobar que inicia sesión y muestra datos reales.
