# Reglas de negocio — Los Troncos de Repil

Fuente única de las reglas que hoy están repartidas en los criterios de aceptación de Jira.
**Regla de oro:** toda regla de esta tabla debe vivir en `src/services/` y no en una vista (`.vue`).
Cuando una regla cambie, se actualiza primero este archivo y después el código.

Última revisión: 2026-11-10 (reglas de cruces, abono y mantención)

Estados de implementación: ✅ en servicio · ⚠️ en vista o con valor fijo en el código · ❌ no implementada · ❓ falta decisión

## 1. Reglas generales

| Regla | Valor | Historia | Dónde está hoy | Estado |
|---|---|---|---|---|
| Abono exigido | 30 % por defecto, editable por el admin | SCRUM-32, 59 | `settingsStore.parameters.defaultDepositPercentage` y `services/pricing.ts` | Las reservas del admin usan el mismo cálculo (SCRUM-56) |
| IVA | 19 % se suma al subtotal | — | `services/pricing.ts` | ❓ ¿Los precios publicados ya incluyen IVA? Ninguna historia lo define |
| Estados de solicitud | `pending` → `confirmed` o `rejected`, además de `cancelled`. **Solo `confirmed` retiene fechas y cupos**; `pending` es una intención que puede convivir con otras (ver sección 5) | SCRUM-59, 263 | `types/domain.ts` | ⚠️ las vistas aún aceptan valores antiguos (`pendiente`, `confirmada`, `rechazada`) |
| Cancelar una confirmada | El administrador cancela una **confirmada** desde su detalle ("Cancelar reserva", con confirmación): pasa a `cancelled`, **libera sus fechas y cupos** y queda en el historial (en pantalla entre las "Descartadas"; "Cancelada" en el Excel). Los pagos se conservan: la app no registra devoluciones. Después se ofrece avisar al cliente por llamada, WhatsApp o correo con un mensaje prearmado (la app no envía nada sola). Una pendiente no se cancela: se rechaza | SCRUM-284 | ✅ `cancelConfirmedRequest`, spec `docs/specs/SCRUM-284.md` |
| Plazo del abono | **Confirmada = abono listo** (o el admin decide confirmar igual). El plazo de **48 horas** corre sobre las solicitudes **pendientes**, desde que el cliente las envía o el admin las carga (provisorio y editable en Ajustes → Plazo del abono). Se guarda en la solicitud (`depositDueAt`) y no cambia si el admin edita el plazo después. Si vence sin el abono exigido, la pendiente se marca **"Abono vencido"** y el admin decide: contactar al cliente (llamar, correo o WhatsApp), **esperar** (plazo nuevo desde ese momento) o **cancelar** (queda "Cancelada"). **Nunca se cancela sola.** Registrar el abono no confirma sola: la tarjeta dice "Abono recibido: falta aprobar" y aprueba el admin. Las confirmadas no tienen plazo; las que no exigen abono (institución) tampoco | SCRUM-264 | `services/payments.ts` (`calculateInitialDepositDueAt`, `isDepositOverdue`), `requestsStore` (`cancelOverdueRequest`, `extendDepositDeadline`) | ✅ implementado el 11/11 (corrige el modelo del 10/11, que contaba desde la aprobación). Confirmar el plazo real con el cliente (D10) |
| Aprobar con abono pendiente | Al aprobar una solicitud a la que le falta abono (cualquier monto menor al exigido) se avisa "Falta el abono, ¿confirmar igual?". Solo el admin decide. Si confirma, queda **"Confirmada sin abono"** (sin plazo) | SCRUM-264 | `AdminConfirmarSinAbonoDialog`, `isConfirmedWithoutDeposit` | ✅ |
| Exención de abono | Los clientes de tipo **Institución** que reservan en restaurante no pagan abono (el Estado paga después): el abono exigido es $0, el total no cambia y el cliente ve que no necesita transferir. Particular, Empresa, Organización y Paseo escolar sí pagan. **Solo aplica a restaurante**, porque es el único servicio donde se registra el tipo de cliente | SCRUM-264 | `isDepositExempt` y `calculateBookingPrice` en `services/pricing.ts`; estado "Sin abono exigido" en `services/payments.ts` | ✅ implementado |
| Sin conexión y conflictos al reconectar | El admin puede registrar y confirmar sin internet; queda "Sin sincronizar". Al reconectar, el servidor decide: si choca con una confirmada, la reserva queda **"En conflicto, por resolver"** (no se pisa ni se pierde) y se avisa a un admin | SCRUM-250, 248 | — | ✅ Hecho (SCRUM-250). **Administrador (parte 2):** sin internet puede ver las solicitudes (última copia), cargar reservas, cambiar su estado, confirmar y registrar o quitar pagos; cada cambio queda guardado en el dispositivo con la marca "Sin sincronizar" y se envía en orden al volver la señal. Si una confirmación choca con otra reserva o supera un cupo, **no se pisa ni se pierde**: queda pendiente y "En conflicto" (aviso en el Inicio del panel) hasta que un administrador la mueva o la rechace; cualquier acción suya sobre ella quita la marca. Un cambio que el servidor rechaza por otra razón queda en "Sin sincronizar" con el motivo hasta descartarlo. No se puede cerrar sesión con cambios sin enviar, y el catálogo y los ajustes siguen necesitando conexión para editarse. **Cliente (parte 1):** sin señal la solicitud queda guardada en el teléfono ("Por enviar"), se reenvía sola con el mismo id (no se duplica) y, si el servidor la rechaza al reconectar (sin cupo, fecha ocupada), queda marcada con el motivo para que el cliente la descarte o llame. La app abre con la última copia del catálogo, los ajustes y la disponibilidad. La base de datos impedirá dos confirmadas cruzadas (restricción de exclusión sobre `confirmed`) |
| Alerta de pendiente antiguo | Una solicitud pendiente por más de 24 h se resalta, salvo las que no exigen abono (institución), que no alertan. El "Abono vencido" (48 h) es aparte y más grave | — | `AdminRequestsView.vue` (`isOldPending`) | ⚠️ está en la vista |
| Teléfono del cliente | Prefijo `+569` precargado y editable; teclado numérico. Solo el prefijo no pasa: se exigen 9 dígitos | SCRUM-25, 240 | `isClientPhoneValid` en `services/wizard.ts` y guards del router | ✅ |
| Categoría de cliente | Solo se pide en restaurante, no en cabañas ni en camping | SCRUM-25, 232 | Pasos de restaurante | por verificar |
| Comentarios | El cliente pide un sitio específico por comentario y no ve selector de ubicación | SCRUM-29 | Paso de camping | por verificar |
| Modificar una solicitud | El admin puede cambiar datos, personas y fechas de solicitudes pendientes o confirmadas. El total y el abono se recalculan con los porcentajes guardados en la solicitud; los pagos se conservan | SCRUM-59 | ✅ `applyRequestEdit` |
| Borrador del wizard | Se guarda en `sessionStorage` con la clave `ltr_wizard_draft` | — | `stores/reservationStore.ts` | ✅ |

