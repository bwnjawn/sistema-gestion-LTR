# SCRUM-229 — CRUD de acompañamientos (sin, fijo o elegible)

Estado: borrador
Fase: 2 (16 al 20/11)

## Contexto
SCRUM-62 (platos) y SCRUM-35 (acompañamiento fijo) quedaron finalizadas, pero falta que el administrador pueda crear y editar los acompañamientos y definir cómo se comporta cada plato. Sin esto, cambiar un acompañamiento requiere al equipo técnico, que es lo que SCRUM-62 quería evitar.

## Descripción (Jira)
"Considerar que falta agregar operación CRUD de con o sin acompañamiento de elección."

## Situación actual en el código
`types/domain.ts` ya modela el comportamiento:
- `Dish.sideMode`: `'none' | 'fixed' | 'choice'`.
- `Dish.fixedSide`, `Dish.availableSides` y `Dish.availableSideDishes`.
- `GlobalSideDish { id, name }` como catálogo global de acompañamientos.

Hay campos duplicados en `Dish`: `availableSides` y `availableSideDishes`, y también `image` y `mainImage`. Además existe `hasSelectableSides`, que se superpone con `sideMode`. Hay que verificar en `catalogStore.ts` y en `AdminCatalogEditView.vue` cuál se usa realmente en cada pantalla.

## Decisiones propuestas
1. **`sideMode` es la fuente de verdad.** `hasSelectableSides` pasa a derivarse (`sideMode === 'choice'`) y se retira del formulario.
2. **Un solo campo para la lista de opciones.** Se unifica en `availableSideDishes` y se agrega una migración al cargar datos antiguos.
3. **Catálogo global de acompañamientos** con crear, renombrar y eliminar, administrado desde "Editar".
4. **Eliminar un acompañamiento en uso:** se bloquea y se informa qué platos lo usan. Es más seguro que borrarlo en silencio.
5. **Formulario del plato:** un selector de tres opciones (Sin acompañamiento · Fijo · El cliente elige). Según la opción se muestra el selector de fijo, o la lista de opciones.

## Cambios por capa
- **Servicio:** `services/menu.ts` con `normalizeDish(dish)` (migración de campos antiguos), `getSidesInUse(sideId, dishes)` y `validateDish(dish)` (por ejemplo, `fixed` exige `fixedSide`; `choice` exige al menos una opción).
- **Store:** `catalogStore` con `addSide`, `updateSide` y `removeSide`. `removeSide` consulta `getSidesInUse`.
- **Vista:** el `DishModal` y la sección de acompañamientos en `AdminCatalogEditView.vue`.

## Casos borde
- Plato `fixed` cuyo acompañamiento se elimina.
- Plato `choice` sin ninguna opción disponible.
- Cambiar un plato de `choice` a `none` con solicitudes pendientes que ya eligieron: las solicitudes guardan su elección como texto, así que no se rompen.
- Datos antiguos en `localStorage` con campos duplicados.

## Preguntas abiertas
- ¿La lista de acompañamientos es global para todos los platos o cada plato tiene los suyos? (El tipo `GlobalSideDish` sugiere global.)
- ¿Un plato `choice` puede permitir más de una elección?

## Verificación manual
- [ ] Crear, renombrar y eliminar un acompañamiento.
- [ ] Un acompañamiento en uso no se puede eliminar y el mensaje indica los platos.
- [ ] Un plato `none` no pide elección en el flujo del cliente.
- [ ] Un plato `fixed` muestra el acompañamiento sin pedir elección.
- [ ] Un plato `choice` exige elegir antes de continuar.
- [ ] Los cambios persisten al recargar.
