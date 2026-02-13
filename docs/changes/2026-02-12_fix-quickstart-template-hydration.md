# 2026-02-12 Fix quickstart template hydration

## 1. CONTEXTO
En el builder de tests de `apps/web`, la selección de plantilla Quick start estaba implementada con múltiples `setState` secuenciales y ramas por plantilla. Eso permitía estados intermedios durante la hidratación (Paso 1) y provocaba desincronización visual/funcional en Paso 2 (librería de movimientos), incluyendo riesgo de residuos al cambiar de plantilla varias veces.

## 2. CAMBIOS REALIZADOS
- **Archivos modificados**
  - `apps/web/app/coach/workouts/_components/workout-builder.tsx`
- **Funciones añadidas**
  - `movementEntryFromTemplate(...)`
  - `buildEmomTemplateBlocks(...)`
  - `applyTemplateToBuilder(...)`
- **Funciones eliminadas**
  - `generateEmom10(...)`
  - `applyTemplate(...)`
- **Funciones modificadas**
  - `addMovementToSelectedBlock(...)`: ahora evita duplicar `movementId` dentro del bloque WORK seleccionado.
- **Clases sustituidas**
  - No aplica.
- **Propiedades eliminadas o añadidas**
  - Añadido `QuickStartTemplate` (type alias).
  - Añadido `QuickStartHydration` (type estructural para hidratar estado del builder).
  - Añadido estado derivado `selectedMovementIds` para reflejar selección real de movimientos en la librería.
- **Cambios en contratos o DTOs**
  - No hubo cambios en DTOs/backend/API. Solo estado y comportamiento UI en frontend.

## 3. IMPACTO EN EL DOMINIO
- **Atletas**
  - Sin impacto directo.
- **Capacidades**
  - Se preserva la asignación de `capacityWeights` por plantilla y se aplica de forma consistente en una sola hidratación lógica.
- **Workouts**
  - Quick start ahora aplica política de **replace total** del estado del builder para evitar mezcla entre plantillas.
- **Tests**
  - Se reduce probabilidad de validaciones falsas (ej. WORK sin movimientos) por estados intermedios.
- **Ranking**
  - Sin impacto directo.
- **Persistencia**
  - Sin cambios de persistencia ni migraciones.

## 4. ESTADO DE USO
- `applyTemplateToBuilder(...)`
  - ✅ **EN USO** en selector de plantilla (Paso 1) y botones de quick actions laterales.
- `movementEntryFromTemplate(...)`
  - ✅ **EN USO** como constructor uniforme de movimientos para todas las plantillas.
- `buildEmomTemplateBlocks(...)`
  - ✅ **EN USO** para plantilla `PRESS_EMOM`.
- `addMovementToSelectedBlock(...)`
  - ✅ **EN USO** en la librería de movimientos de Paso 2, ahora con guard anti-duplicado.
- `generateEmom10(...)`
  - 🗑 **ELIMINADA**, reemplazada por `buildEmomTemplateBlocks(...)` + `applyTemplateToBuilder(...)`.
- `applyTemplate(...)`
  - 🗑 **ELIMINADA**, reemplazada por `applyTemplateToBuilder(...)`.

## 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse/reducirse lógica condicional por plantilla si se migra a un catálogo declarativo único (JSON/config) con mapeador.
- Existe acoplamiento moderado entre datos de plantilla y nombres de movimientos (`movementByName`), por lo que cambios de naming en catálogo pueden requerir ajuste.
- La selección visual en librería deriva de `blocks`; es correcta para consistencia, pero requiere mantener este origen único de verdad.

## 6. CONTRATO EXTERNO AFECTADO
- **API**: No cambia.
- **Respuesta frontend**: Sí, mejora visual/UX en selección de movimientos (badge/estado seleccionado y deshabilitado cuando ya está en builder).
- **Base de datos**: No cambia.
- **Seeds**: No cambian.

## 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: ✅ no se altera.
- Separación dominio/aplicación/infrastructure: ✅ no se rompe (cambio solo en UI frontend).
- Invariantes de negocio: ✅ se mantienen y se refuerza consistencia para evitar estados inválidos transitorios en builder.