## 2. Cabañas

| Regla | Valor | Historia | Estado |
|---|---|---|---|
| Capacidad | Cabañas de 6 y de 8 personas | SCRUM-27 | ❓ ¿Se permite una persona adicional? |
| Precio | Precio por noche × noches (+ IVA) | — | ✅ `calculateCabinPrice` |
| Horarios | Check-in 15:00 y check-out 11:00 (valores por defecto). **Se editan en Catálogo → Cabañas → "Horarios de las cabañas"** (selector de media en media hora) y el cliente los ve al elegir su cabaña | SCRUM-26, SCRUM-280 | ❓ Falta decidir si la hora es fija o flexible (pendiente de reunión interna) |
| Disponibilidad | Una cabaña con una reserva **confirmada** en las fechas, en intervalo `[entrada, salida)`, **no se ofrece a nadie** (ni cliente ni admin). Las **pendientes** no bloquean: el cliente ve la cabaña libre y el admin la ve con un aviso dentro de su tarjeta | SCRUM-60, 260, 263 | ✅ `isCabinAvailable` (solo confirmadas) y `getPendingCabinOverlaps` (aviso) |
| Reserva del admin | **El admin elige en un modal al tocar Enviar** (cabaña, camping y restaurante) si la carga como **Pendiente de abono** (por defecto; con plazo de 48 h) o **Confirmada**, y puede anotar el abono que ya recibió (monto y medio). Una confirmada con abono incompleto queda "Confirmada sin abono". No se puede cargar como confirmada si choca con otra confirmada; los cruces con pendientes no lo impiden. Con una confirmada en la cabaña, no se puede elegir | SCRUM-56, 260, 264 | ✅ `puedeConfirmarseNueva` en `services/cruces.ts` y `ModalEstadoReservaAdmin` (corrige el estado automático por cruces del 10/11) |
| Mantención | Una cabaña con la marca **"En mantención"** no sale para nuevas reservas, ni para el cliente ni para el admin (paso 2 y calendario), hasta que el admin la desactive. No tiene fechas. Las reservas existentes no cambian. Si la cabaña tiene reservas activas por venir, se avisa al admin al activar la marca (lista de reservas, sin tocarlas). Si todas las cabañas que le sirven al grupo están en mantención, esas fechas se bloquean en el calendario del cliente. Se activa desde Catálogo (menú de la cabaña o formulario) | SCRUM-266 | `isCabinInMaintenance`, `getBookableCabins`, `getUpcomingCabinRequests` en `services/availability.ts`; campo `enMantencion` | ✅ implementado el 11/11. ❓ Si camping y restaurante también necesitan el check (D12, a preguntar al cliente) |
| Varias cabañas para una familia | El **admin las enlaza al registrar**: una solicitud por cabaña unidas por `grupoId`, y se confirman todas o ninguna | SCRUM-265 | ❌ decidido el 10/11, falta implementar. ❓ Reparto de personas entre cabañas y si el total y el abono se calculan juntos o por cabaña |
| Varias cabañas por solicitud del cliente | Pendiente de decisión | SCRUM-27 | ❓ Ver `docs/specs/SCRUM-27.md` |

