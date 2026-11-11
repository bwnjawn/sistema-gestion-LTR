# Plan de entrega

Última revisión: 2026-11-10 · Prototipo: **viernes 13/11** · Entrega final: **viernes 27/11**
Trabajo de una sola persona; el orden no depende del responsable que figura en Jira.

## Meta del sprint
"Entrega al cliente": el cliente envía una solicitud y el administrador la ve, la revisa y la aprueba.

## Criterio de adelanto (decidido el 8/11)
El objetivo es avanzar todas las tareas posibles antes de mostrar el prototipo; las fechas son tope, no ritmo. Se puede adelantar trabajo de fases posteriores, pero **primero se cierran las tareas de la Fase 1**.

Orden desde el 8/11 (en revisión: 236 a 242, 252, 253, 254, 58, 59, 233):
1. Fase 1 pendiente: SCRUM-255 → 256 → 251 (legibilidad del panel) → 235 (CI, probar con un push).
2. Recorrido completo cliente → admin en el celular y repaso del viernes 13/11.
3. Adelantar Fase 2 en este orden: 243 (calendario), 244 (aforo), 60 (solapamientos), 56 (nueva reserva), 229/231, 257, y 245 (modelo Supabase).
4. Fase 3 (246 a 248) solo cuando lo anterior esté cerrado.

## Cambio de criterio y de plan — 10/11
- **Las fechas son tope, no ritmo.** Solo importan dos hitos: el **13/11** se presenta un avance y el **27/11** todo debe estar listo. Nada está limitado por la fecha: el objetivo es avanzar lo máximo posible; si todo queda listo para el 13, mejor.
- **SCRUM-56 cerrada** (hecha y verificada a mano). El 10/11 se corrigieron sus decisiones sobre cruces y evento especial (ver `specs/SCRUM-56.md`).
- **Reglas de cruces nuevas** (ver `reglas-negocio.md`, sección 5, y `specs/SCRUM-60.md` y `specs/SCRUM-262.md`): solo las confirmadas bloquean; el admin elige cuál confirmar y avisa al cliente por llamada, correo o WhatsApp.
- **Modo sin conexión (SCRUM-250) pasa al Sprint 2 y a prioridad alta:** debe estar en la entrega del 27/11, porque los administradores trabajan en zona rural.

**Tareas nuevas del 10/11 (todas en el Sprint 2), en el orden propuesto:**
1. SCRUM-260: cabañas con solo pendientes se ofrecen con aviso; con confirmada no se ofrecen (rama `fix/SCRUM-260-admin-cabanas-ocupadas`, con código parcial).
2. SCRUM-263: solo las confirmadas bloquean fechas y cupos.
3. SCRUM-262: resolver cruces al confirmar y salidas de contacto.
4. SCRUM-264: plazo de abono de 48 h ("Abono vencido") y exención de instituciones en restaurante.
5. SCRUM-266: marca "En mantención" en cabañas.
6. SCRUM-265: varias cabañas enlazadas para una familia.
7. SCRUM-261: evento especial. **Bloqueada por decisiones de diseño: preguntar al usuario antes de implementar.**
8. SCRUM-250, 245 y 248: sin conexión, esquema de Supabase y restricción de exclusión sobre las confirmadas.

## Registro de avance — 8/11 (cierre del día)

**Hecho y pasado a revisión en Jira**
- SCRUM-244 (aforo), parte 1 y 2:
  - Capacidades del restaurante editables en Ajustes (comedor principal 120, carpa 50, comedor secundario 30; total 200).
  - "Sobrecupo" del calendario medido por personas: por comida en restaurante y por modalidad en camping.
  - Bloqueo de fechas en el calendario del cliente: cabañas (todas las que le sirven ocupadas), restaurante (las 3 comidas llenas) y camping (diario y pernoctar con cupos separados).
  - El límite de 30 personas / 3 menús salió de la vista a `services/menus.ts`, es editable y se valida al avanzar.
- SCRUM-60 (solapamientos): `findConflicts`, aviso en la tarjeta, sección "Se cruza con" en el detalle y marca en el calendario. Las pendientes avisan igual que las confirmadas.
- Corrección del segundo teléfono: `+56 9 5883 3853` (SCRUM-49).
- Reglas actualizadas en `docs/reglas-negocio.md` y spec `docs/specs/SCRUM-60.md`.

**No hecho o con pendientes**
- Ninguna de las dos historias se verificó a mano en el navegador ni en celular: solo build y pruebas automáticas (55 pruebas).
- SCRUM-244: queda el tope fijo de 20 personas en el paso 1 de cabañas (se decide junto con SCRUM-27) y el aforo del restaurante se mide **por comida** (decidido; se confirma en la próxima reunión, D13) y falta confirmar si el máximo de 3 menús es por comida o en total.
- El bloqueo del calendario no aplica al admin (puede cruzar fechas; resolución manual).
- SCRUM-56, 229, 231, 257 y 245 no se tocaron.
- El CI de GitHub (SCRUM-235) sigue sin probarse con un push; no hay push de nada.

