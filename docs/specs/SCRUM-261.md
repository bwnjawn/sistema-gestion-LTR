# SCRUM-261 — Evento especial: contacto, formulario inicial y cotización

Estado: borrador (Abierta en Jira). Ya no está bloqueada: la reunión del 22/11 resolvió casi todo.
Fase: 2. Falta definir el abono y cómo se ve en el calendario.

## Contexto
Los eventos son coffee break, casamiento, bautizo y similares. Tienen **menú especial, no fijo** (cambia según el evento). Para el administrador sirve sobre todo para **cotizar**; no es una reserva con precio cerrado.

## Situación actual en el código
- El home tiene la tarjeta «Evento especial» que abre un panel con los teléfonos del administrador (`HojaContactoEvento`, SCRUM-45). No abre un formulario.
- El administrador puede marcar `details.isSpecialEvent`, que hoy es solo una marca.
- La cotización en PDF (SCRUM-71, hecha) existe para las solicitudes normales.

## Decisiones (reunión del 22/11)
1. **Comunicación por WhatsApp:** la app solo abre WhatsApp, sin chat propio. El cliente debe poder entender algunas cosas de los menús.
2. **Formulario inicial del cliente:** el cliente llena lo que quiere al empezar (por ejemplo coffee break u otros servicios). Es la base de la cotización.
3. **Cotización flexible:** el administrador arma la cotización agregando líneas libres con **categoría, servicio dado y precio**, sin lista fija.
4. **Qué se cierra lo decide el administrador**, según lo que pida el cliente:
   - todo un **comedor**, con **cobro adicional** (el monto varía);
   - todo el **exterior** (camping y piscina), no solo para iglesias;
   - el **día entero**, aunque el evento no ocupe la mañana (el evento puede cubrir las ganancias del día). También lo pueden hacer los administradores por su cuenta.
5. No cierra un servicio completo por defecto. Si se puede registrar otro servicio el mismo día, lo decide el administrador.
6. Cómo se cobra y qué extras lleva lo decide el administrador.

Esto reemplaza la decisión del 10/11 de que el evento «bloquea todo el restaurante».

## Por decidir
- **Abono del evento:** los dueños no lo saben. Preguntar.
- **Calendario:** cómo se marca lo cerrado (comedor, exterior, día) en el calendario del admin y cómo se relaciona con `findConflicts` y la disponibilidad del cliente.
- Qué preguntas lleva el formulario inicial.
- Si la cotización flexible es un tipo nuevo de documento o una extensión de la de SCRUM-71.

## Cambios por capa
- **Servicio:** modelo de líneas de cotización (categoría, servicio, precio) y el cierre por comedor, exterior o día en `services/availability.ts`.
- **Store y repositorio:** guardar el formulario inicial y las líneas; migración en Supabase.
- **Vista:** formulario del cliente, editor de líneas del administrador y la marca en el calendario.

## Verificación manual
- [ ] El cliente llena el formulario y el administrador lo ve en la solicitud.
- [ ] El administrador agrega y quita líneas de la cotización.
- [ ] Cerrar el comedor, el exterior o el día bloquea lo que corresponde para el cliente.
- [ ] El botón de WhatsApp abre con el mensaje correcto.
