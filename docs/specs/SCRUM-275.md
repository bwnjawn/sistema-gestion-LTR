# SCRUM-275 — Exportar las solicitudes a Excel

Estado: hecho y Finalizado en Jira
Fase: fase 2 (historia nueva del 18/11, sin sprint asignado)

## Contexto
El administrador necesita llevarse todos los registros a Excel para ordenarlos y analizarlos por año, mes, servicio o estado.

## Criterios de aceptación (Jira)
- Botón "Exportar a Excel" en Solicitudes: genera un .xlsx con todas las solicitudes (también rechazadas y canceladas) o solo las que se ven filtradas.
- Hoja de registros con año y mes (por fecha del evento), fecha de creación y filtros en los encabezados.
- Hojas de resumen por mes, por servicio y por estado.
- Incluye teléfono y correo del cliente (solo para el administrador).

## Decisiones (18/11, con el usuario)
- **Año y mes** salen de la **fecha del evento** (el inicio de la reserva); la fecha de creación va en otra columna. "Mes" va como número (para ordenar bien) y "Nombre del mes" como texto.
- Los filtros y el orden se hacen **dentro de Excel**: la hoja de registros es una tabla de Excel con botones de filtro en cada encabezado. Antes de exportar solo se elige **Todas** o **Solo las que veo en pantalla** (esta opción aparece solo si los filtros dejan fuera alguna).
- Registros ordenados de la fecha más próxima a la más lejana; las solicitudes sin fecha, al final.
- Resúmenes fijos con los datos exportados: por mes (cronológico, con el monto confirmado por servicio), por servicio y por estado, cada uno con su fila de totales. Los montos de "confirmado" y "pendiente" incluyen IVA; las descartadas cuentan como solicitud pero no suman dinero.
- Los montos usan `desglosarMontos` de `services/cotizacion.ts`, el mismo cálculo del PDF.

## Dónde está
- `services/exportacion.ts`: arma las hojas como datos (columnas y filas), sin tocar el archivo.
- `lib/excelSolicitudes.ts`: escribe el .xlsx con `exceljs`, que se carga solo al pulsar el botón (fragmento de unos 930 KB).
- `components/admin/AdminExportarExcelDialog.vue` y el botón en `AdminRequestsView.vue`.
- Pruebas: `tests/exportacion.test.ts`.

## Pendiente de verificar a mano
- Abrir el archivo en Excel y comprobar filtros, fechas y formato de dinero; en iPhone, que la descarga del .xlsx se pueda abrir.
