# Ayudas del encabezado ("?")

Formato único para las instrucciones de cada pantalla. Las instrucciones no van en la página: van en una ayuda que se abre con el botón "?" del encabezado. Así la pantalla queda solo con lo que se debe leer o decidir.

## Cuándo lleva ayuda
- La pantalla tiene reglas, estados o pasos que no se entienden a primera vista (por ejemplo, qué significa "Por mover" o qué pasa al enviar).
- Una pantalla autoexplicativa no lleva "?". No se agrega por rellenar.

## El botón
- Ícono `CircleHelp` (lucide), **sin borde ni fondo**: el ícono ya es un círculo y un marco lo dejaría doble.
- Área de toque de 40 px, transparente. Color `text-gray-600` en el panel admin y `text-brand-dark` en el flujo del cliente.
- Posición: en el panel admin, a la derecha del título (`AdminHeader`); en el flujo del cliente, a la izquierda de la X de salir (`ClientHeader`, prop `conAyuda`).
- `aria-label`: "Ayuda de esta sección" (admin) o "Ayuda de este paso" (cliente).

## La ventana
- Siempre `ModalAyuda` (Teleport a `body`, bloqueo de scroll, se cierra con la X, Esc o tocando afuera). Nunca una pantalla aparte ni un tooltip.
- **Título:** corto y que diga de qué trata, no "Ayuda". Ejemplos: "Estados de las solicitudes", "Marcas del calendario", "Antes de enviar".
- **Contenido:** una lista `ul` con `space-y-3 text-sm text-gray-700`.
  - Cada ítem empieza con el concepto en negrita seguido de punto (`<b class="font-bold text-brand-dark">Abono.</b>`) y sigue con texto de peso normal.
  - Cada ítem tiene 1 o 2 frases. Entre 3 y 6 ítems por ayuda.
  - Si un ejemplo visual explica mejor que el texto (la píldora de estado, la marca del calendario), se usa el componente real y no una descripción.
  - Los ítems secundarios (filtros, atajos) van al final, separados por `border-t-2 border-brand-border/40 pt-3.5`.
- **Tono:** español, tuteo, sin jerga técnica. Dice qué es y qué pasa, no repite lo que la pantalla ya muestra.
- **Valores:** los números (porcentaje de abono, horas de plazo, horarios) se leen de la configuración, nunca se escriben fijos en el texto.
- **Tipografía:** la de la app: cuerpo en peso normal y negrita solo en el concepto.

## Dónde vive el código
- **Panel admin:** componente `Ayuda<Sección>.vue` en `src/components/admin/`, registrado en `ayudasAdmin.ts` con su clave, y la ruta declara `meta.ayuda: '<clave>'`. Ya existen `solicitudes`, `calendario` y `catalogo`.
- **Flujo del cliente:** componente en `src/components/ui/` (hoy `AyudaPasoFinal.vue`) que `ReservaLayout` muestra dentro de `ModalAyuda` cuando el paso lo pide.
- El administrador no ve las ayudas del cliente (por ejemplo, la política de abono).

## Estado (SCRUM-272, 19/11)
| Pantalla | Ayuda |
|---|---|
| Admin · Solicitudes | Hecha |
| Admin · Calendario | Hecha |
| Admin · Catálogo | Hecha (SCRUM-229) |
| Admin · Ajustes | Hecha: "Qué se ajusta aquí" |
| Admin · Inicio | No lleva: es solo un resumen, sin textos que explicar |
| Cliente · último paso de cada flujo | Hecha: "Antes de enviar" |
| Cliente · camping, paso 1 | Hecha: "Modalidad y fecha" |
| Cliente · restaurante, paso 1 | Hecha: "Fecha, comidas y hora" |
| Cliente · restaurante, paso 2 | Hecha: "Elegir el menú" |
| Cliente · piscina, paso 1 | Hecha: "Cuándo reservar la piscina" |
| Cliente · cabaña pasos 1 a 3, camping pasos 2 y 3, restaurante paso 3, piscina paso 2 | No llevan: son autoexplicativos. Se retiraron los avisos que repetían lo que la pantalla ya dice ("Selecciona las fechas…", "Tus datos de contacto") |
| Cliente · inicio y Contacto | No llevan |
| Nueva reserva del admin | No lleva ayuda propia: la franja "modo administrador" ya lo explica y el admin no ve las ayudas del cliente |

Las ayudas del cliente se registran en `src/components/ui/ayudasCliente.ts` (clave `<servicio>-<paso>`); el último paso de cada flujo usa siempre "Antes de enviar".