## 3. Camping

| Regla | Valor | Historia | Estado |
|---|---|---|---|
| Modalidades | `diario` (9:00 a 19:30) y `pernoctar` (12:00 a 11:00 del día siguiente). **Los horarios se editan en Catálogo → Camping → "Horarios del camping"**; por el día, la salida debe ser después del ingreso | SCRUM-31, SCRUM-280 | ❓ El horario de pernoctar está marcado "por definir" |
| Espacio general | De 1 a 9 personas | SCRUM-30 | ✅ `validateGuestCapacity` con el rango del catálogo |
| Espacio grande (isla, terraza) | De 10 a 150 personas; con menos de 10 no se asigna ni se puede pedir. **No es un tipo especial:** se distingue de los demás solo por su rango de personas (sin etiqueta "Grupos y eventos" ni casilla en el catálogo). La columna `es_especial` de la base queda sin uso | SCRUM-30, 277 | ✅ por catálogo (`minCapacity: 10`) |
| Precio | Por persona × noches (el día cuenta como 1) | SCRUM-30 | ⚠️ Ambos espacios tienen hoy el mismo precio por defecto ($10.000), pero SCRUM-30 dice que los grandes tienen otro precio |
| Características del espacio | Baño propio, fogón techado, piso de cemento | SCRUM-30 | por verificar que se muestren |
| Asignación del espacio | **Por el día (`diario`) no hay espacios grandes ni pequeños: todos son iguales.** Sirve cualquier grupo (hasta el cupo del día), el cliente ve una sola tarjeta "Día de campo" sin nombre de espacio ni rango de personas, y el rango del espacio no se exige ni al crear (`crear_solicitud`, migración 10) ni al editar la solicitud; internamente se anota el espacio que cubre al grupo o, si ninguno, el más grande (SCRUM-277). **Al pernoctar:** se asigna el espacio que cubre la cantidad de personas **y** admite la modalidad elegida. **Cada espacio es "Día y noche" o "Solo de día"** (no hay espacios solo para pernoctar; los antiguos pasan a "Día y noche"). Si hay varios, el de menor capacidad. Si no hay ninguno, se avisa al cliente y no se avanza | SCRUM-240 | ✅ `findCampingSite` en `services/wizard.ts`. Los datos de ejemplo usan `ambos` en los dos espacios; si el admin deja un espacio solo en "diario", los grupos que quieran pernoctar en él no tendrán espacio |
| Mensaje de abono | El mismo mensaje amarillo que en cabañas | SCRUM-32 | ✅ `DepositInfoCard` |
| Reglamento | El administrador sube el reglamento en PDF desde Ajustes (hasta 10 MB; puede reemplazarlo o quitarlo). El cliente de camping ve el enlace "Reglamento del camping" en el último paso, antes de enviar y en la confirmación, y se abre en una pestaña nueva. Si no hay PDF, no aparece nada. Con Supabase el archivo vive en el bucket público `documentos` y su enlace en el ajuste `reglamento_camping`; cada versión tiene su propia ruta y la anterior se borra | SCRUM-51 | ✅ `subirReglamentoCamping` / `quitarReglamentoCamping` en `settingsStore`, `AdminReglamentoCard` y `ReglamentoCampingCard`; migración 8 |
| Capacidad total | 150 personas por modalidad: el cupo de `diario` y el de `pernoctar` son separados y no se suman | SCRUM-244 | ✅ `capacityRules.maxCampingPeopleCapacity`, usado por el bloqueo de fechas y el sobrecupo |

