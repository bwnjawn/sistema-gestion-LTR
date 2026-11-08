# Auditoría técnica — verificada contra el código (2026-11-08)

Origen: una revisión externa anterior. Cada punto se comprobó en el código actual; aquí solo queda lo que sigue vigente.
`npm run build` (con `vue-tsc`) **pasa limpio**, así que el punto "error de compilación por props sin usar" no aplica.

## Errores confirmados

| # | Hallazgo | Evidencia | Historia |
|---|---|---|---|
| 1 | El logout no cierra la sesión (clave distinta a la que guarda) | `authStore.ts:146` borra `ltr_admin_user`; se guarda como `ltr_reserva_admin_user` | SCRUM-237 |
| 2 | Fechas como "10 undefined" | `const [m, d] = dateStr.split('-')` en CabanaStep1, 3 y 4 y CampingStep3 y 4; `formatDateShort` copiada en 10 archivos | SCRUM-236 |
| 3 | El precio mostrado puede diferir del guardado | Step4 con `0.19` y `\|\| 65000` / `\|\| 10000`; `reservationStore.ts:207-224` recalcula; `calculateCabinPrice` y `calculateRestaurantPrice` sin uso | SCRUM-238 |
| 4 | Toda solicitud nueva aparece "Abonado (Parcial)" | `AdminRequestsView.calculatePaymentState` trata `depositAmount` (requerido) como pagado | SCRUM-239 |
| 5 | `AdminNewBookingModal` calcula mal y `addRequest` fuerza `pending`; el botón flotante "Nueva Reserva" lleva al portal del cliente | `AdminNewBookingModal.vue`, `AdminLayout.vue:11` | SCRUM-56 (spec) |
| 6 | IDs de platos no son UUID (`g6…`, `h7…`, `i8…`, `j9…`) | `catalogStore.ts:90,102,113,124` | SCRUM-247 |
| 7 | Los repositorios son un espejo y los errores no llegan a las acciones; claves distintas (`global_sides` / `global_side_dishes`) | `requestsStore.ts` (`watch`), `catalogStore.ts:149`, `catalogRepository.ts:43` | SCRUM-246 |
| 8 | Calendario: semana con `getDay() + 1`, día de salida contado como ocupado | `AdminCalendarView.vue:66,114` | SCRUM-243 |
| 9 | El aforo no se aplica; `isDateDisabledFn` sin uso; tope fijo de 200 en restaurante | `AdminSettingsView.vue`, `RestaurantStep1View.vue:60` | SCRUM-60 y la historia de aforo |
| 10 | Camping asigna `campingSites[0]` por defecto e ignora la modalidad | `CampingStep2View.vue:48` | SCRUM-240 |
| 11 | Guards débiles (teléfono `'+56 9 '`), `nextStep()` ausente en Camping 2, `StepIndicator` con etiquetas fijas | `reservationStore.ts:87`, `StepIndicator.vue:13-16` | SCRUM-240 |
| 12 | Configuración incompleta: no hay edición de horarios de cabaña ni de restaurante; datos de transferencia inexistentes | `CategorySchedulesModal.vue` solo camping | SCRUM-233 y SCRUM-231 |
| 13 | Contraseñas `admin123` en texto plano, registro público, botones de prueba | `authStore.ts:15-28`, `router/index.ts:36` | SCRUM-242 (parche) y SCRUM-248 (Auth real) |
| 14 | Mutación directa del store en la vista | `AdminRequestsView.vue` (`status`, `details`) | SCRUM-59 (spec) |
| 16 | Tailwind v4 en un proyecto v3 (`shadow-xs` ×65, `shadow-2xs` ×36, `backdrop-blur-xs` ×19, `active:scale-98` ×5); 9 clases `dark:`; Inter en lugar de Atkinson; `/vite.svg` y los íconos PWA no existen en `public/`; mapa con coordenadas positivas | `tailwind.config.js`, `index.html`, `settingsStore.ts:35` | SCRUM-241 |

## Deuda técnica confirmada
- 36 valores heredados (`'cabaña'`, `'confirmada'`…): SCRUM-246.
- `alert()` en `lib/persistence.ts:31`: SCRUM-246.
- `AdminBottomNav` duplicada (layout y `AdminRequestsView`), componentes sin uso y duplicación de plantillas: SCRUM-249.
- Códigos `SOL-xxx` (900 combinaciones) y `ADM-xxxx` aleatorios: se resuelven con la generación en base de datos, SCRUM-248.
- Modelo plano `ReservationRequest` y tipos fuera de `domain.ts`: SCRUM-245.
- Modo sin conexión: SCRUM-250.

## Ya no aplica o ya está resuelto
- `.env*` en `.gitignore`, UUID reales (`lib/id.ts`), estados `pending/confirmed/rejected` en el dominio.
- Props sin usar con error de compilación: el build pasa con `noUnusedLocals` activo.
- Rutas duplicadas `admin-edit` / `admin-catalog`: hoy `editar` solo redirige a `catalogo`.

## Decisión de enfoque
No reescribir todas las vistas al modelo `Booking` antes del 27/11. Se define el esquema de Supabase (SCRUM-245) y se adapta en el borde del repositorio (SCRUM-246). Las vistas cambian después.