**Reunión con el cliente — análisis (todo estaba en Jira salvo lo marcado)**
- Ya existían: SCRUM-27, 47, 51, 42, 72/23, 68/69, 43, 44, 45, 37, 36, 35/229, 84–87, 104–106, 67, 28–31, 50 y 49. Sin contradicciones, salvo las dudas de abajo.
- Nuevo: capacidades del restaurante (120/50/30), ya cargado en SCRUM-244.
- Dudas para el cliente: cabañas "7 y 8" en el acta contra "6 y 8" en Jira y en el catálogo; persona extra por cabaña; horarios reales de pernoctar y de cabañas; si el máximo de 3 menús es por comida o en total; confirmar que el aforo del restaurante es por comida (D13, regla provisoria vigente).
- Jira desactualizado: SCRUM-37 y SCRUM-42 figuran "Por hacer" aunque el código ya cubre horarios y categoría de cliente; conviene cerrarlas tras verificar.

**Siguiente según el plan:** SCRUM-56 (nueva reserva con el flujo del cliente), luego 229/231, 257 y 245.

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
| Jue 12 | SCRUM-58 (verificar y cerrar) · SCRUM-241 (fuente, íconos PWA y clases Tailwind) · SCRUM-242 (parche de seguridad) · recorrido completo cliente → admin en celular (hecho el 8/11, ver "Prueba en celular") |
| Jue 12 | Correcciones de la prueba en celular: SCRUM-253 (modales/teclado iPhone) · SCRUM-254 (navegación cliente) · SCRUM-255 (avisos, copiar transferencia, horarios, tarjetas) · SCRUM-256 (admin: cerrar modal, confirmar fechas, selects) |
| Vie 13 | Repaso de lo corregido y entrega del prototipo |

**Fuera del prototipo:** SCRUM-60, 56, 229, 231, 243 a 248 y Supabase.

## Fase 2 — Avance fuerte (16 al 20/11)
| Trabajo | Spec |
|---|---|
| SCRUM-60: detección de solapamientos | `docs/specs/SCRUM-60.md` |
| SCRUM-56: "Nueva reserva" con el flujo del cliente | `docs/specs/SCRUM-56.md` |
| SCRUM-229 y SCRUM-231 | `docs/specs/SCRUM-229.md` |
| SCRUM-244 aforo y SCRUM-243 calendario admin (filtro por categoría; restaurante con tres estados: libre, con reservas y cupo, completo) | — |
| SCRUM-257: editar y desactivar administradores (idealmente con Supabase Auth, SCRUM-248) | — |
| SCRUM-245: diseño del esquema de Supabase y adaptadores | — |

## Fase 3 — Cierre (23 al 27/11)
- SCRUM-247 (UUID de platos), SCRUM-246 (preparar la capa de datos) y SCRUM-248 (integrar Supabase). Las interfaces por entidad permiten hacerlo sin reescribir las vistas.
- Después de la entrega (Sprint 3): SCRUM-249 (refactor de componentes), SCRUM-250 (modo sin conexión) y SCRUM-27.
- Pruebas completas en celular real.
- **Congelar funcionalidades el martes 24/11.** El 25 y 26 son solo corrección de errores; el 27 es la entrega.

## Prueba en celular
Recorrido cliente → admin hecho el 8/11 en iPhone (Chrome, incógnito). Los hallazgos están en SCRUM-253 a 257 y en comentarios de SCRUM-243/244. Para repetirla en un celular real:

1. Una vez, en PowerShell como administrador: `New-NetFirewallRule -DisplayName "Los Troncos dev (5173)" -Direction Inbound -Protocol TCP -LocalPort 5173 -RemoteAddress LocalSubnet -Action Allow -Profile Any` (se quita con `Remove-NetFirewallRule -DisplayName "Los Troncos dev (5173)"`).
2. `npm run dev:red` y abrir en el celular la dirección "Network" (por ejemplo `http://192.168.1.10:5173/`). El celular debe estar en el Wi-Fi del mismo router, no en una red de invitados.
3. Por `http` no se puede instalar la PWA ni probar el modo sin conexión; eso requiere `https`.
4. Cliente y admin deben usar el mismo navegador (los datos viven en `localStorage`). En incógnito no se deben cerrar todas las pestañas.

## Seguridad del prototipo (SCRUM-242)
- Se quitaron los botones de datos de prueba del login y el enlace público "Crear cuenta".
- `/admin/registro` exige sesión de administrador y está en Ajustes → Administradores. Crear una cuenta no cambia la sesión de quien la crea.
- Las dos cuentas de fábrica (`dueno1@` y `dueno2@troncosderepil.cl`) tienen contraseñas nuevas, definidas en `authStore.ts` (`DEFAULT_ADMINS`). Los navegadores que aún guardaban `admin123` pierden esas cuentas y la sesión asociada al abrir la app.
- **Límite conocido:** la autenticación sigue siendo de prototipo. Las contraseñas están en texto plano en el navegador y en el código de la aplicación, así que cualquiera con acceso al navegador o al código puede leerlas. No sirve para datos reales. La autenticación de verdad llega con Supabase Auth (SCRUM-248); hay que cambiar las contraseñas de fábrica antes de la entrega final.

## Riesgo principal
Con `localStorage`, la solicitud de un cliente queda solo en su navegador, así que el admin nunca la ve desde otro dispositivo. Sirve para el prototipo, pero **no para la entrega final**. Por eso Supabase está en la Fase 3 y su diseño empieza en la Fase 2. Si se atrasa, la entrega del 27 no puede considerarse de uso real.
