# SCRUM-284 — Cancelar una reserva confirmada para liberar sus fechas

**Fase:** 2 · **Decisión del usuario (20/11):** "eliminar" una confirmada significa **cancelarla**, no borrarla.

## Problema
Una solicitud **pendiente** se puede rechazar (o cancelar si el abono venció), pero una **confirmada** solo se podía modificar o anotarle pagos. Si el cliente avisaba que no iba, la fecha quedaba bloqueada para siempre.

## Decisiones
- **Cancelar es un cambio de estado**: la reserva pasa a `cancelled`. No se borra: queda en el historial con sus pagos y aparece en el Excel (columna de estado "Cancelada").
- **Libera fechas y cupos.** `isRequestActive` solo cuenta pendientes y confirmadas, y `fechas_ocupadas` (Supabase) solo suma confirmadas: la cancelada no ocupa nada. Tras cancelar se vuelve a pedir la disponibilidad (el store ya lo hace al guardar cualquier cambio de estado).
- **Los pagos se conservan.** La app no registra devoluciones: la hoja de confirmación lo dice ("el abono recibido no se devuelve desde aquí").
- **En pantalla es "Descartada".** Rechazadas y canceladas se muestran juntas con una sola etiqueta, un solo filtro y el mismo gris (decisión de SCRUM-262). La hoja de confirmación lo avisa.
- **Solo una confirmada se cancela** (`puedeCancelarse`). Las pendientes se rechazan; las descartadas no tienen nada que hacer.
- **Avisar al cliente (decidido al implementar):** con la reserva ya cancelada, la misma hoja ofrece llamar, WhatsApp y correo con un mensaje prearmado (`buildMensajeCancelacion`). La app **nunca envía nada sola**. El mensaje no promete devoluciones: si hubo abono solo dice "conversemos cómo seguimos". El administrador puede editarlo en la aplicación de mensajes antes de enviarlo.
- **Sin conexión** funciona como cualquier cambio de estado del administrador (SCRUM-250): queda "Sin sincronizar" y se envía al volver la señal; una cancelación no puede chocar con otra reserva.

## Dónde está
| Capa | Archivo |
|---|---|
| Regla | `src/services/requests.ts` (`puedeCancelarse`) |
| Mensajes | `src/services/mensajesCliente.ts` (`buildMensajeCancelacion`, `buildAsuntoCancelacion`) |
| Acción | `src/stores/requestsStore.ts` (`cancelConfirmedRequest`, guarda por el repositorio y revierte si falla) |
| Pantalla | Detalle de la solicitud (botón **Cancelar reserva** en el pie, solo si está confirmada) y `AdminCancelarReservaDialog.vue` (hoja `HojaModal` en dos pasos: confirmar y avisar). `AccionesContactoCliente.vue` son los tres botones de contacto. |
| Pruebas | `tests/cancelacion.test.ts` |

## Criterios de aceptación (de Jira)
- Una confirmada se cancela con confirmación y queda cancelada. ✅
- Su fecha vuelve a estar libre para nuevas reservas. ✅
- Sigue en el historial, con sus pagos, y en el Excel. ✅
- Pruebas del servicio y docs actualizados. ✅

## Cómo probarlo
Detalle de una solicitud confirmada → **Cancelar reserva** → confirmar. Revisar que: la reserva pasa a "Descartada"; el calendario del cliente y el del admin vuelven a mostrar libre la fecha; los pagos siguen anotados; en Descartadas y en el Excel aparece; y los botones de llamar, WhatsApp y correo traen el mensaje escrito. Probar con una cabaña, un camping y un restaurante.
