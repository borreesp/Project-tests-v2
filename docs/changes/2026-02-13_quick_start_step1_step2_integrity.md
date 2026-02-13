# 1. CONTEXTO

Quick Start del builder debía garantizar que una plantilla poblara correctamente el estado de Step 1 y Step 2 sin perder coherencia al navegar entre pasos. Había lógica distribuida por condiciones, con riesgo de inconsistencias entre metadatos del test y movimientos usados por bloque.

# 2. CAMBIOS REALIZADOS

- **Archivos modificados**:
  - `apps/web/app/coach/workouts/_components/workout-builder.tsx`
  - `apps/web/app/coach/workouts/_components/workout-template.ts` (nuevo)
  - `apps/web/tests/workout-template.test.ts` (nuevo)
- **Funciones añadidas**:
  - `resolveTemplateMovements` en `workout-template.ts`.
- **Funciones eliminadas**:
  - `generateEmom10` (reemplazada por definición declarativa de bloques en plantilla).
- **Funciones modificadas**:
  - `applyTemplate` ahora consume mapping `QUICK_START_TEMPLATE_STATE` para construir estado completo de Step 1 + Step 2.
- **Clases sustituidas**:
  - No aplica.
- **Propiedades eliminadas o añadidas**:
  - No se añadieron/eliminaron propiedades de modelos persistentes.
- **Cambios en contratos o DTOs**:
  - No hay cambios en contratos externos; sólo tipado interno frontend para resolver movimientos por `id` y `name`.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: sin impacto directo.
- **Capacidades**: se conserva la asignación de pesos por plantilla con mayor consistencia de inicialización.
- **Workouts**: Quick Start ahora genera estructura más determinista para bloques y movimientos.
- **Tests**: se agregan pruebas unitarias de mapeo para validar integridad de plantillas.
- **Ranking**: sin impacto directo.
- **Persistencia**: sin cambios en DB; se mantiene envío de `movementId` válido en payload.

# 4. ESTADO DE USO

- `applyTemplate` (workout-builder): ✅ **EN USO** en flujo de selección de plantilla Quick Start.
- `resolveTemplateMovements` (workout-template): ✅ **EN USO** desde `applyTemplate` para validar catálogo y construir referencias.
- `generateEmom10`: 🗑 **ELIMINADA**, sustituida por bloques declarativos en `QUICK_START_TEMPLATE_STATE.PRESS_EMOM`.
- `QUICK_START_TEMPLATE_STATE`: ✅ **EN USO** como fuente única de verdad del mapping plantilla → estado builder.

# 5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse lógica condicional restante en builder si se extiende el enfoque declarativo al resto de presets.
- El mapping depende de nombres de catálogo (`name`) para resolver `movement_id`; si cambia naming de seed/catálogo, requiere ajuste de plantillas.
- Está acoplado a capa frontend (builder UI), sin acoplar dominio backend.
- No requiere migración de datos; sólo validación continua de catálogo.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia.
- **Respuesta frontend**: no cambia contrato externo.
- **Base de datos**: no cambia esquema ni persistencia.
- **Seeds**: no se modifican.

# 7. CHECK DE COHERENCIA

- Se mantiene arquitectura hexagonal (cambio localizado a frontend de presentación).
- No se rompe separación dominio/aplicación/infrastructure en backend.
- No se alteran invariantes de negocio; sólo se robustece armado de estado previo al guardado.