## 4. Restaurante

| Regla | Valor | Historia | Estado |
|---|---|---|---|
| Horarios | Desayuno 08:30–11:00, almuerzo 12:30–14:00, once 17:00–19:30. **El cliente elige la hora de cada comida en una lista desplegable** que parte en "Elige la hora" y se puede cambiar. La lista trae todas las medias horas exactas (:00 y :30) del horario, extremos incluidos; si el administrador cambia el horario, la lista cambia sola (12:45–14:15 da 13:00, 13:30 y 14:00). Una hora guardada que ya no está en la lista cuenta como no elegida. **El administrador fija desde y hasta de cada comida en Catálogo → Menú → "Horarios del restaurante"**, con selector de media en media hora y una vista previa de las horas que verá el cliente; la última hora no puede ser antes de la primera | SCRUM-37, SCRUM-280 | ✅ `horasDeComida` y `validarHoraComida` en `services/availability.ts`; edición y validación en `services/horarios.ts`; el horario sale de `settingsStore.restaurantSchedules` (la lista `times` se regenera al guardar, pero el cliente no la lee) |
| Grupos de más de 30 personas | Máximo 3 menús distintos **por comida** (desayuno, almuerzo y once se cuentan por separado), con mensaje explicativo al llegar al límite. Si el grupo crece después de elegir platos y queda sobre el límite, se avisa y no se puede avanzar. El 30 y el 3 son editables en Ajustes | SCRUM-36, 244 | ✅ `services/menus.ts` y `capacityRules.menuLargeGroupThreshold` / `maxMenuVarietiesLargeGroup` |
| Acompañamientos | Modo `none`, `fixed` (acompañamiento fijo, ej. asado de cordero) o `choice` (el cliente elige). **Solo el almuerzo lleva acompañamiento: el desayuno y la once se sirven completos** (decidido el 18/11); lo que antes era su acompañamiento fijo pasa a la descripción. El administrador crea, renombra y elimina acompañamientos globales; uno que ofrece algún plato activo no se puede eliminar (se avisa cuáles lo usan); un plato `fixed` exige el acompañamiento y uno `choice` al menos una opción. Al editar un plato, las opciones se agregan con el selector del teléfono | SCRUM-35, 62, 229 | ✅ `comidaAdmiteAcompanamiento`, `aplicarReglaDeAcompanamiento`, `validarPlato` y `platosQueUsanAcompanamiento` en `services/menus.ts`; se aplica al guardar, al leer de Supabase y al migrar datos locales |
| Cupo por horario | Reemplazado por el aforo en personas de los espacios (ver más abajo) | SCRUM-244 | `maxRestaurantGroupsPerSlot` quedó sin uso y ya no se muestra en Ajustes |
| Precio | Suma de platos × cantidad (+ IVA) | — | ✅ `calculateRestaurantPrice` |
| Espacios y capacidad | Comedor principal 120 personas, carpa 50, comedor secundario 30 (total 200) | SCRUM-244 (reunión con el cliente) | ✅ Capacidades editables en Catálogo → Menú → "Cupos del restaurante" (`capacityRules.restaurantSpaces`); el total (200) limita las personas en el paso 1. **El aforo se mide por comida** (desayuno, almuerzo y once se cuentan por separado), decidido con el cliente hasta ahora; **confirmar en la próxima reunión** (D13) y respetar esta regla mientras tanto. ❓ Falta decidir cómo se asigna el espacio a un grupo |
| Sobrecupo en el calendario | Restaurante: personas de una misma comida > capacidad total. Camping: personas del día de una misma modalidad > capacidad del camping. Cabañas: no aplica por personas; se avisa el cruce de fechas de la misma cabaña (SCRUM-60) | SCRUM-244 | ✅ `getDayOccupancy`, medido por comida (a confirmar en la próxima reunión, D13) |

