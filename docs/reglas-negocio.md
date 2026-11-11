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
| Plazo del abono | **Confirmada = abono listo** (o el admin decide confirmar igual). El plazo de **48 horas** corre sobre las solicitudes **pendientes**, desde que el cliente las envía o el admin las carga (provisorio y editable en Ajustes → Plazo del abono). Se guarda en la solicitud (`depositDueAt`) y no cambia si el admin edita el plazo después. Si vence sin el abono exigido, la pendiente se marca **"Abono vencido"** y el admin decide: contactar al cliente (llamar, correo o WhatsApp), **esperar** (plazo nuevo desde ese momento) o **cancelar** (queda "Cancelada"). **Nunca se cancela sola.** Registrar el abono no confirma sola: la tarjeta dice "Abono recibido: falta aprobar" y aprueba el admin. Las confirmadas no tienen plazo; las que no exigen abono (institución) tampoco | SCRUM-264 | `services/payments.ts` (`calculateInitialDepositDueAt`, `isDepositOverdue`), `requestsStore` (`cancelOverdueRequest`, `extendDepositDeadline`) | ✅ implementado el 11/11 (corrige el modelo del 10/11, que contaba desde la aprobación). Confirmar el plazo real con el cliente (D10) |
| Aprobar con abono pendiente | Al aprobar una solicitud a la que le falta abono (cualquier monto menor al exigido) se avisa "Falta el abono, ¿confirmar igual?". Solo el admin decide. Si confirma, queda **"Confirmada sin abono"** (sin plazo) | SCRUM-264 | `AdminConfirmarSinAbonoDialog`, `isConfirmedWithoutDeposit` | ✅ |
| Exención de abono | Los clientes de tipo **Institución** que reservan en restaurante no pagan abono (el Estado paga después): el abono exigido es $0, el total no cambia y el cliente ve que no necesita transferir. Particular, Empresa, Organización y Paseo escolar sí pagan. **Solo aplica a restaurante**, porque es el único servicio donde se registra el tipo de cliente | SCRUM-264 | `isDepositExempt` y `calculateBookingPrice` en `services/pricing.ts`; estado "Sin abono exigido" en `services/payments.ts` | ✅ implementado |
| Sin conexión y conflictos al reconectar | El admin puede registrar y confirmar sin internet; queda "Sin sincronizar". Al reconectar, el servidor decide: si choca con una confirmada, la reserva queda **"En conflicto, por resolver"** (no se pisa ni se pierde) y se avisa a un admin | SCRUM-250, 248 | — | ❌ Debe estar en la entrega del 27/11. La base de datos impedirá dos confirmadas cruzadas (restricción de exclusión sobre `confirmed`) |
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
| Horarios | Check-in 15:00 y check-out 11:00 (valores por defecto, editables) | SCRUM-26 | ❓ Falta decidir si la hora es fija o flexible (pendiente de reunión interna) |
| Disponibilidad | Una cabaña con una reserva **confirmada** en las fechas, en intervalo `[entrada, salida)`, **no se ofrece a nadie** (ni cliente ni admin). Las **pendientes** no bloquean: el cliente ve la cabaña libre y el admin la ve con un aviso dentro de su tarjeta | SCRUM-60, 260, 263 | ✅ `isCabinAvailable` (solo confirmadas) y `getPendingCabinOverlaps` (aviso) |
| Reserva del admin | **El admin elige al final** si la carga como **Pendiente de abono** (por defecto; con plazo de 48 h) o **Confirmada**, y puede anotar el abono que ya recibió (monto y medio). Una confirmada con abono incompleto queda "Confirmada sin abono". No se puede cargar como confirmada si choca con otra confirmada; los cruces con pendientes no lo impiden. Con una confirmada en la cabaña, no se puede elegir | SCRUM-56, 260, 264 | ✅ `puedeConfirmarseNueva` en `services/cruces.ts` y `SelectorEstadoReservaAdmin` (corrige el estado automático por cruces del 10/11) |
| Mantención | Una cabaña con la marca **"En mantención"** no sale para nuevas reservas, ni para el cliente ni para el admin, hasta que el admin la desactive. No tiene fechas. Las reservas existentes no cambian y se avisa si tiene reservas futuras activas | SCRUM-266 | ❌ decidido el 10/11, falta implementar. ❓ Si camping y restaurante también necesitan el check (D12, a preguntar al cliente) |
| Varias cabañas para una familia | El **admin las enlaza al registrar**: una solicitud por cabaña unidas por `grupoId`, y se confirman todas o ninguna | SCRUM-265 | ❌ decidido el 10/11, falta implementar. ❓ Reparto de personas entre cabañas y si el total y el abono se calculan juntos o por cabaña |
| Varias cabañas por solicitud del cliente | Pendiente de decisión | SCRUM-27 | ❓ Ver `docs/specs/SCRUM-27.md` |

## 3. Camping

