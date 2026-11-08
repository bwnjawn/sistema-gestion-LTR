# SCRUM-56 — El administrador registra una reserva con el flujo del cliente

Estado: borrador
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
1. **Se elimina `AdminNewBookingModal.vue`.** "Nueva" en `AdminRequestsView` navega al primer paso del flujo del cliente en **modo administrador**.
2. **El modo administrador es un indicador del borrador del wizard** (`reservationStore`), no una ruta aparte. Eso evita duplicar las rutas.
3. **Acceso:** el modo administrador solo se activa si hay sesión de admin (guardia en el router).
4. **Al empezar y al terminar** se limpia el borrador `ltr_wizard_draft`, para que un borrador de cliente no se filtre al admin ni al revés.
5. **Al finalizar**, el admin vuelve a la lista de solicitudes y **no** ve la sugerencia de reservar otro servicio de SCRUM-47.
6. **Estado inicial de la reserva del admin:** propuesta `confirmed` (el admin ya la acordó con el cliente). Por confirmar.
7. **Evento especial:** se guarda como `details.isSpecialEvent`. Lo que cambia en las reglas depende de D6.

## Cambios por capa
- **Servicio:** `services/requests.ts` con `buildRequestFromDraft(draft, { origin })`, usada por el cliente y por el admin.
- **Store:** `reservationStore` agrega `isAdminMode` y `startAdminDraft()`; `requestsStore.addRequest` acepta `status` inicial para el modo administrador.
- **Router:** guardia de acceso al modo administrador.
- **Vista:** cada paso del wizard muestra una franja "Modo administrador" y un casillero "Evento especial" en el paso final.

## Casos borde
- El admin abandona el flujo a la mitad: el borrador no debe quedar para el siguiente cliente.
- La misma persona abre la vista cliente en otra pestaña: `sessionStorage` es por pestaña, pero hay que probarlo.
- Un cliente intenta entrar con el parámetro de modo administrador sin sesión: se ignora.
- Las validaciones de disponibilidad deben aplicar igual (o con un aviso, si el admin puede forzar un evento especial).

## Preguntas abiertas
- **D6:** ¿qué hace un evento especial? (¿omite límites de cupo, el abono o el máximo de menús?)
- ¿La reserva del admin entra como `confirmed` o como `pending`?
- ¿El admin puede saltarse la validación de disponibilidad?

## Verificación manual
- [ ] "Nueva" abre el paso 1 del flujo del cliente.
- [ ] Los datos de un cliente en otra pestaña no aparecen en el modo administrador.
- [ ] La reserva queda en la lista con el origen y el estado correctos.
- [ ] Al terminar, el admin vuelve a la lista.
- [ ] Sin sesión, el modo administrador no se activa.
- [ ] `AdminNewBookingModal.vue` ya no existe y nada lo importa.
