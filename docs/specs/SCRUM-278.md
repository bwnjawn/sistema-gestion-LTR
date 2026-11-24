# SCRUM-278 — Vista adaptada a PC

Estado: hecho y Finalizado en Jira. Falta la revisión en pantallas reales (PC y teléfono)
Fase: fase 2

## Contexto
La app estaba pensada para teléfono: todo en una columna de unos 448 px centrada, barra inferior de íconos sin texto, hojas que suben desde abajo. En PC se veía como un teléfono flotando en un fondo vacío. La tarea adapta el panel del administrador y el flujo del cliente a pantallas anchas **sin cambiar el teléfono**.

## Criterios de aceptación
* Desde 1024 px de ancho (`lg:` de Tailwind) el panel usa un menú lateral con ícono y texto y el contenido ocupa el ancho disponible, sin márgenes vacíos a los lados.
* Debajo de 1024 px (teléfono y tablet vertical) todo queda exactamente como antes.
* Las ventanas emergentes se ven anchas en PC y, cuando tienen mucho contenido, en dos columnas.
* El cliente en PC tiene navegación arriba, servicios en cuadrícula y un resumen de la reserva fijo al lado de cada paso.

## Decisiones
* **Menú lateral claro (opción A elegida el 20/11):** fondo blanco, ícono + texto, el activo con fondo verde suave, número de pendientes junto a Solicitudes y "Nueva reserva" abajo. Se descartaron el lateral verde (muy pesado) y las pestañas arriba.
* **Punto de corte:** 1024 px. Una tablet vertical sigue viendo la versión de teléfono.
* **Panel:** el contenido llena el ancho (tope de 1680 px). Inicio con tarjetas en fila más las listas "Por resolver" y "Próximas reservas"; Solicitudes en **lista y detalle** (opción B elegida el 20/11 entre tabla, lista + detalle y tablero): filtros en una barra arriba, filas compactas a la izquierda y el detalle completo de la solicitud elegida a la derecha, con Aprobar y Rechazar en su pie (`AdminRequestFila`, `PanelDetalle` y `AdminRequestDetailModal` con `en-panel`; en teléfono siguen las tarjetas y la hoja); Calendario grande a la izquierda y el detalle del día fijo a la derecha (en teléfono sigue abriéndose en una hoja); Catálogo y Ajustes en cuadrícula.
* **Hojas (`HojaModal`):** ancho normal más generoso en PC y prop `ancho="amplio"` (hasta 896 px) con el contenido en dos columnas; lo que deba ocupar todo el ancho lleva `lg:col-span-2`. Usan `amplio`: detalle de la solicitud, mover fecha, ubicación y los formularios de cabaña, camping y plato.
* **Último paso de la reserva en PC:** sin panel lateral; la revisión a la izquierda y, a la derecha, una tarjeta con el total, el abono y el botón de enviar (`BarraAccionInferior` deja de ser barra fija en PC cuando lleva total).
* **Contacto en PC:** contacto y horarios a la izquierda, mapa grande a la derecha.
* **Cliente:** barra superior (`ClientBarraSuperior`) en lugar de la barra inferior; inicio con las tres tarjetas grandes en fila; pasos con la columna del paso a la izquierda y `ResumenReservaLateral` a la derecha (solo lo ya elegido y el total). La barra de acción inferior se alinea a la derecha con un botón de ancho fijo.

## Cambios por capa
* Servicios: `resumenInicio.ts` (listas del Inicio) y `resumenBorrador.ts` (filas del resumen lateral).
* Composables: `useMenuAdmin.ts` (secciones compartidas por la barra inferior y el menú lateral) y `usePantallaAncha.ts`.
* Componentes: `AdminMenuLateral`, `ClientBarraSuperior`, `ResumenReservaLateral`; ajustes de `AdminLayout`, `AdminHeader`, `HojaModal`, `BarraAccionInferior`, `ClientHeader`, `ReservaLayout` y las vistas.
* Pruebas: `tests/resumenInicio.test.ts` y `tests/resumenBorrador.test.ts`.

## Fuera de alcance
* Acceso a "Mis solicitudes" desde el cliente: SCRUM-289.
* Pantallas de inicio de sesión y registro del administrador (siguen en columna angosta).

## Verificación manual
- [ ] Panel en PC: Inicio, Solicitudes, Calendario, Catálogo y Ajustes se ven completos y sin vacíos.
- [ ] Abrir el detalle de una solicitud y un formulario del catálogo: ancho y dos columnas.
- [ ] Pasos de reserva de cabaña, camping, restaurante y piscina con el resumen lateral.
- [ ] Teléfono sin cambios (barra inferior, una columna, hojas desde abajo).
- [ ] Pantalla grande (1920 px) y portátil chica (1280 px).