| Regla | Valor | Historia | Estado |
|---|---|---|---|
| Modalidades | `diario` (9:00 a 19:30) y `pernoctar` (12:00 a 11:00 del día siguiente) | SCRUM-31 | ❓ El horario de pernoctar está marcado "por definir" |
| Espacio general | De 1 a 9 personas | SCRUM-30 | ✅ `validateGuestCapacity` con el rango del catálogo |
| Espacio grande (isla, terraza) | De 10 a 150 personas; con menos de 10 no se asigna ni se puede pedir | SCRUM-30 | ✅ por catálogo (`minCapacity: 10`) |
| Precio | Por persona × noches (el día cuenta como 1) | SCRUM-30 | ⚠️ Ambos espacios tienen hoy el mismo precio por defecto ($10.000), pero SCRUM-30 dice que los grandes tienen otro precio |
| Características del espacio | Baño propio, fogón techado, piso de cemento | SCRUM-30 | por verificar que se muestren |
| Asignación del espacio | Se asigna el espacio que cubre la cantidad de personas **y** admite la modalidad elegida (`diario`, `pernoctar` o `ambos`). Si hay varios, el de menor capacidad. Si no hay ninguno, se avisa al cliente y no se avanza | SCRUM-240 | ✅ `findCampingSite` en `services/wizard.ts`. Los datos de ejemplo usan `ambos` en los dos espacios; si el admin deja un espacio solo en "diario", los grupos que quieran pernoctar en él no tendrán espacio |
| Mensaje de abono | El mismo mensaje amarillo que en cabañas | SCRUM-32 | ✅ `DepositInfoCard` |
| Capacidad total | 150 personas por modalidad: el cupo de `diario` y el de `pernoctar` son separados y no se suman | SCRUM-244 | ✅ `capacityRules.maxCampingPeopleCapacity`, usado por el bloqueo de fechas y el sobrecupo |

## 4. Restaurante

| Regla | Valor | Historia | Estado |
|---|---|---|---|
| Horarios | Desayuno 08:30–11:00, almuerzo 12:30–14:00, once 17:00–19:30 (bloques de 30 min) | — | ✅ `generateTimeSlots` y `settingsStore` |
| Grupos de más de 30 personas | Máximo 3 menús distintos **por comida** (desayuno, almuerzo y once se cuentan por separado), con mensaje explicativo al llegar al límite. Si el grupo crece después de elegir platos y queda sobre el límite, se avisa y no se puede avanzar. El 30 y el 3 son editables en Ajustes | SCRUM-36, 244 | ✅ `services/menus.ts` y `capacityRules.menuLargeGroupThreshold` / `maxMenuVarietiesLargeGroup` |
| Acompañamientos | Modo `none`, `fixed` (acompañamiento fijo, ej. asado de cordero) o `choice` (el cliente elige) | SCRUM-35, 62, 229 | ✅ en el cliente. ❌ falta el CRUD de administración (SCRUM-229) |
| Cupo por horario | Reemplazado por el aforo en personas de los espacios (ver más abajo) | SCRUM-244 | `maxRestaurantGroupsPerSlot` quedó sin uso y ya no se muestra en Ajustes |
| Precio | Suma de platos × cantidad (+ IVA) | — | ✅ `calculateRestaurantPrice` |
| Espacios y capacidad | Comedor principal 120 personas, carpa 50, comedor secundario 30 (total 200) | SCRUM-244 (reunión con el cliente) | ✅ Capacidades editables en Ajustes (`capacityRules.restaurantSpaces`); el total (200) limita las personas en el paso 1. **El aforo se mide por comida** (desayuno, almuerzo y once se cuentan por separado), decidido con el cliente hasta ahora; **confirmar en la próxima reunión** (D13) y respetar esta regla mientras tanto. ❓ Falta decidir cómo se asigna el espacio a un grupo |
| Sobrecupo en el calendario | Restaurante: personas de una misma comida > capacidad total. Camping: personas del día de una misma modalidad > capacidad del camping. Cabañas: no aplica por personas; se avisa el cruce de fechas de la misma cabaña (SCRUM-60) | SCRUM-244 | ✅ `getDayOccupancy`, medido por comida (a confirmar en la próxima reunión, D13) |

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
| Pendiente + confirmada (la pendiente llegó antes o después) | La pendiente avisa y ofrece la misma salida de rechazo (abajo) |
| Confirmada + confirmada | No debe ocurrir. Con Supabase lo impide la base de datos; sin conexión queda "En conflicto, por resolver" |

**Resolver al confirmar (SCRUM-262).** Al aprobar una solicitud que se cruza, el admin ve siempre un diálogo con las solicitudes que chocan y sus días, precio y cercanía de la fecha, y elige cuál confirmar. Para cada una que no queda confirmada: botones rápidos de **llamar, correo y WhatsApp** con mensaje prearmado, **Modificar fecha** (SCRUM-59) o **Rechazar**. La app nunca envía mensajes sola. El mensaje no propone fechas: el cliente responde y el admin mueve la fecha o rechaza. Una solicitud que chocaría con una ya confirmada **no se puede confirmar** (`puedeConfirmarse` en `services/cruces.ts`). El diálogo muestra el **grupo completo** de solicitudes que compiten (incluidas las cadenas). Al **mover la fecha** de una solicitud, el calendario no deja elegir días con reservas confirmadas (cabaña, cupo de restaurante y de camping) y marca los que solo tienen pendientes; el administrador no puede forzar un día bloqueado. Estado: ✅ implementado en SCRUM-262.

