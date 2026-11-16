# Plan de la base de datos (Supabase)

Creado: 2026-11-16 · Congelar funcionalidades: **24/11** · Entrega final: **viernes 27/11**
Cubre SCRUM-248 (Supabase) y SCRUM-250 (modo sin conexión). La capa de repositorios (SCRUM-246) y el esquema (SCRUM-245, `docs/supabase-esquema.md`) ya están hechos.

Quién hace cada cosa: **Tú** = en el panel de Supabase o decisiones tuyas. **Claude** = código, SQL y pruebas.

## Fase A — Preparación sin Supabase (16 y 17/11)

| # | Tarea | Quién | Por qué |
|---|---|---|---|
| A1 | `.env` fuera de git y `.env.example` | Claude | Hecho en `chore/sacar-env-de-git` |
| A2 | Cambiar el contrato de crear solicitud: el cliente genera el id y el repositorio devuelve `{ id, código }`, como lo hará `crear_solicitud`. El código `SOL-` lo asigna el repositorio, no el store | Claude | Sin esto, el modo sin conexión obliga a rehacer la función SQL. Reenviar una solicitud no debe duplicarla |
| A3 | Cargar la lista completa de solicitudes solo con sesión de administrador; el cliente solo pide disponibilidad | Claude | Con RLS el público no puede leer `reservas` |
| A4 | Refrescar datos entre dispositivos: pedir por mes (`listByRange`) y al volver a la app | Claude | Hoy los stores cargan una sola vez |
| A5 | Columna para evento especial en el esquema (SCRUM-261) | Claude + Tú | Si no, `isSpecialEvent` se pierde al guardar |
| A6 | Suite de pruebas común para los repositorios (local y Supabase) | Claude | Comprobar que ambos se comportan igual |
| A7 | Decidir: ¿dónde se aloja la app? (Vercel, Netlify, GitHub Pages u otro) | Tú | Hace falta HTTPS para instalar la PWA y probar sin conexión; Supabase pide la URL final |
| A8 | Decidir: ¿las imágenes van a Supabase Storage? (recomendado: sí) | Tú | Cambia las políticas de acceso |

## Fase B — Supabase (desde el 17/11, cuando exista el proyecto)

| # | Tarea | Quién |
|---|---|---|
| B1 ✅ | Crear y configurar el proyecto (ver guía en la conversación y abajo) | Tú |
| B2 ✅ | Poner URL y clave pública en `.env` (nunca la clave secreta) | Tú |
| B3 ✅ | Migraciones SQL en `supabase/migrations/`: enums, tablas de catálogo, `reservas` y sus hijas, pagos, ajustes, perfiles de administrador, secuencias de códigos | Claude |
| B4 ✅ | RLS: público solo lee catálogo y ajustes públicos; administrador todo; nadie lee `reservas` directo | Claude |
| B5 ✅ | Funciones `fechas_ocupadas` y `crear_solicitud` (recalcula precio y abono en el servidor, idempotente) | Claude |
| B6 ✅ | Restricción de exclusión (dos cabañas confirmadas cruzadas) y trigger de aforo para restaurante y camping | Claude |
| B7 ✅ | Semillas: catálogo, ajustes y piscina cargados en la base | Claude |
| B8 ✅ | Aplicar las migraciones al proyecto (con el conector de Supabase o pegando el SQL en el editor) | Claude o Tú |
| B9 ◐ | Autenticación (Supabase Auth ya conectado; falta crear al segundo dueño y poder crear administradores desde la app): crear a los dos dueños, sacar contraseñas del código y el registro de `authStore`, sesión con Supabase Auth | Tú (crear usuarios) + Claude (código) |
| B10 | Imágenes en Storage (bucket, políticas, subida desde el admin) | Claude |
| B11 ✅ | Repositorios de Supabase registrados en `src/lib/repositories/index.ts`; validar variables de entorno | Claude |
| B12 | Prueba de punta a punta: cliente en un celular, administrador en otro dispositivo | Tú + Claude |

## Fase C — Modo sin conexión (SCRUM-250, 20 al 24/11)
- C1: caché local (IndexedDB) del catálogo y de las solicitudes del administrador.
- C2: cola de envío del cliente con id propio; sincroniza al reconectar.
- C3: pantalla de "pendientes de envío".
- C4: administrador sin conexión y estado "En conflicto, por resolver" cuando la base rechaza una confirmación cruzada.
- Hay que reducir alcance si no alcanza: el cliente primero, el administrador después.

## Fase D — Cierre (24 al 27/11)
- D1: hosting con HTTPS y variables de entorno de producción; URL del sitio configurada en Supabase Auth.
- D2: contraseñas de fábrica cambiadas (están en el historial de git).
- D3: prueba completa en iPhone (barras fijas SCRUM-259, ayudas, modales).
- D4: actualizar `docs/plan-entrega.md` y `docs/reglas-negocio.md`.
- **24/11 se congelan funcionalidades; el 25 y 26 solo corrección de errores.**

## Riesgos
- **El plan gratuito de Supabase pausa el proyecto tras 7 días sin uso.** Para la entrega real conviene hablar con el cliente de un plan de pago.
- **Sin conexión es lo más grande.** Si se atrasa, la entrega es "con internet" y sin conexión queda como segunda etapa.
- **Los dueños comparten el sistema:** cualquier error de RLS expone datos personales de clientes. Probar con la clave pública que el público no puede leer `reservas` antes de publicar.
- **Respuestas del cliente pendientes (SCRUM-270)** pueden cambiar columnas. Tratar de dejarlas como parámetros editables.
