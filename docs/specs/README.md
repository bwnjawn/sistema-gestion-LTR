# Specs por historia

Un spec describe **cómo** se construye una historia. Jira sigue siendo la fuente del **estado** y de los criterios oficiales; no se duplica el avance aquí.

## Cuándo se crea un spec
- Sí: historias con lógica de negocio, decisiones de diseño o varias capas (servicio, store, repositorio, vista).
- No: cambios simples de texto o de interfaz (por ejemplo SCRUM-58, 231, 233 y 234). Alcanza con el criterio de Jira.

## Índice

| Spec | Historia | Fase |
|---|---|---|
| [SCRUM-59](SCRUM-59.md) | Resumen de solicitud para el admin: contactar, aprobar, modificar y rechazar | Prototipo |
| [SCRUM-60](SCRUM-60.md) | Detectar solapamientos de reservas | Fase 2 |
| [SCRUM-56](SCRUM-56.md) | El admin registra una reserva con el flujo del cliente (hecha; decisiones corregidas el 10/11) | Hecha |
| [SCRUM-262](SCRUM-262.md) | Resolver cruces al confirmar y avisar al cliente por llamada, correo o WhatsApp | Fase 2 (adelantable) |
| [SCRUM-229](SCRUM-229.md) | CRUD de acompañamientos (sin, fijo o elegible) | Fase 2 |
| [SCRUM-27](SCRUM-27.md) | Spike: varias cabañas por solicitud | Aplazada (Sprint 3) |

Documentos relacionados: [`../reglas-negocio.md`](../reglas-negocio.md) y [`../plan-entrega.md`](../plan-entrega.md).

## Plantilla

```markdown
# SCRUM-N — Título

Estado: borrador | listo para implementar | en curso | hecho
Fase: prototipo | fase 2 | fase 3

## Contexto
Para qué existe y qué depende de ella.

## Criterios de aceptación (copiados de Jira)

## Situación actual en el código
Qué ya existe y qué falta, con archivos concretos.

## Decisiones
Qué se decidió y por qué.

## Cambios por capa
- Servicio (`src/services/`)
- Store y repositorio (`src/stores/`, `src/lib/repositories/`)
- Vista o componente

## Casos borde

## Preguntas abiertas

## Verificación manual
- [ ] ...
```

## Flujo de trabajo
1. Antes de implementar una historia que tiene spec, leerlo y ponerlo en "en curso".
2. Si una decisión cambia durante el trabajo, se corrige el spec y no solo el código.
3. Al terminar: marcar "hecho", completar la verificación manual y dejar un comentario en Jira con el enlace al spec.
4. Las reglas de negocio nuevas se agregan a `docs/reglas-negocio.md`.