## 4b. Piscina (SCRUM-44)

La piscina es gratis para quien reserva cabaña, camping o restaurante (la app no puede saber quién reservó, así que solo se avisa en pantalla). La opción "Piscina" del home es para quien **solo** va a la piscina. Es una **solicitud solo informativa**: sirve para que el administrador sepa quién viene.

| Regla | Valor | Historia | Estado |
|---|---|---|---|
| Flujo del cliente | Fecha y personas → nombre y teléfono → resumen y envío (3 pasos). Cualquier fecha futura; sin tope de personas | SCRUM-44 | ✅ |
| Precio | Personas × precio de la entrada. Es el valor final: **sin IVA aparte y sin abono**. Editable en Ajustes → "Entrada a la piscina". **Valor de ejemplo provisorio: $3.000** | SCRUM-44 | ✅ `calculatePoolPrice` en `services/pricing.ts`. ❓ Precio real, precio de niños y si lleva IVA (SCRUM-270) |
| Estado | Queda **confirmada** al enviarse (sin Pendiente, sin plazo, sin alertas, sin aprobación). El admin puede cancelarla | SCRUM-44 | ✅ `reservationStore.submitReservationRequest` |
| Cruces y cupos | No tiene tope, no bloquea fechas ni cupos de nada y no genera cruces (`findConflicts` solo mira cabaña, restaurante y camping) | SCRUM-44 | ✅ |
| Admin | La ve en la lista (filtro "Piscina") y en el calendario (filtro propio). Puede cambiar fecha y personas: el total se recalcula con el mismo valor por persona. También puede cargarla desde "Nueva reserva" (queda confirmada) | SCRUM-44 | ✅ |

## 5. Bloqueo de fechas en el calendario del cliente

Decidido el 8/11 (SCRUM-244) y **corregido el 10/11 (SCRUM-263)**: bloquean solo las solicitudes **confirmadas** (`confirmed`). Las pendientes no bloquean al cliente; dos clientes pueden pedir el mismo día y el admin decide cuál confirmar. Funciones en `services/availability.ts`.

> Estado del código (SCRUM-263, hecho): `isCabinAvailable`, `getFullMeals` y `isCampingDayBlocked` cuentan solo confirmadas. `getDayOccupancy` y `findConflicts` siguen contando pendientes y confirmadas, porque muestran la demanda al admin. Al terminar, el cliente ve: "Tu solicitud queda pendiente. La fecha se asegura al confirmar y abonar".

| Servicio | Una fecha se bloquea cuando… | Detalle |
|---|---|---|
| Cabañas | Todas las cabañas con capacidad para el grupo están ocupadas esa noche | Depende de las personas indicadas. Una estadía se bloquea si ninguna cabaña que le sirve está libre **todas** las noches (una solicitud lleva una sola cabaña). El día de salida puede ser un día ocupado. Si el grupo supera la cabaña más grande no se bloquea nada (lo resuelve SCRUM-27) |
| Restaurante | Las tres comidas están llenas para el grupo (personas ya reservadas + grupo > capacidad total) | Las comidas llenas se deshabilitan una a una en el paso 1. Las solicitudes antiguas sin comida definida no cuentan en ninguna comida |
| Camping | Las personas ya reservadas de esa modalidad + el grupo superan la capacidad del camping | `diario` y `pernoctar` tienen cupos separados. En `pernoctar` se revisa cada noche de la estancia. Las solicitudes antiguas sin modalidad cuentan como `pernoctar` |

**El admin tiene el mismo bloqueo por confirmadas** (corregido el 10/11): no se le ofrece una cabaña ni un cupo ya confirmado. Sí puede registrar sobre fechas con solo pendientes; la reserva entra pendiente y con aviso.

### Solapamientos entre solicitudes (SCRUM-60, 262, 263)

**Modelo:** una pendiente es una intención y una confirmada es un compromiso. Los cruces se avisan siempre, pero solo uno puede quedar confirmado. Nada se rechaza ni cancela solo: la decisión es del admin. Función: `findConflicts` en `services/availability.ts`.

| Servicio | Hay solapamiento cuando… |
|---|---|
| Cabañas | La misma cabaña tiene fechas que se cruzan, en intervalo `[entrada, salida)` |
| Restaurante | Las personas de una misma comida y día superan la capacidad total del restaurante |
| Camping | Las personas de un mismo día y modalidad superan la capacidad del camping (diario y pernoctar por separado) |

