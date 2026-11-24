# SCRUM-287 — Conflictos legibles en el detalle de la solicitud

Estado: hecho y Finalizado en Jira. Falta la revisión en el teléfono
Fase: fase 2

## Contexto
El bloque rojo "Se cruza con…" del modal de detalle era difícil de interpretar. El administrador necesita responder tres preguntas: **cuáles se topan**, **cuál le conviene aprobar** y **qué hace con las que le quedan**. Depende de SCRUM-60 (detección de cruces), SCRUM-262 (diálogo de confirmación) y SCRUM-250 (confirmaciones sin conexión).

## Criterios de aceptación
* El detalle explica con una frase clara con qué se topa la solicitud, sin jerga ("juntas superan el aforo de el almuerzo…").
* Cada solicitud involucrada muestra lo que sirve para decidir: fechas, personas, estado, abono, cuándo llegó y cuántas noches se pisan.
* Se distingue de un vistazo la solicitud actual, las confirmadas y las pendientes.
* Aguanta muchas solicitudes a la vez (franja plegable, 4 filas y "Ver las N restantes").
* Cubre cabañas, restaurante y camping.

## Decisiones
* **Cuatro niveles** (`NivelCruce`): `bloqueo` (la ocupa una confirmada, no se puede aprobar), `sin-conexion` (se confirmó sin internet y chocó), `cruce` (solo pendientes, el admin elige) y `confirmada` (esta ya ganó; solo informa). Solo los dos primeros usan rojo; el resto es neutro.
* **Distinción de filas:** la solicitud actual lleva etiqueta oscura "Esta solicitud" y barra gris; la confirmada, barra y fondo verdes; la pendiente, ninguna marca. Todas llevan la insignia de estado de la app. Los nombres no usan el verde del proyecto, para que no parezca "confirmada".
* **Orden de las demás:** confirmadas primero (son las que bloquean) y luego por orden de llegada, la más antigua arriba.
* **Sin gráficos de barras:** se probaron líneas de tiempo y barras de cupo en una maqueta y se descartaron por saturadas; se prefirió texto con números.
* **"Si apruebas esta":** en cabañas, las pendientes que se pisan quedan sin lugar. En restaurante y camping se calcula, de a una, quién sigue cabiendo con lo ya confirmado más esta (no todas juntas).
* **Qué hacer ahora** (bloqueo y sin conexión): en cabañas, primer hueco libre de la misma cabaña donde cabe la estadía (búsqueda hasta 90 días); en restaurante y camping, el cupo libre.
* **Franja plegable:** abierta si hay 4 solicitudes o menos; plegada si hay más.
* **Aprobar en un solo paso** (20/11): antes, "Aprobar" abría el diálogo de elegir cuál confirmar, había que confirmar de nuevo y solo entonces aparecían los botones para avisar a las demás. Ahora el bloque del detalle ya muestra la comparación, así que "Aprobar" confirma directo y abre `AdminConfirmarCruceDialog` solo para avisar o mover la fecha de las que perdieron el lugar ("Reserva confirmada · Estas solicitudes quedaron sin lugar"). Se quitó el botón "Comparar y decidir". Si falta abono, el aviso de SCRUM-264 sigue yendo antes.
* **Aprobar desde la lista:** si la solicitud se cruza con otras, el botón de la tarjeta abre el detalle (donde se ve con qué se topa) en vez de abrir el diálogo de elegir.

## Cambios por capa
* Servicio: `src/services/resumenCruce.ts` (`resumirCruce`, `describirLlegada`, `unirNombres`). `Conflicto` (en `availability.ts`) trae ahora `cupo` opcional (tope, comida o modalidad) para explicar el cupo.
* Componente: `src/components/admin/AvisoCruceSolicitud.vue`, usado por `AdminRequestDetailModal.vue` en lugar del bloque anterior.
* Pruebas: `tests/resumenCruce.test.ts`.

## Casos borde
* Una reserva confirmada que se topa con pendientes muestra solo información (antes decía "decide cuál aprobar").
* Camping por varias noches: se listan solo las noches que pasan del cupo.
* Sin hueco libre en 90 días: no se muestra la línea de fechas libres.

## Preguntas abiertas
* La lista de solicitudes (`AdminRequestCard`) no cambió; solo el detalle.
* Los textos de la frase de cada nivel están por revisar con el usuario (20/11: "Se confirmó sin internet y, al sincronizar, ya había otra reserva confirmada que choca…" no lo convence).

## Verificación manual
- [ ] Cabaña bloqueada por una confirmada ("Por mover"): frase, filas y fechas libres.
- [ ] Cabaña con varias pendientes: "Si apruebas esta" y "Comparar y decidir".
- [ ] Restaurante: cupo, confirmadas y libres; quién sigue cabiendo.
- [ ] Camping por varias noches.
- [ ] Reserva confirmada con pendientes encima: solo informa.
- [ ] Más de 4 solicitudes: franja plegada y "Ver las N restantes".
- [ ] Probado en el iPhone con la letra grande.
