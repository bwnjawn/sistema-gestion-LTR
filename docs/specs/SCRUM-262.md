# SCRUM-262 — Resolver cruces al confirmar y avisar al cliente

Estado: borrador (decisiones tomadas el 10/11; sin código)
Fase: 2, adelantable al prototipo

## Contexto
Los administradores trabajan en zona rural con internet inestable. Dos clientes o dos administradores pueden pedir la misma fecha, y hoy `confirmRequest` aprueba sin revisar cruces y el rechazo no avisa al cliente. Esta historia concentra la parte de pantallas; el modelo de cruces está en [SCRUM-60](SCRUM-60.md) y las reglas en [`../reglas-negocio.md`](../reglas-negocio.md).

Tareas relacionadas, todas en el Sprint 2:
- **SCRUM-260:** el admin ve las cabañas con solo pendientes, con aviso en la tarjeta; su reserva entra pendiente.
- **SCRUM-263:** solo las confirmadas bloquean; las pendientes avisan.
- **SCRUM-264:** plazo de abono de 48 h, "Abono vencido" y exención de instituciones en restaurante.
- **SCRUM-265:** varias cabañas de una familia enlazadas por `grupoId`.
- **SCRUM-266:** marca "En mantención" en las cabañas.
- **SCRUM-250 y 248:** sin conexión, conflicto al reconectar y restricción en la base de datos.
- **SCRUM-261:** evento especial (bloqueada por diseño).

## Decisiones (10/11)
1. Al confirmar una solicitud que se cruza, **se pregunta siempre** y nada se rechaza solo.
2. El admin decide comparando **días, precio y cercanía de la fecha**; esos datos se muestran en el diálogo.
3. Una pendiente que se cruza con una confirmada solo avisa y tiene la misma salida que el rechazo.
4. Para cada solicitud que no queda confirmada: botones rápidos de **llamar, correo y WhatsApp** (mensaje prearmado), **Modificar fecha** (SCRUM-59) y **Rechazar**. La app no envía nada sola.
5. Si dos administradores chocan, la app les muestra las opciones y ellos eligen. No hay prioridad automática.
6. Una confirmación hecha sin conexión queda "Sin sincronizar" y, si choca al reconectar, queda "En conflicto, por resolver" (SCRUM-250).

## Cambios por capa
- **Servicio:** `services/availability.ts` entrega los conflictos de una solicitud con sus datos de comparación; un servicio de mensajes arma el texto de rechazo por cruce (`lib/contactLinks.ts` ya genera los enlaces).
- **Store:** `requestsStore.confirmRequest` acepta la decisión sobre las solicitudes cruzadas.
- **Vista:** diálogo de confirmación en `AdminRequestDetailModal.vue` y acceso rápido desde la tarjeta.

## Casos borde
- Una pendiente cruzada con dos confirmadas.
- El cliente sin teléfono o correo usable: los botones se desactivan, como en el detalle actual.
- El admin cierra el diálogo sin elegir: no se confirma nada.
- Confirmar un grupo de cabañas (SCRUM-265): se confirman todas o ninguna.

## Preguntas abiertas
- Texto exacto de los mensajes prearmados.
- Si el mensaje ofrece fechas alternativas calculadas o solo una frase general.

## Verificación manual
- [ ] Al aprobar una solicitud sin cruces, se confirma directo.
- [ ] Al aprobar una solicitud con cruces, aparece el diálogo con días, precio y cercanía.
- [ ] Elegir una confirma esa y deja las demás pendientes con las salidas de contacto.
- [ ] Los botones de llamada, correo y WhatsApp abren con el mensaje correcto.
- [ ] "Modificar fecha" abre la edición de SCRUM-59.