**Qué cuenta para cada cosa**

| Efecto | Cuenta |
|---|---|
| Bloqueo al cliente y al admin al elegir | Solo confirmadas |
| Aviso de cruce y de sobrecupo del admin | Pendientes y confirmadas (muestra la demanda) |
| Rechazadas y canceladas | Nunca cuentan |

**Combinaciones y qué pasa**

| Caso | Resultado |
|---|---|
| Pendiente + pendiente | Conviven; ambas muestran "Se cruza" |
| Pendiente + confirmada (la pendiente llegó antes o después) | La pendiente queda **"Por mover"** (15/11): no tiene botón Aprobar, solo **Mover fecha** o Rechazar (abajo) |
| Confirmada + confirmada | No debe ocurrir. Con Supabase lo impide la base de datos; sin conexión queda "En conflicto, por resolver" |

**Resolver al confirmar (SCRUM-262).** Al aprobar una solicitud que se cruza, el admin ve siempre un diálogo con las solicitudes que chocan y sus días, precio y cercanía de la fecha, y elige cuál confirmar. Para cada una que no queda confirmada: botones rápidos de **llamar, correo y WhatsApp** con mensaje prearmado, **Modificar fecha** (SCRUM-59) o **Rechazar**. La app nunca envía mensajes sola. El mensaje no propone fechas: el cliente responde y el admin mueve la fecha o rechaza. Una solicitud que chocaría con una ya confirmada **no se puede confirmar** (`puedeConfirmarse` en `services/cruces.ts`) y, desde el 15/11, **tampoco se ofrece**: la tarjeta, el detalle y el diálogo muestran **Mover fecha** en lugar de Aprobar, con quién ocupa la fecha (`solicitudesPorMover` y `describirBloqueo`; en el store, `porMoverPorId`). **Mover fecha** abre una hoja propia con quién ocupa la fecha, los botones de llamar, WhatsApp y correo (mensaje prearmado, sin proponer fechas) y solo el calendario, sin editar los demás datos. **Rechazar** desde la lista pregunta directo, sin abrir el detalle. Rechazada y cancelada se muestran juntas como **"Descartada"** (un filtro, una etiqueta, un gris; en los datos siguen siendo dos estados). Cada estado se ve con insignia de color, ícono y texto, y una franja de color en la tarjeta; la sección tiene botón "?" que lo explica. Los filtros de estado son Pendientes, Confirmadas y Descartadas. La lista de Solicitudes tiene un acceso "Por mover de fecha" que filtra esas pendientes y no se combina con el filtro de estado. El diálogo de cruces queda para elegir entre pendientes que compiten; al confirmar una, las demás pasan solas a "Por mover". "Por mover" no es un estado guardado: se calcula. El diálogo muestra el **grupo completo** de solicitudes que compiten (incluidas las cadenas). Al **mover la fecha** de una solicitud, el calendario no deja elegir días con reservas confirmadas (cabaña, cupo de restaurante y de camping) y marca los que solo tienen pendientes; el administrador no puede forzar un día bloqueado. Estado: ✅ implementado en SCRUM-262.

**Cómo se ve la disponibilidad en el calendario del admin (SCRUM-267, decidido el 15/11).** Funciones `getResumenDia` (la casilla), `getDetalleDia` y `reservasDeFranja` (el modal) en `services/availability.ts`. El filtro es de selección única: Todo, Cabañas, Camping, Restaurante o Piscina. Cada casilla del día responde tres preguntas con tres canales distintos, y solo usa dos colores:

| Pregunta del admin | Canal | Regla |
|---|---|---|
| ¿Cuánto trabajo tengo? | **Número** en la casilla | Reservas **confirmadas** del día de los servicios del filtro. No cuenta las pendientes ni la piscina (la piscina solo cuenta si es el único servicio visto) |
| ¿Ya no puedo vender? | **Fondo rojo** | Lleno: ver abajo |
| ¿Hay algo que resolver? | **Punto ámbar** en la esquina | Hay solicitudes pendientes, o reservas que se topan (la misma cabaña con dos reservas, o personas confirmadas + pendientes sobre la capacidad) |

**Cuándo está lleno:**
- Cabañas: todas las cabañas reservables (sin las que están en mantención) tienen una confirmada.
- Restaurante: las tres comidas llegan a la capacidad con lo confirmado.
- Camping: diario y pernoctar llegan a la capacidad.
- Piscina: nunca (no tiene tope).
- **Todo:** solo cuando **todos** los servicios con tope están llenos. Un servicio lleno no pinta el día de rojo.

