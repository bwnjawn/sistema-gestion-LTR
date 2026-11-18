# SCRUM-71 — Cotización en PDF de una solicitud

Estado: en curso
Fase: fase 2 (sprint 5)

## Contexto
El administrador necesita entregar un presupuesto formal a colegios, instituciones y a cualquier cliente. Se genera desde una solicitud que ya existe (versión A); cotizar sin solicitud previa (versión B) queda para después.

## Criterios de aceptación (Jira)
- Se genera un PDF con el detalle de servicios y precios de una solicitud.

## Decisiones (18/11, con el usuario)
- Sirve para **cualquier servicio** (cabaña, camping, restaurante, piscina) y **cualquier tipo de cliente**.
- **Con IVA** desglosado (subtotal + IVA + total). La piscina no desglosa IVA (el valor de la entrada ya es el final, SCRUM-44).
- Incluye el **abono** y los **datos de transferencia**; si el cliente no paga abono (Institución en restaurante, piscina) no se muestran.
- Sin numeración propia: se usa el **código de la solicitud**. Sin logo, sin notas ni descuentos.
- Solo solicitudes **pendientes o confirmadas** (`puedeCotizarse`). Rechazadas y canceladas no se cotizan.
- **Enviar al cliente:** menú de compartir del celular con el PDF adjunto (Web Share, requiere HTTPS). Si no está disponible, se descarga el PDF y se ofrecen WhatsApp y correo con el mensaje escrito, para que el admin adjunte el archivo. La app nunca envía nada sola.

## Dónde está
- `services/cotizacion.ts`: arma los datos (líneas, totales, textos del mensaje). Los precios salen del desglose que la solicitud guardó al enviarse; las solicitudes antiguas sin desglose deducen el subtotal con el IVA vigente.
- `lib/pdfCotizacion.ts`: dibuja el PDF (jsPDF, cargado al pulsar el botón).
- `lib/compartirArchivo.ts`: menú de compartir y descarga.
- `components/admin/CotizacionAcciones.vue`: sección "Cotización" del detalle de la solicitud y de la pantalla final de "Nueva reserva" del admin (`ConfirmacionReservaAdmin`, que sirve a los cuatro servicios; ahí se busca la solicitud recién creada por su código).
- Pruebas: `tests/cotizacion.test.ts`.

## Pendiente de verificar a mano
- Aspecto del PDF (restaurante largo en varias páginas) y apertura en iPhone.
- El menú de compartir con archivo solo se puede probar con HTTPS.