**Eventos especiales (SCRUM-261, bloqueada).** Se tratan como restaurante completo y confirmado. Hay decisiones de diseño pendientes (ver D6).

## 6. Contacto del negocio

Los datos de `ContactView` salen de `settingsStore.contactInfo` y se editan desde `AdminContactEditModal` (SCRUM-231).
Los enlaces (mapa, Instagram, web) se generan en `lib/contactLinks.ts` a partir de lo que escribe el admin.

- Teléfonos por defecto: +56 9 8502 5056 y +56 9 5883 3853 (el segundo se corrigió el 8/11 según la reunión con el cliente; antes decía +56 9 9588 3385). `settingsStore.ts` reemplaza solo el número antiguo si el navegador lo tenía guardado.
- Ubicación del mapa (corregida el 8/11): "Turismo Los Troncos de Repil", coordenadas -41.0616375, -73.647016. Los valores anteriores tenían el signo positivo y apuntaban a otro lugar; `settingsStore.ts` los reemplaza solos si el navegador los tenía guardados.
- Sitio web por defecto: `fresianatural.cl` (abre `https://www.fresianatural.cl/troncos-de-repil-fresia-natural.html`).

## 7. Decisiones abiertas que bloquean la entrega

| # | Pregunta | A quién | Para cuándo |
|---|---|---|---|
| D1 | Horarios de ingreso y salida de pernoctar | Cliente | **Resuelta provisoriamente (8/11):** se usan los valores por defecto, editables por el admin y visibles para el cliente. Confirmar los reales con el cliente |
| D2 | Check-in y check-out de cabañas: ¿fijos o flexibles? | Cliente | **Resuelta provisoriamente (8/11):** se muestran como horario fijo editable (15:00 y 11:00). Confirmar con el cliente |
| D3 | Datos reales de transferencia para el paso 4 (SCRUM-233) | Cliente | **Resuelta provisoriamente (8/11):** datos de ejemplo, editables por el admin desde Configuración y visibles para el cliente. Cargar los reales cuando el cliente los entregue. Implementado en SCRUM-233: `settingsStore.transferInfo`, editable en Ajustes → Datos de transferencia y mostrado en `DepositInfoCard` (paso 4) |
| D4 | ¿Los precios incluyen IVA? | Cliente | No incluyen iva |
| D5 | Precio del espacio grande de camping | Cliente | No se sabe pero tambien debe ser editable |
| D6 | ¿Qué hace "evento especial" en una reserva del admin? (SCRUM-56, 261 y HU-4.2) | Cliente | **Respuesta parcial (10/11):** es un evento grande (boda, cumpleaños). El cliente debe contactar al admin: en el home hay una opción "Evento especial" que muestra los contactos (llamar y WhatsApp), no abre un wizard. El admin lo registra y **bloquea todo el restaurante** (los tres espacios, 200 cupos); puede llevar extras (camping o cabaña) como reservas enlazadas (SCRUM-265). **Pendiente (SCRUM-261):** si un evento nocturno bloquea solo la noche o también la cena del día, cómo se modela un horario fuera de las tres comidas y qué pasa con la marca `isSpecialEvent` |
| D8 | Plazo del abono | Cliente | **Resuelta provisoriamente (10/11, corregida el 11/11):** 48 horas sobre las solicitudes pendientes, desde que se envían, editable. Confirmar el plazo real |
| D9 | Exención de abono para instituciones | Cliente | **Resuelta (10/11):** solo "Institución" en restaurante (único servicio con tipo de cliente). Particular, Empresa, Organización y Paseo escolar pagan (10/11, ampliado el 11/11 al reemplazar Colegio por Paseo escolar y agregar Organización) |
| D10 | Plazo real del abono (provisorio: 48 h) | Cliente, en la reunión | Preguntar |
| D11 | Reparto de personas entre cabañas de una familia y si el total y el abono se calculan juntos o por cabaña (SCRUM-265) | Cliente, en la reunión | Preguntar |
| D12 | ¿Camping y restaurante también necesitan la marca "En mantención"? (SCRUM-266) | Cliente, en la reunión | Preguntar |
| D13 | ¿El aforo del restaurante se mide por comida o por hora? (SCRUM-244) | Cliente, en la próxima reunión | **Resuelta provisoriamente (10/11): por comida**, que es lo que el cliente ha dicho hasta ahora. Se respeta esa regla y se confirma en la reunión. Si cambia a "por hora", hay que ajustar `getFullMeals`, `getDayOccupancy`, `findConflicts` y el bloqueo del calendario (todas miden hoy por comida) |
| D7 | Varias cabañas por solicitud o redirigir a contacto directo (SCRUM-27) | Equipo | **Aplazada (8/11):** SCRUM-27 se movió al Sprint 3 hasta confirmar los datos pendientes |