**Modal del día:** una fila por servicio con su cupo ("Cabañas · con cupo · 1 de 2 cabañas", cada comida y cada modalidad del camping). Al tocar una fila se despliegan las reservas de ese servicio, con el borde de color por estado igual que en Solicitudes (verde confirmada, ámbar pendiente, rojo rechazada, gris cancelada) y la marca "Se cruza". Solo aparecen las solicitudes activas (pendientes y confirmadas): las rechazadas y canceladas no ocupan el día.

**Decisiones de este diseño:** no hay "con cupo" en la grilla (el cupo exacto va en el modal); los pendientes y los que se topan comparten una sola marca; los pendientes no bloquean ni suman al número. Las restaurante sin comida definida no cuentan en ninguna fila. Falta la marca del evento especial: depende de SCRUM-261.

**Eventos especiales (SCRUM-261, bloqueada).** Se tratan como restaurante completo y confirmado. Hay decisiones de diseño pendientes (ver D6).

## 6. Contacto del negocio

Los datos de `ContactView` salen de `settingsStore.contactInfo` y se editan desde `AdminContactEditModal` (SCRUM-231).
Los enlaces de Instagram y web se generan en `lib/contactLinks.ts` a partir de lo que escribe el admin. **El mapa y el enlace "Cómo llegar" salen de un punto exacto** que el admin marca en Ajustes → Datos del negocio → Contacto → "Marcar en el mapa" (SCRUM-281): mapa de OpenStreetMap con Leaflet, sin clave; toca el mapa o arrastra el pin, busca una dirección o usa su ubicación actual. Se guardan `latitude` y `longitude` en el ajuste `contacto` (sin migración: es JSON) y de ahí salen `mapsUrl` e `iframeMapUrl` (`services/ubicacion.ts`). La dirección escrita es solo una **referencia opcional** ("Referencia de la dirección"): cambiarla no mueve el mapa, y si el admin la deja vacía el cliente ve la de siempre (`DIRECCION_POR_DEFECTO`: "Sector Repil s/n, Comuna de Fresia, Región de Los Lagos, Chile"; `direccionParaMostrar` y `settingsStore.direccionDelLocal`). Si aún no hay punto guardado, el mapa parte del lugar del local.

- Teléfonos por defecto: +56 9 8502 5056 y +56 9 5883 3853 (el segundo se corrigió el 8/11 según la reunión con el cliente; antes decía +56 9 9588 3385). `settingsStore.ts` reemplaza solo el número antiguo si el navegador lo tenía guardado.
- Ubicación del mapa (corregida el 8/11): "Turismo Los Troncos de Repil", coordenadas -41.0616375, -73.647016. Los valores anteriores tenían el signo positivo y apuntaban a otro lugar; `settingsStore.ts` los reemplaza solos si el navegador los tenía guardados.
- Sitio web por defecto: `fresianatural.cl` (abre `https://www.fresianatural.cl/troncos-de-repil-fresia-natural.html`).

## 6b. Fotos del inicio (SCRUM-271)

| Regla | Valor | Historia | Estado |
|---|---|---|---|
| Tarjetas con foto editable | Las cinco del inicio: Cabaña, Camping, Restaurante, Piscina y Evento especial. El administrador cambia cada foto desde Ajustes → Contenido para el cliente → "Fotos del inicio" (con vista previa de la tarjeta y su texto) o la restaura con "Volver a la original" | SCRUM-271 | ✅ `AdminFotosInicioCard`, `cambiarFotoInicio` en `settingsStore` |
| Foto provisoria | Sin foto subida se muestra la provisoria (Unsplash, en `services/fotosInicio.ts`); si la foto no carga, queda el fondo verde. Los datos viven en el ajuste `fotos_inicio` (una foto por tarjeta; vacía = provisoria) | SCRUM-271 | ✅ migración 9 abre su lectura pública |
| Legibilidad del texto | Todas las tarjetas llevan un oscurecimiento leve (12 %) y un degradado inferior reforzado (90 %), para que el texto blanco se lea con cualquier foto. La foto se recorta (`object-cover`) en tarjetas de ancho completo y de media columna | SCRUM-271 | ✅ `FondoFotoTarjeta` |
| Peso de la foto | Se comprime a 1200 px de ancho (JPEG 80 %) antes de guardar. Hasta SCRUM-248 con almacenamiento local solo se ve en el navegador de quien la sube; con Supabase se guarda en la base y la ve todo cliente | SCRUM-271 | ⚠️ pasar a Storage junto con el catálogo (SCRUM-248) |

