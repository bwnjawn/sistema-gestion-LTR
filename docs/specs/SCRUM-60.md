# SCRUM-60 — Detectar solapamientos de reservas

Estado: código del aviso listo (8/11). **Regla corregida el 10/11:** solo las confirmadas bloquean. Código ajustado en SCRUM-260 y 263; falta resolver al confirmar (SCRUM-262). Verificación manual pendiente.
Fase: 2 (16 al 20/11)

## Contexto
Depende de SCRUM-59 (estado de las solicitudes) y de SCRUM-57 (calendario del admin, ya terminado). Evita que el admin apruebe dos reservas incompatibles. Los administradores trabajan en zona rural con internet inestable, y dos administradores o dos clientes pueden pedir la misma fecha.

## Criterios de aceptación (Jira)
- Se resaltan visualmente las reservas que coinciden en fecha.
- Se puede entrar al detalle de cada solicitud en conflicto.
- Hay un calendario general que muestra qué días se topan.
- La resolución es manual.

## Modelo (decidido el 10/11)
- **Pendiente = intención.** Puede convivir con otras y **no bloquea** al cliente ni al admin.
- **Confirmada = compromiso.** Retiene fechas y cupos y **bloquea** a todos.
- Solo una solicitud puede quedar confirmada por fecha y recurso.
- Los cruces se **avisan siempre**; nada se rechaza ni cancela solo.

## Qué es un conflicto
| Servicio | Hay conflicto cuando… |
|---|---|
| Cabaña | Dos solicitudes activas tienen la misma cabaña y sus fechas se solapan |
| Camping | En un mismo día y modalidad (diario o pernoctar, cupos separados) las personas suman más que la capacidad del camping |
| Restaurante | En un mismo día y comida las personas suman más que la capacidad del restaurante (suma de sus espacios). Provisorio hasta confirmar si se mide por comida u hora |

"Activa" significa `pending` o `confirmed`; las rechazadas y canceladas no cuentan. El intervalo es `[entrada, salida)`.

### Qué cuenta para cada efecto
| Efecto | Cuenta |
|---|---|
| Bloquear al cliente y al admin al elegir | Solo confirmadas |
| Aviso de cruce y de sobrecupo del admin | Pendientes y confirmadas |

### Combinaciones
| Caso | Resultado |
|---|---|
| Pendiente + pendiente | Conviven; ambas muestran "Se cruza" |
| Pendiente + confirmada | La pendiente avisa y se resuelve con la salida de SCRUM-262 (avisar y mover fecha, o rechazar) |
| Confirmada + confirmada | No debe ocurrir. Con Supabase lo impide la base de datos; sin conexión queda "En conflicto, por resolver" (SCRUM-250) |

## Situación actual en el código
Hecho el 8/11:
- `findConflicts(requests, limites)`, `groupConflictsByRequest` y el tipo `Conflicto` en `services/availability.ts`.
- `requestsStore.conflicts` y `conflictsByRequestId` (computados).
- `getDayOccupancy` ya no usa el `> 8` fijo (SCRUM-244) y marca "se topan" cuando hay dos reservas activas de la misma cabaña o se supera el aforo.
- Tarjeta de la lista: aviso "Se cruza con N solicitudes". Detalle: sección "Se cruza con" con enlace a cada solicitud. Calendario: leyenda "Se topan", insignia "Se cruza" en las listas del día y acceso al detalle al tocar una solicitud.
- Pruebas en `tests/conflictos.test.ts`.

**Falta (cambios del 10/11):**
Hecho el 10/11:
- SCRUM-263: el bloqueo cuenta solo confirmadas (`isCabinAvailable`, `getFullMeals`, `isCampingDayBlocked`); el aviso de demanda (`getDayOccupancy`, `findConflicts`) sigue contando pendientes y confirmadas.
- SCRUM-260: el admin ve las cabañas con solo pendientes (con aviso dentro de la tarjeta) y no ve las confirmadas; su reserva entra pendiente si se cruza.

**Falta:**
- SCRUM-262: diálogo al confirmar y salidas de contacto.

## Decisiones
1. **Una sola función `findConflicts(requests)`** en `services/availability.ts`. Devuelve grupos de solicitudes en conflicto con el motivo.
2. **`getDayOccupancy` se separa por servicio** y usa el cupo correspondiente en vez del `8` fijo.
3. **Se avisa; solo las confirmadas bloquean** (corregido el 10/11; antes: "se resalta, no se bloquea").
4. **Ver conflicto desde el detalle:** el modal de SCRUM-59 muestra "Se cruza con…" con la lista de solicitudes y un enlace a cada una.
5. **Calendario:** los días con conflicto llevan una marca distinta a la de "ocupado".
6. **Resolver al aprobar (SCRUM-262):** el diálogo muestra las solicitudes que chocan con sus días, precio y cercanía, y el admin elige cuál confirmar. Para las demás: llamar, correo, WhatsApp, Modificar fecha o Rechazar.
7. **Dos pendientes cruzadas se avisan igual** que una pendiente con una confirmada (decisión del 8/11).
8. **Una pendiente sin abono en plazo** no se libera sola; ver "Abono vencido" (SCRUM-264).
9. **Evento especial:** cuenta como restaurante completo y confirmado (SCRUM-261, bloqueada por decisiones de diseño).

## Cambios por capa
- **Servicio:** `findConflicts`, `getConflictsFor(requestId)`, `getCabinOverlaps` (admin) y la separación del conteo para bloquear y para avisar.
- **Store:** getters `conflicts` y `conflictsByRequestId` en `requestsStore` (computados sobre `requests`); acción de confirmar con resolución de cruces.
- **Vista:** insignia de conflicto en la lista, sección "Se cruza con…" en el detalle, marca en `AdminCalendarGrid.vue` y diálogo de confirmación.

## Casos borde
- Cambio de fecha el mismo día de salida y de entrada: el intervalo `[inicio, fin)` no cuenta como conflicto.
- Solicitudes con el formato de fecha antiguo (`date` / `timeOrDuration` en vez de `details.startDate` / `endDate`).
- Una solicitud rechazada después de resolverse el conflicto deja de aparecer en conflicto.
- Rendimiento: con muchos registros, `findConflicts` debe ordenar por fecha y no comparar todos contra todos.
- Varias cabañas de una familia (SCRUM-265): se confirman todas o ninguna; si una choca, el diálogo dice cuál.
- Cabaña en mantención (SCRUM-266): no se ofrece; las reservas que ya tenía se avisan al admin.
- Sin conexión (SCRUM-250): la confirmación hecha sin internet queda "Sin sincronizar" y, al reconectar, puede quedar "En conflicto, por resolver".

## Preguntas abiertas
- Si el aforo del restaurante se mide por comida u hora (afecta también SCRUM-244).
- Evento especial nocturno (SCRUM-261).

## Verificación manual
- [ ] Una pendiente del cliente en la cabaña 6: el admin la ve con aviso dentro de la tarjeta y puede crear una reserva pendiente sobre ella.
- [ ] Con una confirmada en la cabaña 6, el admin no la ve y el cliente tampoco.
- [ ] Dos solicitudes de la misma cabaña con fechas cruzadas aparecen resaltadas (lista, detalle y calendario).
- [ ] Salida y entrada el mismo día no se marcan.
- [ ] Desde la solicitud se puede entrar al detalle de la otra.
- [ ] Al aprobar una solicitud que se cruza aparece el diálogo y no confirma nada sin elegir (SCRUM-262).
- [ ] Rechazar una de las dos quita la marca.
- [ ] El cupo de restaurante no mezcla cabañas ni camping.
