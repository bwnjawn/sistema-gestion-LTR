# SCRUM-56 — El administrador registra una reserva con el flujo del cliente

Estado: hecho y verificado a mano (10/11). Las decisiones 6, 7 y 9 cambiaron el 10/11: ver SCRUM-260, 261 y 262
Fase: 2 (16 al 20/11)

## Contexto
El admin necesita cargar reservas que llegan por teléfono o en persona. El criterio exige **no duplicar vistas**: debe usar el mismo proceso del cliente.

## Criterios de aceptación (Jira)
- El botón "Nueva reserva" abre el flujo de la vista cliente (sin vistas duplicadas).
- Permite marcar la reserva como evento especial (HU-4.2).

## Situación actual en el código
Existe `components/admin/AdminNewBookingModal.vue` (196 líneas), que es justamente una vista duplicada:
- Reimplementa precios con `precio × personas` y abono `0.3` fijo, sin usar `services/pricing.ts`.
- Genera códigos `ADM-` al azar, sin garantía de que sean únicos.
- Para restaurante usa un recurso genérico con precio 0 y no maneja platos.
- No valida disponibilidad.

## Decisiones
1. **Se elimina `AdminNewBookingModal.vue`.** El botón flotante "Nueva Reserva" (en todo el panel; el de la lista de solicitudes se quitó por repetido) navega al primer paso del flujo del cliente en **modo administrador**.
2. **El modo administrador es un indicador del borrador del wizard** (`reservationStore`), no una ruta aparte. Eso evita duplicar las rutas.
3. **Acceso:** el modo administrador solo se activa si hay sesión de admin (guardia en el router).
4. **Al empezar y al terminar** se limpia el borrador `ltr_wizard_draft`, para que un borrador de cliente no se filtre al admin ni al revés.
5. **Al finalizar**, el admin vuelve a la lista de solicitudes y **no** ve la sugerencia de reservar otro servicio de SCRUM-47.
6. **Estado inicial de la reserva del admin:** `confirmed` si no se cruza con nada. **Cambia el 10/11 (SCRUM-260):** si se cruza con pendientes, entra `pending` con aviso. Con una confirmada en la cabaña, no se puede elegir. Implementado en SCRUM-260. Si después hay que aprobar una solicitud que se cruza, el administrador elige cuál confirmar en el diálogo de SCRUM-262 y nunca quedan dos confirmadas cruzadas.
7. **Evento especial:** se guarda como `details.isSpecialEvent`. Por ahora solo es una marca. **El 10/11 se decidió que debe bloquear todo el restaurante** y salir como opción en el home con los contactos del admin; está bloqueado por decisiones de diseño en SCRUM-261 (ver D6).
8. **Abono:** la reserva del admin entra con `payments: []`; el abono se registra después en el detalle (SCRUM-239).
9. **Disponibilidad:** **corregida el 10/11.** El admin no puede elegir una cabaña ni un cupo con una reserva **confirmada**; sí los que solo tienen pendientes, con un aviso dentro de la tarjeta, y el aviso de cruces de SCRUM-60 se muestra igual (SCRUM-260 y 263). Antes decía que el admin no quedaba bloqueado por nada.
10. **Origen:** `details.origin` vale `cliente` o `admin`. Los códigos son `SOL-` y `ADM-`, sin repetirse (`generateRequestCode`).
11. **Salir en modo admin:** se puede salir en cualquier momento, también desde la pantalla de inicio. Allí se muestra la misma franja "Modo administrador" de los pasos, con un botón "Salir", y se oculta la barra inferior del cliente. En los pasos, atrás desde el paso 1 y la X preguntan y, al salir, borran el borrador y vuelven a la lista.
12. **Pantalla final del admin:** `ConfirmacionReservaAdmin` (reserva registrada y confirmada, datos del cliente, aviso de que no tiene pagos, "Cargar otra reserva" y "Volver a solicitudes"). No muestra el texto "Te contactaremos".

## Cambios por capa
- **Servicio:** `services/requests.ts` con `buildRequestFromDraft(draft, { origin })`, usada por el cliente y por el admin.
- **Store:** `reservationStore` agrega `isAdminMode` y `startAdminDraft()`; `requestsStore.addRequest` acepta `status` inicial para el modo administrador.
- **Router:** ruta `/admin/nueva-reserva` (`requiresAuth`): empieza el borrador de admin y sigue en la home para elegir el servicio. Si hay modo admin sin sesión, el borrador se descarta.
- **Vista:** cada paso del wizard muestra una franja "Modo administrador" y un casillero "Evento especial" en el paso final.

## Casos borde
- El admin abandona el flujo a la mitad: el borrador no debe quedar para el siguiente cliente.
- La misma persona abre la vista cliente en otra pestaña: `sessionStorage` es por pestaña, pero hay que probarlo.
- Un cliente intenta entrar con el parámetro de modo administrador sin sesión: se ignora.
- Las validaciones de disponibilidad aplican igual: confirmadas bloquean, pendientes avisan (decidido el 10/11).

## Preguntas abiertas
- **D6 (respuesta parcial el 10/11, bloqueada en SCRUM-261):** el evento especial bloquea todo el restaurante, puede llevar extras como reservas enlazadas (SCRUM-265) y puede ser nocturno. Falta decidir si el nocturno bloquea también la cena del día y cómo se modela un horario libre.
- Los eventos de instituciones no pagan abono (SCRUM-264).

## Verificación manual
- [x] "Nueva" abre el paso 1 del flujo del cliente.
- [x] Los datos de un cliente en otra pestaña no aparecen en el modo administrador.
- [x] La reserva queda en la lista con el origen y el estado correctos.
- [x] Al terminar, el admin ve su confirmación y vuelve a la lista.
- [x] Desde la pantalla de inicio en modo admin está la franja con el botón "Salir".
- [x] Sin sesión, el modo administrador no se activa.
- [x] `AdminNewBookingModal.vue` ya no existe y nada lo importa.
 