## 7. Decisiones abiertas que bloquean la entrega

| # | Pregunta | A quién | Para cuándo |
|---|---|---|---|
| D1 | Horarios de ingreso y salida de pernoctar | Cliente | **Resuelta provisoriamente (8/11):** se usan los valores por defecto, editables por el admin y visibles para el cliente. Confirmar los reales con el cliente |
| D2 | Check-in y check-out de cabañas: ¿fijos o flexibles? | Cliente | **Resuelta provisoriamente (8/11):** se muestran como horario fijo editable (15:00 y 11:00). Confirmar con el cliente |
| D3 | Datos reales de transferencia para el paso 4 (SCRUM-233) | Cliente | **Resuelta provisoriamente (8/11):** datos de ejemplo, editables por el admin desde Configuración y visibles para el cliente. Cargar los reales cuando el cliente los entregue. Implementado en SCRUM-233: `settingsStore.transferInfo`, editable en Ajustes → Datos de transferencia y mostrado en `DepositInfoCard` (paso 4) |
| D4 | ¿Los precios incluyen IVA? | Cliente | No incluyen iva |
| D5 | Precio del espacio grande de camping | Cliente | No se sabe pero tambien debe ser editable |
| D6 | ¿Qué hace "evento especial" en una reserva del admin? (SCRUM-56, 261 y HU-4.2) | Cliente | **Respuesta parcial (10/11):** es un evento grande (boda, cumpleaños). El cliente debe contactar al admin: en el home hay una opción "Evento especial" que muestra los contactos (llamar y WhatsApp), no abre un wizard (✅ SCRUM-45: tarjeta con foto en el home que abre un panel desde abajo (`HojaContactoEvento`) con los dos teléfonos de Ajustes, cada uno con botones de llamar y WhatsApp; no se muestra en modo administrador). El admin lo registra y **bloquea todo el restaurante** (los tres espacios, 200 cupos); puede llevar extras (camping o cabaña) como reservas enlazadas (SCRUM-265). **Pendiente (SCRUM-261):** si un evento nocturno bloquea solo la noche o también la cena del día, cómo se modela un horario fuera de las tres comidas y qué pasa con la marca `isSpecialEvent` |
| D8 | Plazo del abono | Cliente | **Resuelta provisoriamente (10/11, corregida el 11/11):** 48 horas sobre las solicitudes pendientes, desde que se envían, editable. Confirmar el plazo real |
| D9 | Exención de abono para instituciones | Cliente | **Resuelta (10/11):** solo "Institución" en restaurante (único servicio con tipo de cliente). Particular, Empresa, Organización y Paseo escolar pagan (10/11, ampliado el 11/11 al reemplazar Colegio por Paseo escolar y agregar Organización) |
| D10 | Plazo real del abono (provisorio: 48 h) | Cliente, en la reunión | Preguntar |
| D11 | Reparto de personas entre cabañas de una familia y si el total y el abono se calculan juntos o por cabaña (SCRUM-265) | Cliente, en la reunión | Preguntar |
| D14 | Piscina: precio real de la entrada, precio de niños y si el valor lleva IVA (SCRUM-44, SCRUM-270) | Cliente | **Provisorio:** $3.000 por persona, final y sin IVA aparte, editable en Ajustes |
| D12 | ¿Camping y restaurante también necesitan la marca "En mantención"? (SCRUM-266) | Cliente, en la reunión | Preguntar |
| D13 | ¿El aforo del restaurante se mide por comida o por hora? (SCRUM-244) | Cliente, en la próxima reunión | **Resuelta provisoriamente (10/11): por comida**, que es lo que el cliente ha dicho hasta ahora. Se respeta esa regla y se confirma en la reunión. Si cambia a "por hora", hay que ajustar `getFullMeals`, `getDayOccupancy`, `findConflicts` y el bloqueo del calendario (todas miden hoy por comida) |
| D7 | Varias cabañas por solicitud o redirigir a contacto directo (SCRUM-27) | Equipo | **Aplazada (8/11):** SCRUM-27 se movió al Sprint 3 hasta confirmar los datos pendientes |
