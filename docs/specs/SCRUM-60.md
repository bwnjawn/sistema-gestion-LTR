# SCRUM-60 — Detectar solapamientos de reservas

Estado: en curso (código listo el 8/11; falta la verificación manual en celular)
Fase: 2 (16 al 20/11)

## Contexto
Depende de SCRUM-59 (estado de las solicitudes) y de SCRUM-57 (calendario del admin, ya terminado). Evita que el admin apruebe dos reservas incompatibles.

## Criterios de aceptación (Jira)
- Se resaltan visualmente las reservas que coinciden en fecha.
- Se puede entrar al detalle de cada solicitud en conflicto.
- Hay un calendario general que muestra qué días se topan.
- La resolución es manual.

## Situación actual en el código
Hecho el 8/11:
- `findConflicts(requests, limites)`, `groupConflictsByRequest` y el tipo `Conflicto` en `services/availability.ts`.
- `requestsStore.conflicts` y `conflictsByRequestId` (computados).
- `getDayOccupancy` ya no usa el `> 8` fijo (SCRUM-244) y marca "se topan" cuando hay dos reservas activas de la misma cabaña o se supera el aforo.
- Tarjeta de la lista: aviso "Se cruza con N solicitudes". Detalle: sección "Se cruza con" con enlace a cada solicitud. Calendario: leyenda "Se topan", insignia "Se cruza" en las listas del día y acceso al detalle al tocar una solicitud.
- Pruebas en `tests/conflictos.test.ts`.

## Qué es un conflicto
| Servicio | Hay conflicto cuando… | Estado de la definición |
|---|---|---|
| Cabaña | Dos solicitudes activas tienen la misma cabaña y sus fechas se solapan | Definido |
| Camping | En un mismo día y modalidad (diario o pernoctar, cupos separados) las personas suman más que la capacidad del camping | Definido el 8/11 (SCRUM-244) |
| Restaurante | En un mismo día y comida las personas suman más que la capacidad del restaurante (suma de sus espacios) | Definido el 8/11 (SCRUM-244). Provisorio hasta confirmar si se mide por comida u hora |

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

## Decisiones tomadas el 8/11
- Dos solicitudes **pendientes** que se cruzan se avisan igual que una pendiente con una confirmada (decisión del usuario).
- La definición de conflicto en camping y restaurante reutiliza las reglas de aforo de SCRUM-244.

## Preguntas abiertas
- Si el aforo del restaurante se mide por comida u hora (afecta también SCRUM-244).

## Verificación manual
- [ ] Dos solicitudes de la misma cabaña con fechas cruzadas aparecen resaltadas.
- [ ] Salida y entrada el mismo día no se marcan.
- [ ] Desde la solicitud se puede entrar al detalle de la otra.
- [ ] El calendario marca los días en conflicto.
- [ ] Rechazar una de las dos quita la marca.
- [ ] El cupo de restaurante no mezcla cabañas ni camping.
