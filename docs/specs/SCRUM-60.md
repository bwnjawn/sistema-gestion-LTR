# SCRUM-60 — Detectar solapamientos de reservas

Estado: borrador
Fase: 2 (16 al 20/11)

## Contexto
Depende de SCRUM-59 (estado de las solicitudes) y de SCRUM-57 (calendario del admin, ya terminado). Evita que el admin apruebe dos reservas incompatibles.

## Criterios de aceptación (Jira)
- Se resaltan visualmente las reservas que coinciden en fecha.
- Se puede entrar al detalle de cada solicitud en conflicto.
- Hay un calendario general que muestra qué días se topan.
- La resolución es manual.

## Situación actual en el código
- `services/availability.ts` tiene `isDateRangeOverlapping` (intervalo `[inicio, fin)`) e `isCabinAvailable`, que solo cubre cabañas.
- `getDayOccupancy` cuenta solicitudes por día y marca "sobrecupo" con un `> 8` fijo que mezcla cabañas, camping y restaurante. Esa cifra solo tiene sentido para restaurante (`capacityRules.maxRestaurantGroupsPerSlot`).
- `AdminCalendarView.vue` y `AdminCalendarGrid.vue` ya pintan disponible, ocupado y sobrecupo.

## Qué es un conflicto
| Servicio | Hay conflicto cuando… | Estado de la definición |
|---|---|---|
| Cabaña | Dos solicitudes activas tienen la misma cabaña y sus fechas se solapan | Definido |
| Camping | Mismo espacio y misma fecha con una suma de personas mayor a su capacidad máxima | Propuesto, por confirmar |
| Restaurante | En la misma fecha y bloque horario hay más grupos que el cupo (8 por defecto) | Propuesto, por confirmar |

"Activa" significa `pending` o `confirmed`. Las rechazadas y canceladas no cuentan.

## Decisiones
1. **Una sola función `findConflicts(requests)`** en `services/availability.ts`. Devuelve grupos de solicitudes en conflicto con el motivo.
2. **`getDayOccupancy` se separa por servicio** y usa el cupo correspondiente en vez del `8` fijo.
3. **Se resalta, no se bloquea.** Nada se rechaza ni se cancela automáticamente.
4. **Ver conflicto desde el detalle:** el modal de SCRUM-59 muestra "Se cruza con…" con la lista de solicitudes y un enlace a cada una.
5. **Calendario:** los días con conflicto llevan una marca distinta a la de "ocupado".

## Cambios por capa
- **Servicio:** `findConflicts`, `getConflictsFor(requestId)` y la corrección de `getDayOccupancy`.
- **Store:** un getter `conflicts` en `requestsStore` (computado sobre `requests`).
- **Vista:** insignia de conflicto en la lista, sección "Se cruza con…" en el detalle y marca en `AdminCalendarGrid.vue`.

## Casos borde
- Cambio de fecha el mismo día de salida y de entrada: el intervalo `[inicio, fin)` no cuenta como conflicto.
- Solicitudes con el formato de fecha antiguo (`date` / `timeOrDuration` en vez de `details.startDate` / `endDate`).
- Una solicitud rechazada después de resolverse el conflicto deja de aparecer en conflicto.
- Rendimiento: con muchos registros, `findConflicts` debe ordenar por fecha y no comparar todos contra todos.

## Preguntas abiertas
- Definición de conflicto en camping y restaurante (tabla de arriba).
- ¿Dos solicitudes pendientes en conflicto se avisan igual que una pendiente con una confirmada?

## Verificación manual
- [ ] Dos solicitudes de la misma cabaña con fechas cruzadas aparecen resaltadas.
- [ ] Salida y entrada el mismo día no se marcan.
- [ ] Desde la solicitud se puede entrar al detalle de la otra.
- [ ] El calendario marca los días en conflicto.
- [ ] Rechazar una de las dos quita la marca.
- [ ] El cupo de restaurante no mezcla cabañas ni camping.
