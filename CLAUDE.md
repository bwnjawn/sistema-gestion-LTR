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

# Reglas de Arquitectura y Base de Datos (Supabase)
- Backend: El proyecto usa Supabase, pero actualmente las tiendas usan `Local*Repository` y `localStorage`.
- Regla Estricta: Las vistas y componentes nunca deben hacer llamadas directas a Supabase o localStorage. Siempre deben llamar a los métodos del Store de Pinia.
- El Store de Pinia debe interactuar con las interfaces del patrón Repositorio (`src/lib/repositories/`).