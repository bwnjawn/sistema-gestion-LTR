# SCRUM-27 — Spike: varias cabañas por solicitud

Estado: aplazada. El 8/11 se movió al Sprint 3 de Jira hasta confirmar los datos pendientes
Fase: fuera de la entrega del 27/11 (salvo que se retome antes)

## Contexto
Un grupo grande puede necesitar más de una cabaña. Hoy cada solicitud admite una sola cabaña.

## Criterios de aceptación (Jira)
- Se completa un análisis y se documenta la decisión (spike).
- El sistema permite agregar varias cabañas a una solicitud, o redirige a contacto directo, según lo decidido.
- Queda definida la regla de capacidad (cabañas de 6 y 8 personas) y si se permite flexibilidad para una persona adicional.

## Qué se necesita saber antes
Esta historia está "En revisión", pero no hay un documento de decisión en el repositorio. Antes de seguir hay que confirmar qué se revisó y qué se resolvió. Este archivo es el lugar donde debe quedar escrito.

## Opciones

### A — Varias cabañas en una misma solicitud
Impacto en el código:
- `ReservationRequest` tiene un solo `resourceName` y un `details.resourceId`: pasaría a ser una lista.
- `reservationStore` y los pasos del wizard asumen una cabaña seleccionada.
- `pricing.calculateCabinPrice` calcula una sola cabaña; habría que sumar.
- `isCabinAvailable` debe verificarse para cada cabaña, y `findConflicts` (SCRUM-60) debe contemplar la lista.
- El admin necesita ver el desglose por cabaña.

Costo estimado: de 1,5 a 2 días más pruebas. Toca el tipo de dominio y los datos ya guardados.

### B — Redirigir a contacto directo
Si el grupo supera la capacidad de una cabaña (o de las disponibles), se muestra un mensaje con los botones de llamada y WhatsApp, usando los datos de `settingsStore.contactInfo`.

Costo estimado: medio día. No toca el modelo de datos.

## Recomendación
**B para la entrega del 27/11**, y A como historia del Sprint 3 si el cliente lo pide. Razones:
- El modelo de reservas todavía se está estabilizando (SCRUM-59, 60 y 56 lo tocan) y la migración a Supabase está en el mismo período.
- Cambiar una cabaña por una lista a la vez que se migra el esquema multiplica el riesgo.
- Los grupos grandes suelen coordinar por teléfono de todas formas.

## Regla de capacidad (a confirmar)
- Cabañas de 6 y de 8 personas.
- Flexibilidad de una persona adicional: **sin decidir** (D7).

## Cambios por capa (si se elige B)
- **Servicio:** `services/availability.ts` con `suggestCabins(guestsCount, cabins)` que indica si cabe en una cabaña o debe contactarse al negocio.
- **Vista:** mensaje con enlaces de contacto en el paso de selección de cabaña.

## Preguntas abiertas
- ¿Qué se decidió en la revisión de Jira?
- ¿Se permite una persona adicional por cabaña?
- ¿Qué pasa con un grupo de 7 personas: una cabaña de 8, o contacto directo?

## Verificación manual
- [ ] La decisión (A o B) queda escrita aquí y en el comentario de la historia.
- [ ] Un grupo mayor a la capacidad ve el mensaje de contacto directo (opción B).
- [ ] Los botones de contacto abren la aplicación correcta.
- [ ] `docs/reglas-negocio.md` refleja la regla de capacidad.
