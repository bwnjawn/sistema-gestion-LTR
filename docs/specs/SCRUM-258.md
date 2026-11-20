# SCRUM-258 — Estados de carga: esqueletos, aviso de espera y reintento

**Fase:** 2 · **Decisiones del usuario (21/11):** Opción A (el arranque no cambia; solo el panel del administrador tras iniciar sesión), aviso a los 8 segundos, esqueleto con pulso suave.

## Problema
Nadie sabía si la app estaba trabajando o se había colgado, y el administrador esperaba en "Verificando…" sin ver el panel mientras cargaban solicitudes y catálogo.

## Decisiones
- **Opción A.** La app sigue sin montarse hasta tener los datos públicos (pantalla del logo del arranque, con su error y "Reintentar"). Mostrar esqueletos desde el primer instante para todos (Opción B) obliga a que cada pantalla y guarda del router soporte "todavía no hay datos": queda para después de la entrega.
- **Tras iniciar sesión el panel se abre de inmediato** y los datos del administrador (solicitudes y catálogo completo) llegan por detrás. `authStore.datosAdmin` es `listo | cargando | error`; `cargarDatosAdmin()` los pide y también sirve de Reintentar.
- **A los 8 segundos** de espera aparece, sin quitar el esqueleto, "Está tardando más de lo normal" con Reintentar (`lib/avisoDeEspera.ts`). En la pantalla del logo del arranque (cliente y administrador) se muestra lo mismo, con un script de `index.html` que recarga la página.
- **Si falla** la carga, la vista muestra el motivo en rojo con Reintentar; lo que ya estaba cargado no se pierde.
- **No hay esqueleto al actualizar** (botón Actualizar, volver a la app, tiempo real): se conserva lo que ya se ve y se refresca por detrás.
- **Legibilidad:** el esqueleto no lleva texto; el contenedor usa `role="status"` y `aria-busy`. Pulso suave que se detiene con "reducir movimiento". Los avisos son de 16 px y respetan "Letra grande".

## Dónde está
| Pieza | Archivo |
|---|---|
| Bloque gris con pulso | `components/ui/EsqueletoBloque.vue` |
| Envoltura (esqueleto, aviso, error) | `components/admin/CargaDatosAdmin.vue` |
| Esqueletos de Inicio, Solicitudes, Calendario y Catálogo | `components/admin/EsqueletoInicioAdmin.vue`, `EsqueletoSolicitudes.vue`, `EsqueletoCalendarioAdmin.vue`, `EsqueletoCatalogoAdmin.vue` |
| Reloj de 8 s | `lib/avisoDeEspera.ts` |
| Estado de la carga | `stores/authStore.ts` (`datosAdmin`, `errorDatosAdmin`, `cargarDatosAdmin`) |

## Doble toque
- **Enviar solicitud (cliente):** `useEnvioSolicitud` ya ignoraba un segundo toque mientras se envía.
- **Guardar pago (administrador):** faltaba. Ahora el botón queda en "cargando" y `requestsStore.registerPayment` rechaza un segundo pago de la misma solicitud mientras el primero se guarda, así no se duplica.

## Pruebas
`tests/dobleToque.test.ts`: dos toques seguidos en Guardar pago y en Enviar solicitud no duplican nada.
`tests/cargaAdmin.test.ts`: el reloj de 8 segundos (empieza, se reinicia, se detiene), login que responde antes de tener los datos, error con motivo, Reintentar y cierre de sesión.
