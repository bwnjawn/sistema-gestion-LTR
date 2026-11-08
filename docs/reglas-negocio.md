# Reglas de negocio — Los Troncos de Repil

Fuente única de las reglas que hoy están repartidas en los criterios de aceptación de Jira.
**Regla de oro:** toda regla de esta tabla debe vivir en `src/services/` y no en una vista (`.vue`).
Cuando una regla cambie, se actualiza primero este archivo y después el código.

Última revisión: 2026-11-08

Estados de implementación: ✅ en servicio · ⚠️ en vista o con valor fijo en el código · ❌ no implementada · ❓ falta decisión

## 1. Reglas generales

| Regla | Valor | Historia | Dónde está hoy | Estado |
|---|---|---|---|---|
| Abono exigido | 30 % por defecto, editable por el admin | SCRUM-32, 59 | `settingsStore.parameters.defaultDepositPercentage` y `services/pricing.ts` | ⚠️ `AdminNewBookingModal.vue` usa `0.3` fijo |
| IVA | 19 % se suma al subtotal | — | `services/pricing.ts` | ❓ ¿Los precios publicados ya incluyen IVA? Ninguna historia lo define |
| Estados de solicitud | `pending` → `confirmed` o `rejected`, además de `cancelled` | SCRUM-59 | `types/domain.ts` | ⚠️ las vistas aún aceptan valores antiguos (`pendiente`, `confirmada`, `rechazada`) |
| Alerta de pendiente antiguo | Una solicitud pendiente por más de 24 h se resalta | — | `AdminRequestsView.vue` (`isOldPending`) | ⚠️ está en la vista |
| Teléfono del cliente | Prefijo `+569` precargado y editable; teclado numérico | SCRUM-25 | Formularios de los pasos | por verificar |
| Categoría de cliente | Solo se pide en restaurante, no en cabañas ni en camping | SCRUM-25, 232 | Pasos de restaurante | por verificar |
| Comentarios | El cliente pide un sitio específico por comentario y no ve selector de ubicación | SCRUM-29 | Paso de camping | por verificar |
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
| Mensaje de abono | El mismo mensaje amarillo que en cabañas | SCRUM-32 | ✅ `DepositInfoCard` |
| Capacidad total | 150 personas | — | ⚠️ `capacityRules.maxCampingPeopleCapacity`, sin uso verificado |

## 4. Restaurante

| Regla | Valor | Historia | Estado |
|---|---|---|---|
| Horarios | Desayuno 08:30–11:00, almuerzo 12:30–14:00, once 17:00–19:30 (bloques de 30 min) | — | ✅ `generateTimeSlots` y `settingsStore` |
| Grupos de más de 30 personas | Máximo 3 menús distintos y mensaje explicativo al llegar al límite | SCRUM-36 | ⚠️ **vive en `RestaurantStep2View.vue`**; moverla a `services/` |
| Acompañamientos | Modo `none`, `fixed` (acompañamiento fijo, ej. asado de cordero) o `choice` (el cliente elige) | SCRUM-35, 62, 229 | ✅ en el cliente. ❌ falta el CRUD de administración (SCRUM-229) |
| Cupo por horario | 8 grupos por bloque | — | ⚠️ `capacityRules.maxRestaurantGroupsPerSlot`, **no se aplica**. `getDayOccupancy` usa un `> 8` fijo que mezcla los tres servicios |
| Precio | Suma de platos × cantidad (+ IVA) | — | ✅ `calculateRestaurantPrice` |

## 5. Contacto del negocio

Los datos de `ContactView` salen de `settingsStore.contactInfo` y se editan desde `AdminContactEditModal` (SCRUM-231).
Los enlaces (mapa, Instagram, web) se generan en `lib/contactLinks.ts` a partir de lo que escribe el admin.

- Teléfonos por defecto: +56 9 8502 5056 y +56 9 9588 3385 (el segundo coincide con el que pide SCRUM-49).
- **Verificar:** el valor por defecto `iframeMapUrl` tiene las coordenadas con signo positivo (`2d73.4167`, `3d41.1500`). En el hemisferio sur y oeste deberían ser negativas. Comprobar que el mapa que ve el cliente apunte a Repil y no a otro lugar.

## 6. Decisiones abiertas que bloquean la entrega

| # | Pregunta | A quién | Para cuándo |
|---|---|---|---|
| D1 | Horarios de ingreso y salida de pernoctar | Cliente | **Resuelta provisoriamente (8/11):** se usan los valores por defecto, editables por el admin y visibles para el cliente. Confirmar los reales con el cliente |
| D2 | Check-in y check-out de cabañas: ¿fijos o flexibles? | Cliente | **Resuelta provisoriamente (8/11):** se muestran como horario fijo editable (15:00 y 11:00). Confirmar con el cliente |
| D3 | Datos reales de transferencia para el paso 4 (SCRUM-233) | Cliente | **Resuelta provisoriamente (8/11):** datos de ejemplo, editables por el admin desde Configuración y visibles para el cliente. Cargar los reales cuando el cliente los entregue. Implementado en SCRUM-233: `settingsStore.transferInfo`, editable en Ajustes → Datos de transferencia y mostrado en `DepositInfoCard` (paso 4) |
| D4 | ¿Los precios incluyen IVA? | Cliente | No incluyen iva |
| D5 | Precio del espacio grande de camping | Cliente | No se sabe pero tambien debe ser editable |
| D6 | ¿Qué hace "evento especial" en una reserva del admin? (SCRUM-56 y HU-4.2) | Cliente | Es un evento grande o especial como boda o cumpleaños. Donde el cliente debe contactar con el administrador especificamente para ver detalles, pero la app debe permitir marcar el dia para saber el cupo.|
| D7 | Varias cabañas por solicitud o redirigir a contacto directo (SCRUM-27) | Equipo | **Aplazada (8/11):** SCRUM-27 se movió al Sprint 3 hasta confirmar los datos pendientes |
