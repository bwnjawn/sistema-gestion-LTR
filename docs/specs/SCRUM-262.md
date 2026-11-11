# SCRUM-262 — Resolver cruces al confirmar y avisar al cliente

Estado: código listo (10/11), falta la verificación manual y el PR
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

## Decisiones de implementación (10/11)
- **Mensaje prearmado** (`services/mensajesCliente.ts`): "Hola {nombre}, te escribimos de Los Troncos de Repil por tu solicitud {código}. Lamentablemente la fecha {fechas} ya no está disponible. ¿Te acomoda otra fecha? Quedamos atentos." Es el mismo texto para WhatsApp y correo.
- **Sin fechas alternativas calculadas.** El cliente responde con la fecha que prefiere y el administrador usa Modificar fecha o Rechazar. Así no se ofrece una fecha que otro cliente ya pidió.
- **Nunca dos confirmadas cruzadas:** `puedeConfirmarse` (en `services/cruces.ts`) revisa la solicitud junto a las ya confirmadas, y `requestsStore.confirmRequest` no confirma si chocaría (devuelve `false` y deja un mensaje en `error`). En el diálogo, "Confirmar esta" se desactiva en ese caso.
- **Cuándo aparecen las salidas de contacto:** para las solicitudes que no pueden confirmarse, o para todas las no confirmadas una vez que una del grupo quedó confirmada.
- **Modificar fecha** abre el formulario de SCRUM-59 dentro del mismo diálogo, y **Rechazar** pide confirmación.
- El diálogo se abre desde el botón Aprobar de la tarjeta y del detalle, y solo si hay cruces; sin cruces se confirma directo.
- **Grupo completo (10/11):** el diálogo no muestra solo los choques directos, sino todas las solicitudes alcanzables siguiendo los cruces (si A choca con B y B con C, al aprobar A también se ve C). Cada solicitud dice con quién se cruza. Si el grupo resulta poco claro, se ajusta o se agregan las consecuencias de cada opción.
- **Mover la fecha es un paso aparte:** al tocar "Modificar fecha" el diálogo muestra solo ese formulario, con su barra fija de "Guardar cambios" y sin el botón de cerrar de abajo, que se confundía con guardar. "Guardar" se desactiva mientras no haya cambios y, si hay cambios sin guardar, salir pide confirmación.
- **El calendario de cambio de fecha muestra los días ocupados** (`services/cambioFecha.ts`): una reserva confirmada bloquea (cabaña, cupo de restaurante y de camping) y las pendientes de otros solo se marcan con un punto. La propia solicitud no cuenta contra sí misma, y se usan las personas del formulario. El administrador no puede forzar un día bloqueado, y `applyRequestEdit` valida lo mismo al guardar (también restaurante y camping).
- **Calendario general (`BaseCalendar.vue`, SCRUM-269):** tocar la llegada otra vez borra las fechas, hay un botón "Borrar fechas", y un día que no sirve de salida pero sí de llegada pasa a ser la nueva llegada (antes la selección podía quedar pegada). Sin texto de ayuda. Los días de un solo día (restaurante y camping diario) usan el modo `single`.
- **Día de salida sobre una llegada ocupada:** la salida puede ser el día en que empieza otra reserva (se sale en la mañana y la otra llega en la tarde). Solo se ofrece como salida si la estadía completa es válida, y nunca como llegada. Una vez elegido se pinta como cualquier día elegido y se puede tocar para quitarlo.
- **Rango estilo Airbnb:** llegada y salida son círculos oscuros unidos por una franja continua verde (`emerald-200`) con puntas redondeadas al inicio y fin de cada fila y del mes.

## Preguntas abiertas
- Ninguna por ahora.

## Verificación manual
- [ ] Al aprobar una solicitud sin cruces, se confirma directo.
- [ ] Al aprobar una solicitud con cruces, aparece el diálogo con días, precio y cercanía.
- [ ] Elegir una confirma esa y deja las demás pendientes con las salidas de contacto.
- [ ] Los botones de llamada, correo y WhatsApp abren con el mensaje correcto.
- [ ] "Modificar fecha" abre la edición de SCRUM-59.
- [ ] Con tres solicitudes en cadena (A choca con B, B con C), al aprobar A aparecen las tres.
- [ ] En el calendario de cambio de fecha, los días con una reserva confirmada no se pueden elegir y los que tienen solo pendientes llevan un punto.
- [ ] "Guardar cambios" está desactivado sin cambios, y la barra de guardar queda siempre a la vista.
- [ ] En cualquier calendario, tocar la llegada otra vez borra las fechas y "Borrar fechas" funciona; no se puede quedar pegado.
- [ ] Reserva A del 10 al 12: elegir una estadía que termine el 10 deja marcar el 10 como salida, se ve como día elegido y se puede quitar. Sin llegada elegida, el 10 no se puede marcar.
- [ ] El rango se ve como una franja continua entre llegada y salida, también al cruzar de semana y de mes.
