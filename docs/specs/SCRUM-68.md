# SCRUM-68 · Aviso push al administrador por cada solicitud nueva

**Estado:** hecho y Finalizado en Jira (23/11, PR #45; probado en un iPhone real). Operación y redespliegue: `docs/despliegue-y-mantenimiento.md`, sección 7.

**Historia:** "Como administrador, quiero que me llegue un aviso por cada solicitud." La historia pedía WhatsApp a ambos dueños; sin la API de WhatsApp Business no se puede enviar de forma automática, así que se hace con **notificaciones push de la PWA** (decidido el 20/11). El WhatsApp automático queda para cuando exista la cuenta de Business.

## Qué avisa y a quién
- **Quién recibe:** todo administrador que active los avisos en un dispositivo (Ajustes → Avisos). Cada uno activa los suyos.
- **Qué avisa:** solo las solicitudes que **crea el cliente** (`origen = 'cliente'`), de cualquier tipo, incluida la de piscina (informativa). Lo que el administrador registra él mismo no avisa.
- **Texto:** título "Nueva solicitud de cabaña" (igual con camping, restaurante y piscina) y cuerpo "Juan Pérez · 12 al 14 de enero · 4 personas" (`supabase/functions/avisar-solicitud/mensaje.ts`). **No** lleva teléfono, correo, precio ni comentarios: la notificación se ve en la pantalla de bloqueo.
- **Al tocarla:** abre `/admin/solicitudes?solicitud=<id>` y muestra el detalle de esa solicitud.
- **Varias seguidas:** una notificación por solicitud (`tag` = `solicitud-<id>`, así un reenvío no la duplica).

## Cómo funciona
1. El administrador activa los avisos en Ajustes → Avisos (`AjustesAvisosView`, `avisosPushStore`). El navegador pide permiso y crea la suscripción (`lib/avisosPush.ts`); se guarda con la función `registrar_suscripcion_push` en la tabla `suscripciones_push`.
2. Al insertarse una solicitud del cliente, el disparador `avisar_solicitud_nueva` llama con `pg_net` a la Edge Function `avisar-solicitud`, con `{ reserva_id }`.
3. La función marca `reservas.aviso_push_en` de forma atómica (solo avisa si estaba vacío), arma el texto, lo envía con Web Push (VAPID) a todas las suscripciones y borra las caducadas (404/410).
4. El service worker (`public/push-sw.js`, cargado con `importScripts` desde el de la PWA) muestra la notificación y, al tocarla, abre o reutiliza la ventana de la app.

## Decisiones
- **La función se despliega sin verificar JWT** (la llama la base). No es abusable: solo recibe un id, los datos salen de la base y cada solicitud avisa una sola vez.
- Un fallo al pedir el aviso **nunca impide guardar la solicitud** (el disparador captura el error y deja una advertencia).
- **Estados de la tarjeta:** disponible, instalar la app (iPhone en Safari), bloqueado (permiso denegado), desactivado y activado. El estado se vuelve a leer al volver a la pantalla, porque el permiso se cambia fuera de la app.
- Solo con Supabase: en modo local la tarjeta dice "No disponible".
- **No garantizado al segundo:** si el teléfono no tiene señal, el aviso llega cuando la recupere (TTL de 24 horas).

## Configuración necesaria (una sola vez)
- Claves VAPID: `npx web-push generate-vapid-keys`. La **pública** va en `.env` (`VITE_VAPID_PUBLIC_KEY`) y en el entorno de producción; la **privada** solo como secreto de la función.
- Secretos de la Edge Function: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_ASUNTO` (`mailto:` de contacto).
- Migración `20261120000011_avisos_push.sql` y despliegue de `avisar-solicitud`.

## Cómo probarlo
1. Abrir la app instalada (en iPhone, desde la pantalla de inicio) con sesión de administrador → Ajustes → Avisos → "Activar avisos".
2. Desde otro dispositivo, enviar una solicitud como cliente. Debe llegar la notificación al otro teléfono, también con la app cerrada.
3. Tocar la notificación: abre el detalle de esa solicitud.
4. Registrar una reserva como administrador: no debe avisar.
5. Desactivar los avisos y enviar otra solicitud: no debe llegar nada.

## Pendiente
- SCRUM-69 (mensaje al cliente) es una historia aparte.
