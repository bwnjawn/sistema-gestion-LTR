# SCRUM-27 — Spike: varias cabañas por solicitud

Estado: aplazada (Abierta en Jira). Se trabaja junto con SCRUM-265 (cabañas enlazadas por el administrador)
Fase: fuera de la entrega del 27/11 (salvo que se retome antes)

## Contexto
Un grupo grande puede necesitar más de una cabaña. Hoy cada solicitud admite una sola cabaña.

## Criterios de aceptación (Jira)
- Se completa un análisis y se documenta la decisión (spike).
- El sistema permite agregar varias cabañas a una solicitud, o redirige a contacto directo, según lo decidido.
- Queda definida la regla de capacidad y si se permite flexibilidad para una persona adicional.

## Lo que dijeron los dueños (reunión del 22/11)
- **Cualquier cabaña se puede juntar con otra.** No hay parejas fijas (se descartan las dudas «7 y 8» y «6 y 8»). Depende de la cantidad de personas y de la combinación que alcance.
- **No se habló** de reservar más de una cabaña a la vez en una misma solicitud. Lo debe decidir y proponer el equipo.

## Propuesta del equipo (sin validar con los dueños)
**Una solicitud por cabaña, sin combinar.** El cliente envía una solicitud por cada cabaña que necesita, y el administrador las enlaza (SCRUM-265). Es la opción de menor riesgo: no toca el modelo de datos ni el cálculo de precios.

Se descarta por ahora la opción A (lista de cabañas en una solicitud, de 1,5 a 2 días de trabajo y toca el tipo de dominio y los datos guardados).

## Por decidir antes de proponerla
- **Reparto de personas** entre las cabañas.
- **Abono con varias cabañas:** si se calcula junto o por cabaña.
- **Persona extra:** si se cobra y cuánto. Los dueños no lo han definido.
- Un grupo de 7: ¿una cabaña de 8 o contacto directo?

## Cambios por capa (si se elige contacto directo o una solicitud por cabaña)
- **Servicio:** `services/availability.ts` con `suggestCabins(guestsCount, cabins)` que indica si cabe en una cabaña o debe contactarse al negocio.
- **Vista:** mensaje con enlaces de contacto (`settingsStore.contactInfo`) en el paso de selección de cabaña.

## Verificación manual
- [ ] La decisión queda escrita aquí y en SCRUM-265.
- [ ] Un grupo mayor a la capacidad ve el mensaje de contacto directo.
- [ ] Los botones de contacto abren la aplicación correcta.
- [ ] `docs/reglas-negocio.md` refleja la regla de capacidad (D11).
