# Investigación: la app queda hasta ~2 minutos sin hablar con Supabase tras el modo avión (iPhone)

Tarea: **SCRUM-274** (arranque resistente) · Rama: `feat/SCRUM-274-arranque-resistente` · Fecha: 2026-11-16
Estado: **investigación abierta**. Hay una mitigación hecha (mensaje) y un experimento pendiente para el 17/11.

## 1. El síntoma

En el iPhone, con la app del administrador abierta, al **activar y desactivar el modo avión** la app se queda en la
pantalla "Sin conexión" (o "Cargando…") durante **hasta ~2 minutos**, aunque el teléfono ya tiene Wi-Fi y **Safari carga
páginas**. Cerrar la app del todo y volver a abrirla lo arregla al instante. Pasa con la app instalada en la pantalla de
inicio y también con Chrome del iPhone (los dos usan el motor de Safari, WebKit).

Entorno de las pruebas: iPhone, app abierta con `npm run dev:red` por la red local (`http://192.168.x.x:5173`), Supabase
en internet (`https://<proyecto>.supabase.co`).

## 2. Qué se probó y qué se descartó (en orden)

| # | Hipótesis | Resultado |
|---|---|---|
| 1 | La pantalla en blanco inicial: la app no se monta hasta cargar todos los datos y `index.html` estaba vacío | **Confirmada y corregida** (pantalla de carga en `index.html`, `arrancarConReintentos`) |
| 2 | La demora de ~12 s sin internet: Supabase reintenta renovar la sesión caducada con espera creciente (200+400+800+… ms) y todas las consultas esperan detrás | **Confirmada y medida**: 25,5 s la primera vez (8 intentos) y 0,0 s la segunda, porque guarda el fallo 60 s (`lastRefreshFailure`). Mitigada: sin red no se toca a Supabase, y la renovación en segundo plano se detiene (`src/lib/supabase.ts`, `src/lib/red.ts`) |
| 3 | `navigator.onLine` queda pegado en "sin internet" en iPhone y la app no vuelve a probar | **Descartada**: el diagnóstico muestra `onLine=true` todo el rato y la app ya no usa esa bandera para decidir |
| 4 | Mi bucle de comprobación se detiene en iOS | **Descartada**: los intentos siguen cada ~6 s (hasta el #21 a las 03:30:08, más de 2 minutos) |
| 5 | El Wi-Fi o internet general del teléfono tardan en volver | **Descartada**: en el mismo momento el servidor local y un sitio de internet de control (`gstatic.com`) responden en ~40 ms |
| 6 | **Una conexión "muerta" hacia Supabase, reutilizada por la app** | **Es la que encaja con todos los datos** (ver 3 y 4). Aún no probada de forma directa |

## 3. La evidencia del iPhone (diagnóstico `diag-1`, capturas del 16/11 03:28–03:30)

La pantalla de arranque mostró, por cada intento, tres peticiones hechas a la vez:

| Destino | Resultado en **todos** los intentos (#1 a #21) |
|---|---|
| Supabase (`/auth/v1/health`) | `FALLÓ 4000–4003 ms AbortError: Fetch is aborted (cortado por tiempo)` |
| Servidor local (`/favicon.png`, red local) | `ok 200` en 9–43 ms |
| Internet de control (`gstatic.com/generate_204`) | `ok` en 41–73 ms |

Otros datos: `navigator.onLine=true` todo el tiempo · eventos `online` 03:28:14 y `app visible` 03:28:15 · página cargada a
las 03:28:12 · primer intento 03:28:16 · en la prueba anterior la app volvió tras unos 2 minutos entre esperar y tocar
Reintentar · **Safari, al abrir la dirección de Supabase, mostró una respuesta (un error de "falta la clave"), o sea que
llegó**.

Lectura: la petición a Supabase **no falla, se queda colgada**; el resto de la red funciona en el mismo proceso; Supabase
es alcanzable desde el teléfono (Safari). Solo la conexión que la app tiene con ese servidor está rota.

## 4. La explicación más probable

Antes del modo avión la app tenía abierta una conexión con Supabase (HTTP/2, con reutilización). Al volver el Wi-Fi, el
router ya olvidó esa conexión y descarta en silencio lo que se envía por ella. La app espera una respuesta que no llega hasta
que iOS la da por perdida (~2 minutos). Todas las peticiones nuevas a ese servidor reutilizan la misma conexión y se cuelgan
también.

Por qué encaja:
- **El servidor local no sufre:** en una red local, cuando le llega un mensaje de una conexión que no conoce responde al
  instante "no existe" y la app abre una nueva. En internet nadie avisa.
- **Internet de control funciona:** esa conexión era nueva (no había una vieja reutilizable).
- **Safari funciona:** tiene sus propias conexiones.
- **Cerrar la app lo arregla:** el proceso muere y se descartan sus conexiones. **Recargar la página no sirve** (la conexión
  es del proceso, no de la página): es lo que se vio con las recargas de Vite.

**Variante con los mismos síntomas:** el estado guardado de HTTP/3 (QUIC) para ese servidor. Con los datos actuales no se
pueden distinguir. Confianza en la explicación: media-alta, **no probada**.

## 5. Qué implica

- **No es un error de la lógica de la app.** Comprobar más seguido no ayuda: cada comprobación cae en la misma conexión.
- **No es solo del entorno de desarrollo.** El mismo efecto debería darse en la app publicada en cualquier iPhone al cambiar
  de red (modo avión, Wi-Fi ↔ datos). Para los dueños, en zona rural con señal intermitente, es un caso real. Se confirmará
  con la app publicada en HTTPS (decisión de hosting pendiente, A7 de `docs/plan-supabase.md`).
- **El transporte de iOS no se puede arreglar desde JavaScript.** Solo se puede mitigar o esquivar.

## 6. Lo que ya está hecho

- Pantalla de carga inmediata en `index.html`; la app nunca queda en blanco.
- `src/lib/arranqueConReintentos.ts`: espera a que el servidor responda de verdad antes de cargar, avisa a los 6 s ("Está
  tardando más de lo normal"), reintenta sola y, **tras 20 s sin respuesta, sugiere "cierra la app del todo y vuelve a
  abrirla"** (`mostrarSugerenciaDeReinicio`). Es la mitigación de hoy y es lo único que hace volver más rápido.
- `src/lib/red.ts`: estado de la red según lo que responde el servidor (no `navigator.onLine`); con la red caída no se toca a
  Supabase y se vuelve a comprobar cada 3 s.
- `src/lib/fetchConTiempoLimite.ts`: tope de 15 s en cada consulta.
- **Instrumento temporal** `src/lib/diagnosticoDeRed.ts` (ver sección 8): sigue en la rama para repetir las pruebas.

## 7. Experimento pendiente (17/11): ¿alguna variante de la petición escapa de la conexión muerta?

**Objetivo:** saber si existe alguna forma de hacer que el navegador use **otra** conexión hacia Supabase mientras la vieja
está colgada. Si existe, la app podría recuperarse en segundos en vez de minutos.

**Qué agregar a `src/lib/diagnosticoDeRed.ts`** (cuatro sondas más por intento, además de las tres que ya hay):

| Sonda | Petición | Qué prueba |
|---|---|---|
| E1 | La misma de Supabase con `credentials: 'include'` (Supabase ya responde con `Access-Control-Allow-Credentials: true` y el origen, así que el navegador la acepta) | Si las peticiones "con credenciales" usan un grupo de conexiones distinto |
| E2 | Un nombre de servidor equivalente con un punto al final: `https://<proyecto>.supabase.co./auth/v1/health` | Si un nombre distinto fuerza una conexión nueva (puede fallar por el certificado: también es un dato) |
| E3 | La misma petición con un parámetro nuevo en la URL (`?x=<hora>`) | Control: no debería ayudar (misma conexión). Si **sí** ayuda, la causa no es la conexión |
| E4 | Otra ruta del mismo servidor (`/rest/v1/`) | Control: tampoco debería ayudar |

Además, anotar **la versión de HTTP** de las respuestas anteriores a Supabase, si el navegador la entrega
(`performance.getEntriesByType('resource')[i].nextHopProtocol`; en peticiones a otro dominio puede venir vacío): sirve para
distinguir HTTP/2 de HTTP/3.

**Cómo ejecutarlo** (con el iPhone, `npm run dev:red`):
1. Abrir la app, activar y desactivar el modo avión, y esperar en "Sin conexión".
2. Tomar una captura cada ~30 s y otra justo cuando vuelva.
3. Repetir en estas condiciones, anotando si cambia algo: (a) app instalada, (b) Chrome del iPhone, (c) **pestaña normal de
   Safari** (no instalada: si ahí no pasa, el problema es de las apps instaladas), (d) apagar y encender solo el Wi-Fi,
   (e) cambiar entre Wi-Fi y datos móviles.
4. Anotar cuánto tarda en volver la sonda normal de Supabase (el tiempo exacto, no "~2 minutos").

**Cómo leer los resultados y qué decisión tomar:**

| Resultado | Conclusión | Siguiente paso |
|---|---|---|
| E1 o E2 responden **y** la normal se cuelga | Hay una vía para esquivar la conexión muerta | Evaluar una "vía de recuperación": tras ~10 s de colgada, las peticiones usan esa variante hasta que la normal vuelva (y revisar cómo aplicarla a Realtime). Es un truco: valorar su costo antes de adoptarlo |
| Ninguna variante responde (E3 y E4 también cuelgan) | Confirma conexión muerta y que no se puede esquivar | Dejar la mitigación del mensaje y **priorizar SCRUM-250** (copia local: la app abre y trabaja sin esperar al servidor). Considerar también un **servidor propio como intermediario** (el dominio de la app reenvía a Supabase) y probarlo en la versión publicada |
| E3 responde | La causa no es una conexión por servidor: revisar el estado de DNS/QUIC | Replantear la hipótesis con el dato de `nextHopProtocol` |
| En una pestaña de Safari no pasa | Es propio de las apps instaladas (WebKit las trata como proceso aparte) | Documentarlo; considerar recomendar usarla desde Safari hasta tener la versión publicada |

## 8. El diagnóstico temporal (`diag-1`) — **QUITAR ANTES DEL PR**

Para que se pueda repetir mañana, el instrumento sigue en la rama. Qué muestra, en la pantalla de arranque: versión
(`diag-1`), hora de carga de la página y hora actual, `navigator.onLine`, la carga de datos, los avisos del navegador y, por
cada intento, el resultado hacia Supabase, el servidor local y un sitio de internet.

Para quitarlo (todos los puntos están marcados con `TEMPORAL (SCRUM-274)`):
1. Borrar `src/lib/diagnosticoDeRed.ts` y `tests/diagnosticoDeRed.test.ts`.
2. En `src/main.ts`: quitar el `import`, la llamada a `registrarEventosDeRed()` y volver a `iniciar: inicializarAplicacion` y
   `comprobarServidor: comprobarRed`.
3. En `src/lib/pantallaDeArranque.ts`: quitar el `import`, la suscripción `alActualizarDiagnostico(...)` y el bloque del
   elemento `<pre id="arranque-diagnostico">`.
4. `npm run build` y `npx vitest run` deben seguir pasando.

## 9. Cómo reproducir en el escritorio (y sus límites)

`scripts/repro-red-chrome.mjs` abre un Chrome real, bloquea solo Supabase (como en el iPhone, donde el servidor local sí
responde) y muestra el diagnóstico: comprueba que la app muestra "Sin conexión", comprueba cada 2 s y **carga sola al
volver** (~2 s). **Chrome de escritorio no reproduce la conexión muerta de iOS**: sirve para validar la lógica, no el defecto.
Para ver el efecto de internet cortado desde el navegador: F12 → Network → "Offline"; para algo más cercano a producción,
`npm run build` y `npm run preview` (sin las recargas de Vite).

Dos aclaraciones sobre `dev:red`: con Vite en desarrollo, **cada vez que el teléfono pierde la conexión con el computador
la página se recarga entera** al volver (`[vite] server connection lost. Polling for restart...`); en la versión publicada
eso no ocurre.

## 10. Pendientes relacionados

- El aviso "Sin conexión a internet" del encabezado y el bloqueo del envío (`settingsStore.isConnected`, usado por
  `useEnvioSolicitud`) siguen usando `navigator.onLine`, que en iPhone puede quedar pegado. Conectarlos a `src/lib/red.ts`.
- Realtime (SCRUM-273) usa el mismo servidor: probablemente sufre el mismo estancamiento y se reconecta solo; falta medirlo.
- La solución de fondo es **SCRUM-250** (abrir con la última copia guardada y funcionar sin conexión).
- Antes del PR: quitar el diagnóstico (sección 8), decidir qué se hace con el experimento, y apuntar el PR a la rama de
  SCRUM-273 (o a `main` si el PR #21 ya entró).
