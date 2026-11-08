# Plan de entrega

Hoy: 2026-11-08 · Prototipo: **viernes 13/11** · Entrega final: **viernes 27/11**
Trabajo de una sola persona; el orden no depende del responsable que figura en Jira.

## Meta del sprint
"Entrega al cliente": el cliente envía una solicitud y el administrador la ve, la revisa y la aprueba.

## Fase 0 — Triage (domingo 8 y lunes 9, 2 h)
- [ ] `npm run build` limpio y recorrido manual de los 3 flujos de cliente.
- [ ] Revisar las 18 historias "Finalizado" contra sus criterios. Las dudas están en `docs/reglas-negocio.md`.
- [x] D1, D2 y D3 resueltas provisoriamente: horas y datos de transferencia de ejemplo, editables por el admin y visibles para el cliente. Confirmar los reales con el cliente.
- [x] SCRUM-27 movida al Sprint 3 (8/11).
- [ ] Redefinir el sprint en Jira: meta y fecha de fin 27/11 (las fechas del Sprint 2 están vencidas).

## Fase 1 — Prototipo (hasta el viernes 13/11)
**Alcance del prototipo:** demo en un solo navegador con `localStorage`. El cliente crea una solicitud y el admin la gestiona en el mismo dispositivo. Se avisa al cliente de esa limitación.

Detalle de los hallazgos y su evidencia: [`auditoria-2026-11.md`](auditoria-2026-11.md).

| Día | Trabajo |
|---|---|
| Lun 9 | SCRUM-235 (CI, creado: falta probarlo con un push) · SCRUM-236 (fechas "10 undefined") · SCRUM-237 (logout) |
| Mar 10 | SCRUM-238 (un solo cálculo de precios) · SCRUM-239 (abono requerido y pagado) · SCRUM-233 (transferencia y horarios) |
| Mié 11 | SCRUM-59 (resumen admin) · SCRUM-240 (camping y validaciones) |
| Jue 12 | SCRUM-58 (verificar y cerrar) · SCRUM-241 (fuente, íconos PWA y clases Tailwind) · SCRUM-242 (parche de seguridad) · recorrido completo cliente → admin |
| Vie 13 | Corrección de lo que falle y entrega del prototipo |

**Fuera del prototipo:** SCRUM-60, 56, 229, 231, 243 a 248 y Supabase.

## Fase 2 — Avance fuerte (16 al 20/11)
| Trabajo | Spec |
|---|---|
| SCRUM-60: detección de solapamientos | `docs/specs/SCRUM-60.md` |
| SCRUM-56: "Nueva reserva" con el flujo del cliente | `docs/specs/SCRUM-56.md` |
| SCRUM-229 y SCRUM-231 | `docs/specs/SCRUM-229.md` |
| SCRUM-244 aforo y SCRUM-243 calendario admin | — |
| SCRUM-245: diseño del esquema de Supabase y adaptadores | — |

## Fase 3 — Cierre (23 al 27/11)
- SCRUM-247 (UUID de platos), SCRUM-246 (preparar la capa de datos) y SCRUM-248 (integrar Supabase). Las interfaces por entidad permiten hacerlo sin reescribir las vistas.
- Después de la entrega (Sprint 3): SCRUM-249 (refactor de componentes), SCRUM-250 (modo sin conexión) y SCRUM-27.
- Pruebas completas en celular real.
- **Congelar funcionalidades el martes 24/11.** El 25 y 26 son solo corrección de errores; el 27 es la entrega.

## Riesgo principal
Con `localStorage`, la solicitud de un cliente queda solo en su navegador, así que el admin nunca la ve desde otro dispositivo. Sirve para el prototipo, pero **no para la entrega final**. Por eso Supabase está en la Fase 3 y su diseño empieza en la Fase 2. Si se atrasa, la entrega del 27 no puede considerarse de uso real.
