# SCRUM-288 — Aviso arriba que confirma cada acción del administrador

**Fase:** 2 · **Decisiones del usuario (21/11):** aviso en el encabezado (no un modal centrado), **Opción 2: barra bajo el encabezado**, **4 segundos**, textos aprobados.

## Problema
La app solo avisaba cuando algo **fallaba** (cuadro rojo). Cuando salía bien, la hoja se cerraba y no se decía nada: los administradores (unos 60 años) quedaban con la duda de si se aprobó, se rechazó o se guardó.

## Decisiones
- **Barra bajo el encabezado, no modal.** No bloquea ni obliga a un toque extra por acción, y es coherente con la regla del proyecto (las hojas son para decidir; la única caja centrada son las ayudas "?"). Es una barra de ancho completo pegada al encabezado, como la de "Sin conexión"; va por encima de las hojas (`z-60`) para que se vea aunque haya una abierta.
- **Cinco tonos, mismo lugar, copiados de las insignias de estado de la app** (decidido el 21/11: rechazar o cancelar en verde era incoherente, porque verde dice "salió bien"):
  - **Verde** con ✓ (como "Confirmada"): se guardó o se aprobó algo.
  - **Gris** con ✕ (como "Descartada"): se rechazó, canceló o quitó algo (rechazar, cancelar, pago quitado, dar de baja, "en mantención", acompañamiento o reglamento quitado). No es un error ni una buena noticia.
  - **Ámbar** con reloj (como "Pendiente"): quedó bien pero pide revisar algo (sincronizó y alguna reserva quedó en conflicto).
  - **Azul** con nube tachada (como "Sin sincronizar"): quedó guardado solo en este teléfono, se enviará al volver la señal; **nunca** se dice "listo" de lo que solo quedó en cola.
  - **Rojo** con ⚠: no se guardó (el de antes).
- **Duración:** el verde y el azul se van solos a los **4 segundos** o con un toque; el rojo se queda hasta que se cierra (un error no debe pasar sin leerse).
- **Un solo aviso a la vez:** uno nuevo reemplaza al anterior y reinicia el tiempo.
- **Texto legible:** 16 px, con ícono y color (no depende solo del color), `role="status"` (`alert` el rojo) y respeta "Letra grande".

## Cómo funciona
| Pieza | Dónde |
|---|---|
| Estado y reloj de los avisos | `src/lib/avisos.ts` (`avisarExito`, `avisarGuardadoSinConexion`, `avisarError`, `descartarAviso`) |
| Mensaje de éxito en el guardado | `src/lib/persistirConReversion.ts`: opción `exito` (objeto o función que devuelve `null` si no hay nada que avisar) |
| Sin conexión | `requestsStore.persistirOEncolar`: si el cambio queda en la cola avisa en azul y no en verde; al enviarse al volver la señal, `cambiosAdminStore` avisa "Cambios sincronizados" |
| Textos | `src/services/mensajesAvisos.ts` (solicitudes, catálogo, Ajustes, sincronización) |
| Pantalla | `src/components/ui/AvisoAccion.vue`, montado una vez en `App.vue` (reemplaza a `AvisoErrores.vue`) |

## Qué avisa
| Acción | Aviso |
|---|---|
| Aprobar / rechazar | "Solicitud aprobada" (verde) / "Solicitud rechazada" (gris) + cliente y servicio |
| Cancelar una confirmada (SCRUM-284) | "Reserva cancelada" (gris) + "Las fechas quedaron libres." |
| Cancelar una pendiente (abono vencido) | "Solicitud cancelada" |
| Más plazo de abono | "Plazo ampliado" + horas |
| Editar / mover fecha | "Cambios guardados" / "Fecha movida" (si solo cambió la fecha) |
| Registrar / quitar un pago | "Pago registrado" (verde) / "Pago quitado" (gris) + monto |
| Catálogo | Cabaña, espacio de camping o plato: agregado, guardado, dado de baja, activado, en mantención o disponible; acompañamiento agregado, actualizado o quitado |
| Ajustes | Contacto, transferencia, parámetros, reglas de cupos, horarios (camping, restaurante, cabañas), reglamento subido o quitado, foto del inicio guardada o restaurada |
| Sin conexión | "Guardado en este teléfono" (azul) + qué se enviará al volver la señal; después, "Cambios sincronizados" (verde, o ámbar si alguna reserva quedó en conflicto) |

No lleva aviso el cliente (al enviar su solicitud ya ve una pantalla completa de confirmación) ni cambiar el tamaño de la letra.

## Pruebas
`tests/avisos.test.ts`: reloj de 4 segundos, el rojo que no se va solo, un solo aviso, `persistirConReversion` con y sin éxito, los textos (género del catálogo, "Fecha movida"), y cada acción de solicitudes, catálogo y Ajustes, con y sin conexión.
