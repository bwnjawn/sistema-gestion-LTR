# SCRUM-44 — Piscina: pagar la entrada por separado

Estado: hecho (falta la verificación manual en celular)
Fase: fase 2

## Contexto
Quien contrata cabaña, camping o restaurante tiene la piscina gratis. Quien solo va a la piscina necesita una opción propia. Es una **solicitud solo informativa**: sirve para que el administrador sepa quién viene y cuánto corresponde cobrar; no hay abono ni aprobación.

## Criterios de aceptación (Jira)
- Existe una categoría inicial "Servicios extra" con solo "Piscina".
- Se aclara que aplica únicamente si no se contrata otro servicio (quienes contratan otro tienen piscina gratis).

## Decisiones (cerradas el 11/11 con el usuario)
- Opción nueva "Piscina" en el home, con el aviso de que es gratis con otro servicio (la app no puede saber quién reservó, por eso solo se avisa).
- Cuarto tipo de servicio `piscina` (`ServiceType`, enum `tipo_servicio` de Supabase).
- El cliente elige fecha y personas, deja nombre y teléfono, ve el total y al enviar la solicitud **queda confirmada sola**: sin Pendiente, sin abono, sin plazo, sin alertas, sin aprobación.
- Sin cruces ni tope de personas, y no bloquea fechas ni cupos de nada.
- El precio es el final (sin IVA aparte), editable en Ajustes. **Valor de ejemplo: $3.000 por persona**; el real, el de niños y si lleva IVA se preguntan al cliente (SCRUM-270, D14).
- El administrador la ve en la lista y en el calendario con su filtro propio, puede cambiar fecha y personas, y cancelarla.

## Cambios por capa
- Servicio: `calculatePoolPrice` y la rama `piscina` de `calculateBookingPrice` (`services/pricing.ts`); etiquetas, visita de un día, modificación de personas y detalle sin IVA (`services/requests.ts`); pasos del flujo (`services/wizard.ts`); adaptadores a `Booking` (`services/adaptadoresReserva.ts`).
- Store: `reservationStore` calcula el precio con `settingsStore.poolEntryPrice` y envía la solicitud como confirmada (cliente o admin). `settingsStore` guarda `poolEntryPrice` en `parameters`.
- Vistas: `views/client/piscina/PiscinaStep1View`, `Step2View` y `Step3View`; Home con tres tarjetas principales y los servicios extra (Piscina y Evento especial) como tarjetas con foto más bajas, lado a lado (`TarjetaServicioExtra`; fotos de Unsplash provisorias, como las otras tres; Piscina lleva dentro de la tarjeta el aviso de que es gratis con otro servicio); filtros de piscina en lista y calendario del admin; precio editable en Ajustes.
- Esquema: `piscina` en `tipo_servicio`; `crear_solicitud` la deja `confirmed` (`docs/supabase-esquema.md`).

## Casos borde
- Cambiar solo la fecha no cambia el precio; cambiar las personas recalcula con el mismo valor por persona (`total / personas` originales).
- Si el administrador cambia el precio en Ajustes, las solicitudes ya enviadas conservan el suyo.
- En el calendario del admin, un día con visitas a la piscina aparece "Ocupado" cuando el filtro de piscina está activo, aunque no haya tope.

## Preguntas abiertas
- Precio real, precio de niños e IVA (D14).
- Cómo y cuándo se paga la entrada (hoy la app no lo registra).

## Verificación manual
- [ ] En el home aparece "Piscina" con el precio y el aviso; al tocarla abre el paso 1.
- [ ] Paso 1: elegir fecha, cambiar personas (el total se actualiza). No deja avanzar sin fecha.
- [ ] Pasos 2 y 3: datos obligatorios, resumen, "Enviar"; muestra el código y "No necesitas abonar nada".
- [ ] Admin → Solicitudes: la solicitud sale "Confirmada", filtro "Piscina", sin alerta de abono.
- [ ] Admin → Calendario: filtro de piscina muestra el día.
- [ ] Admin → Ajustes: cambiar el precio de la entrada y ver el nuevo valor en el home.
- [ ] Admin → Nueva reserva → Piscina: queda confirmada.
