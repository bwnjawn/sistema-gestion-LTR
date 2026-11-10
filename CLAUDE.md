# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Iniciar desarrollo: `npm run dev`
- Construir (build): `npm run build`
- Vista previa: `npm run preview`

# Convenciones de Desarrollo
- Idioma: Todos los textos de la interfaz (UI), nombres de dominio y comentarios deben estar en español.
- Diseño: Usa Tailwind v3. Mantén alta legibilidad usando los colores tierra/verde del proyecto y la fuente Atkinson Hyperlegible.
- Lógica de Negocio: Mantén las vistas (`.vue`) ligeras. Toda la lógica de negocio (disponibilidad, precios) debe ir en `src/services/`.
- Estado de Wizard: El estado de los formularios paso a paso vive en `stores/reservationStore.ts` y debe persistirse en `sessionStorage` (`ltr_wizard_draft`).

# Documentación de Trabajo
- Reglas de negocio (abono, capacidades, horarios, límites): `docs/reglas-negocio.md`. Consúltalo antes de tocar `src/services/` y actualízalo si una regla cambia.
- Specs por historia en `docs/specs/` (índice en `docs/specs/README.md`). Si la historia de Jira tiene spec, léelo antes de implementar y corrígelo si una decisión cambia.
- Plan y fechas de entrega: `docs/plan-entrega.md`.

# Reglas de Arquitectura y Base de Datos (Supabase)
- Backend: El proyecto usa Supabase, pero actualmente las tiendas usan `Local*Repository` y `localStorage`.
- Regla Estricta: Las vistas y componentes nunca deben hacer llamadas directas a Supabase o localStorage. Siempre deben llamar a los métodos del Store de Pinia.
- El Store de Pinia debe interactuar con las interfaces del patrón Repositorio (`src/lib/repositories/`).
# Flujo de Trabajo con Ramas y Pull Requests
El usuario es novato con este flujo: Claude debe proponerlo y recordarlo solo, sin que se lo pidan.

- `main` es siempre estable. Nunca se hace commit ni push directo a `main`.
- **Una rama por tarea de Jira**, creada desde `main` actualizado (`git checkout main && git pull`). Nombre: `tipo/SCRUM-N-descripcion-corta` (`feat/`, `fix/`, `chore/`, `docs/`). Una tarea, una rama, un PR pequeño.
- **Antes de empezar una tarea**: revisar `git status` y la rama actual. Si se está en `main` o en la rama de otra tarea, proponer crear la rama nueva. No mezclar tareas distintas en una rama.
- Ramas que dependen de otra sin integrar: solo en ese caso se crean desde la otra rama, avisando al usuario y abriendo el PR contra esa rama. Lo normal es esperar a que la primera entre a `main`, o integrarla antes si ya está lista.
- Mientras una rama vive, traer los cambios de `main` (`git merge main`, o `rebase` si el usuario lo aprueba) antes de abrir el PR.
- Al terminar: `git push -u origin <rama>`, abrir PR hacia `main` (la CI de `.github/workflows/ci.yml` debe quedar en verde), integrar con **squash and merge** y borrar la rama.
- Plantilla del PR: Qué cambia · Cómo probarlo · Tarea de Jira (SCRUM-N).
- Commits en español: `tipo(área): descripción (SCRUM-N)`.
- Estados de Jira: "En curso" al abrir la rama, "En revisión" al abrir el PR, "Terminada" al integrar.
- Claude sigue sin hacer commit, push, PR ni cambios de estado en Jira por iniciativa propia: lo propone y espera la orden del usuario. Si el usuario olvida crear la rama o abrir el PR, Claude se lo recuerda.
- Si hay código experimental o temporal (paneles de depuración, etc.), avisarlo en el PR o retirarlo antes de integrar.
