# Reglas de negocio — Los Troncos de Repil

Fuente única de las reglas que hoy están repartidas en los criterios de aceptación de Jira.
**Regla de oro:** toda regla de esta tabla debe vivir en `src/services/` y no en una vista (`.vue`).
Cuando una regla cambie, se actualiza primero este archivo y después el código.

Última revisión: 2026-11-08

Estados de implementación: ✅ en servicio · ⚠️ en vista o con valor fijo en el código · ❌ no implementada · ❓ falta decisión

## 1. Reglas generales

| Regla | Valor | Historia | Dónde está hoy | Estado |
|---|---|---|---|---|
| Abono exigido | 30 % por defecto, editable por el admin | SCRUM-32, 59 | `settingsStore.parameters.defaultDepositPercentage` y `services/pricing.ts` | Las reservas del admin usan el mismo cálculo (SCRUM-56) |
| IVA | 19 % se suma al subtotal | — | `services/pricing.ts` | ❓ ¿Los precios publicados ya incluyen IVA? Ninguna historia lo define |
| Estados de solicitud | `pending` → `confirmed` o `rejected`, además de `cancelled` | SCRUM-59 | `types/domain.ts` | ⚠️ las vistas aún aceptan valores antiguos (`pendiente`, `confirmada`, `rechazada`) |
| Alerta de pendiente antiguo | Una solicitud pendiente por más de 24 h se resalta | — | `AdminRequestsView.vue` (`isOldPending`) | ⚠️ está en la vista |
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
| Disponibilidad | Una cabaña no admite dos solicitudes activas (`pending` o `confirmed`) con fechas solapadas, en intervalo `[entrada, salida)` | SCRUM-60 | ✅ `isCabinAvailable` |
| Varias cabañas por solicitud | Pendiente de decisión | SCRUM-27 | ❓ Ver `docs/specs/SCRUM-27.md` |

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
| Espacios y capacidad | Comedor principal 120 personas, carpa 50, comedor secundario 30 (total 200) | SCRUM-244 (reunión con el cliente) | ✅ Capacidades editables en Ajustes (`capacityRules.restaurantSpaces`); el total (200) limita las personas en el paso 1. ❓ Falta decidir si el aforo se cuenta por comida o por hora y cómo se asigna el espacio a un grupo |
| Sobrecupo en el calendario | Restaurante: personas de una misma comida > capacidad total. Camping: personas del día de una misma modalidad > capacidad del camping. Cabañas: no aplica (un solapamiento se rechaza, SCRUM-60) | SCRUM-244 | ✅ `getDayOccupancy` (provisorio hasta confirmar con el cliente si se mide por comida u hora) |

## 5. Bloqueo de fechas en el calendario del cliente

Decidido el 8/11 (SCRUM-244). Cuentan solo las solicitudes activas (`pending` o `confirmed`). Funciones en `services/availability.ts`.

| Servicio | Una fecha se bloquea cuando… | Detalle |
|---|---|---|
| Cabañas | Todas las cabañas con capacidad para el grupo están ocupadas esa noche | Depende de las personas indicadas. Una estadía se bloquea si ninguna cabaña que le sirve está libre **todas** las noches (una solicitud lleva una sola cabaña). El día de salida puede ser un día ocupado. Si el grupo supera la cabaña más grande no se bloquea nada (lo resuelve SCRUM-27) |
| Restaurante | Las tres comidas están llenas para el grupo (personas ya reservadas + grupo > capacidad total) | Las comidas llenas se deshabilitan una a una en el paso 1. Las solicitudes antiguas sin comida definida no cuentan en ninguna comida |
| Camping | Las personas ya reservadas de esa modalidad + el grupo superan la capacidad del camping | `diario` y `pernoctar` tienen cupos separados. En `pernoctar` se revisa cada noche de la estancia. Las solicitudes antiguas sin modalidad cuentan como `pernoctar` |

El admin no tiene este bloqueo al editar o registrar una reserva: puede cruzar fechas y la resolución es manual (SCRUM-60).

### Solapamientos entre solicitudes (SCRUM-60)

El admin ve una alerta cuando dos o más solicitudes activas (`pending` o `confirmed`) no caben juntas. Las pendientes cuentan igual que las confirmadas. No se rechaza ni cancela nada solo: la resolución es manual. Función: `findConflicts` en `services/availability.ts`.

| Servicio | Hay solapamiento cuando… |
|---|---|
| Cabañas | La misma cabaña tiene fechas que se cruzan, en intervalo `[entrada, salida)` |
| Restaurante | Las personas de una misma comida y día superan la capacidad total del restaurante |
| Camping | Las personas de un mismo día y modalidad superan la capacidad del camping (diario y pernoctar por separado) |

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
| D6 | ¿Qué hace "evento especial" en una reserva del admin? (SCRUM-56 y HU-4.2) | Cliente | Es un evento grande o especial como boda o cumpleaños. Donde el cliente debe contactar con el administrador especificamente para ver detalles, pero la app debe permitir marcar el dia para saber el cupo.|
| D7 | Varias cabañas por solicitud o redirigir a contacto directo (SCRUM-27) | Equipo | **Aplazada (8/11):** SCRUM-27 se movió al Sprint 3 hasta confirmar los datos pendientes |
