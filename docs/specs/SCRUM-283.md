# SCRUM-283 — Camping: cupos por grupos, editables por el administrador

Estado: borrador (Por hacer en Jira). **Decisión del 22/11: es obligatoria y es lo que importa en camping.**
Fase: 2. Decidir si entra antes del congelamiento del 24/11 (toca la base de datos).

## Contexto
Hoy el camping limita por **personas**: 150 por modalidad, con `diario` y `pernoctar` separados (`capacityRules.maxCampingPeopleCapacity`). Los dueños piensan en **grupos**, no en personas.

## Decisión (22/11)
Cupos por grupos, con estos valores iniciales:
- **2 grupos de día**
- **3 grupos de noche**
- **5 grupos grandes**

El administrador debe poder **cambiarlos desde la app**. No se fija el precio del espacio grande ni los horarios: también los edita el administrador.

## Situación actual en el código
- Los espacios se crean y editan en Catálogo → Camping (`CampingModal.vue`, `catalogStore`).
- Cada espacio es «Día y noche» o «Solo de día», con rango de personas (general de 1 a 9, grande de 10 a 150).
- El bloqueo y el sobrecupo usan personas: `isCampingDayBlocked`, `getDayOccupancy`, `findConflicts` (`services/availability.ts`).

## Por decidir
- Qué es exactamente un «grupo grande»: ¿el espacio de 10 o más personas?
- Si el cupo por grupos **reemplaza** al tope de 150 personas o convive con él.
- Dónde se editan (Ajustes o Catálogo) y si el cupo es por espacio o por modalidad.
- Cómo se migran los datos existentes en Supabase.

## Cambios por capa
- **Servicio:** contar grupos confirmados por modalidad y tipo de espacio, en lugar de personas.
- **Store y repositorio:** nuevos ajustes de cupos y su migración; recordar que `pending` no ocupa cupo, solo `confirmed`.
- **Vista:** pantalla de edición para el administrador y el mensaje de cupo lleno para el cliente.

## Verificación manual
- [ ] El administrador cambia un cupo y el cliente ve el efecto.
- [ ] Con el cupo lleno, el cliente no puede elegir ese día; el administrador ve el aviso.
- [ ] Cancelar una confirmada libera el cupo.
- [ ] Las solicitudes antiguas siguen contando.
