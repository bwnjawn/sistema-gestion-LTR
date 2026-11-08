# SCRUM-59 — Resumen de solicitud para el administrador

Estado: borrador
Fase: prototipo (hasta el 13/11), con "cambiar fecha" en la Fase 2

## Contexto
Es el centro del panel de administración: sin esta vista el admin no puede decidir sobre una solicitud ni contactar al cliente. SCRUM-58 (filtros) y SCRUM-60 (solapamientos) usan la misma lista.

## Criterios de aceptación (Jira)
- Fecha, personas y categoría se muestran separados y legibles.
- Se muestra información de contacto, con botones de llamada, WhatsApp y correo.
- Calcula y muestra el abono (30 %).
- Botones Aprobar, Modificar y Rechazar.
- Permite cambiar la fecha desde un calendario.

## Situación actual en el código
`src/views/admin/AdminRequestsView.vue` (502 líneas) ya tiene la lista, filtros por estado y tipo, buscador, un modal "Ficha de Reserva" y los botones Aprobar y Rechazar.

| Criterio | Estado |
|---|---|
| Fecha, personas y categoría separados | Parcial: el modal muestra cliente, teléfono, correo, recurso y una fecha corta. No muestra personas ni categoría |
| Botones de llamada, WhatsApp y correo | Falta: el teléfono y el correo se muestran como texto |
| Abono | Se muestra `depositAmount` guardado en la solicitud |
| Aprobar y Rechazar | Existen. Rechazar no pide confirmación |
| Modificar | Falta |
| Cambiar fecha con calendario | Falta |

Problemas encontrados que conviene corregir en la misma historia:
- `registerExtraPayment()` modifica `selectedRequest.details` directamente en la vista, sin pasar por el store. No se persiste y rompe la regla de CLAUDE.md.
- La vista repite comparaciones con `'pendiente'`, `'confirmada'` y `'rechazada'`, valores que ya no existen en `BookingStatus`.
- El modal y la lista están en un solo archivo muy largo.

## Decisiones
1. **El abono mostrado es el guardado en la solicitud** (`depositAmount`), no uno recalculado con el porcentaje actual. Así no cambia si el admin modifica el porcentaje después. Solo se recalcula si se modifica la solicitud.
2. **Los enlaces de contacto se generan en `lib/contactLinks.ts`**: `buildTelUrl`, `buildWhatsappUrl` y `buildMailtoUrl`. Un helper normaliza los teléfonos chilenos (`+56 9 1234 5678` → `56912345678`).
3. **Se extrae el modal a un componente** `components/admin/AdminRequestDetailModal.vue`. La vista queda solo con lista y filtros.
4. **"Modificar" abre el mismo modal en modo edición** para nombre, teléfono, personas, comentarios y fecha. No es el wizard completo.
5. **Cambiar fecha** usa `BaseCalendar` y valida con el servicio de disponibilidad.
6. **Rechazar pide confirmación** con un mensaje simple. Es una acción difícil de revertir para el cliente.

## Cambios por capa

**Servicio**
- `services/requests.ts` (nuevo):
  - `normalizeStatus(raw)` convierte valores antiguos a `BookingStatus`.
  - `getRequestSummary(req)` devuelve fecha, personas y categoría ya formateados.
  - `canChangeDate(req, newDate, allRequests)` valida pasado y disponibilidad.
- `services/availability.ts`: `isCabinAvailable` debe aceptar un `excludeRequestId` opcional. Sin eso, al cambiar la fecha de una reserva, el sistema la detecta como conflicto consigo misma.

**Store y repositorio**
- `requestsStore.updateRequest(id, patch)` persiste los cambios vía `requestsRepository`.
- `requestsStore.registerPayment(id, amount, method)` reemplaza a `registerExtraPayment` de la vista y usa `paymentsRepository`.

**Vista**
- `AdminRequestsView.vue` usa solo los métodos del store.
- `AdminRequestDetailModal.vue` recibe la solicitud y emite `confirm`, `reject`, `update` y `close`.

## Casos borde
- Teléfono sin prefijo o con espacios: el enlace de WhatsApp debe seguir funcionando.
- Solicitud sin correo: el botón de correo no se muestra.
- Cambiar la fecha a un día pasado o a un día ocupado: mensaje claro y no se guarda.
- Aprobar una solicitud que se solapa con otra confirmada: avisar, ver SCRUM-60.
- Doble clic en Aprobar: la segunda acción no debe duplicar nada.

## Preguntas abiertas
- ¿De dónde sale la "categoría" en cabañas y camping, si SCRUM-25 dice que solo aplica a restaurante? Probablemente se muestre solo en restaurante.
- ¿Aprobar debe notificar al cliente de algún modo (WhatsApp prellenado)? Propuesta: sí, abrir WhatsApp con un mensaje prellenado, sin envío automático.

## Verificación manual
- [ ] Una solicitud de cada servicio se ve con fecha, personas y categoría legibles.
- [ ] Los tres botones de contacto abren la aplicación correcta en el celular.
- [ ] El abono coincide con el 30 % del total.
- [ ] Aprobar, Rechazar y Modificar persisten al recargar la página.
- [ ] Cambiar la fecha respeta días pasados y ocupados, y no se bloquea a sí misma.
- [ ] Un pago agregado queda guardado después de recargar.
- [ ] `npm run build` pasa sin errores.
