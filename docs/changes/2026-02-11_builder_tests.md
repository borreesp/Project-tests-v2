# 1. CONTEXTO
Se necesitaba habilitar un flujo de creación y gestión de tests de coach con builder web (sin drag&drop), agregando soporte de scoring tipado (`score_type`) y pesos de capacidades persistibles por workout para que el cálculo de capacidades del atleta use configuración explícita y no solo heurística por nombre.

Objetivo funcional:
- Mejorar `/coach/workouts` (listado + acciones).
- Crear builder simple para tests (`is_test=true`) capaz de reproducir los 5 tests base (Squat, Press EMOM, Deadlift+Farmer, Pull, Farmer+Sled).
- Persistir y validar `score_type` y `capacity_weights`.

# 2. CAMBIOS REALIZADOS
## Archivos modificados
- `backend/alembic/versions/0002_workout_score_type_and_capacity_weights.py`
- `backend/src/adapters/outbound/persistence/models/enums.py`
- `backend/src/adapters/outbound/persistence/models/models.py`
- `backend/src/adapters/outbound/persistence/models/__init__.py`
- `backend/src/application/dtos/public.py`
- `backend/src/application/dtos/coach.py`
- `backend/src/application/dtos/__init__.py`
- `backend/src/adapters/inbound/http/routers/coach.py`
- `backend/src/application/services/runtime_service.py`
- `backend/src/infrastructure/db/seed.py`
- `backend/tests/test_api_flows.py`
- `packages/types/src/enums.ts`
- `packages/types/src/dtos.ts`
- `packages/sdk/src/api.ts`
- `apps/web/app/coach/workouts/page.tsx`

## Archivos añadidos
- `apps/web/app/coach/workouts/_components/workout-builder.tsx`
- `apps/web/app/coach/workouts/new/page.tsx`
- `apps/web/app/coach/workouts/[id]/edit/page.tsx`

## Funciones añadidas
- Backend service:
  - `RuntimeService.coach_workouts`
  - `RuntimeService.duplicate_workout`
  - `RuntimeService._validate_workout_payload`
  - `RuntimeService._validate_block_order_and_structure`
  - `RuntimeService._validate_capacity_weights`
  - `RuntimeService._estimate_duration_seconds`
  - `RuntimeService._is_press_emom_exception`
  - `RuntimeService._set_workout_structure`
  - `RuntimeService._coach_workout_summary_to_dto`
- Router coach:
  - `GET /api/v1/coach/workouts`
  - `POST /api/v1/coach/workouts/{id}/duplicate`

## Funciones modificadas
- `RuntimeService.create_workout`
- `RuntimeService.update_workout`
- `RuntimeService.publish_workout`
- `RuntimeService._recalculate_capacities_and_pulse`
- `RuntimeService._capacity_weights`
- `RuntimeService._workout_summary_to_dto`
- `RuntimeService._workout_detail_to_dto`
- `RuntimeService._workout_mutation_to_dto`

## Clases / modelos añadidos o modificados
- SQLAlchemy enums:
  - Añadido `ScoreType` + `SCORE_TYPE_DB_ENUM`.
- SQLAlchemy models:
  - `WorkoutDefinitionModel`: añadida propiedad `score_type`.
  - Añadido `WorkoutCapacityWeightModel` (`workout_definition_id`, `capacity_type`, `weight`).
- Runtime dataclasses:
  - Añadido `WorkoutCapacityWeightRecord`.
  - `WorkoutDefinitionRecord`: añadidos `score_type` y `capacity_weights`.

## Cambios de contratos / DTOs
- Backend DTOs:
  - `WorkoutDefinitionSummaryDTO`: añade `scoreType`.
  - `WorkoutDefinitionDetailDTO`: añade `scoreType` y `capacityWeights`.
  - `WorkoutCreateRequestDTO` / `WorkoutUpdateRequestDTO`: añaden `scoreType` y `capacityWeights`.
  - Añadido `CoachWorkoutSummaryDTO`.
  - `WorkoutMutationResponseDTO`: añade `scoreType`.
- Typescript (`packages/types`):
  - Añadido `ScoreType` enum literal.
  - Añadidos DTOs para builder/upsert y weights (`WorkoutCapacityWeightDTO`, `WorkoutUpsertRequestDTO`, `WorkoutMutationResponseDTO`, `CoachWorkoutSummaryDTO`, etc.).
- SDK (`packages/sdk`):
  - `createApi` actualizado con métodos tipados nuevos:
    - `coachWorkouts`, `updateWorkout`, `duplicateWorkout`, `coachAthleteDetail`.
  - `createWorkout` ahora tipado con `WorkoutUpsertRequestDTO`.
  - `listMovements` soporta query opcional.

# 3. IMPACTO EN EL DOMINIO
- Atletas:
  - La validación y cálculo de capacidades tras `VALIDATED` ahora puede usar pesos por workout test configurados por coach.
- Capacidades:
  - Se prioriza `workout.capacity_weights` cuando existe.
  - Se mantiene fallback legacy por heurística de nombre para tests antiguos.
  - Se conserva decay `exp(-days/60)`, EMA `alpha=0.3` y confianza por nº intents en 60 días.
- Workouts:
  - Los tests ahora pueden declarar explícitamente `score_type`.
  - Se valida estructura de bloques/movimientos y pesos para tests.
  - Se habilita duplicado de workout completo.
- Tests:
  - Para `is_test=true`:
    - `scoreType` obligatorio.
    - `capacityWeights` obligatorios (4 capacidades, suma 1.00 +/- 0.01).
    - Reglas de bloques y ord consecutivos.
    - Duración 600s para AMRAP/EMOM/BLOCKS salvo excepción Press EMOM (20 bloques alternos 60/60).
- Ranking:
  - Sin cambio de cálculo de ranking en esta intervención.
- Persistencia:
  - Añadida columna `workout_definitions.score_type`.
  - Añadida tabla `workout_capacity_weights`.
  - Seed de movimientos ampliado para soportar plantillas del builder.

# 4. ESTADO DE USO
- ✅ EN USO
  - `score_type` en DTOs/backend list/detail/mutation.
  - `workout_capacity_weights` en runtime y cálculo de capacidades.
  - Endpoints coach nuevos:
    - `GET /api/v1/coach/workouts`
    - `POST /api/v1/coach/workouts/{id}/duplicate`
  - UI web:
    - `/coach/workouts` (filtros + acciones)
    - `/coach/workouts/new`
    - `/coach/workouts/[id]/edit`
- ⚠️ EN TRANSICIÓN
  - Persistencia full DB/repository no implementada todavía en servicio runtime (se mantiene arquitectura actual basada en runtime service en memoria para endpoints).
- ❌ DEPRECADA (pero mantenida)
  - Heurística de pesos por nombre de workout (`_capacity_weights` fallback) queda como compatibilidad legacy.
- 🗑 ELIMINADA
  - No se eliminaron endpoints ni clases en esta intervención.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro:
  - Fallback legacy de pesos por nombre cuando todos los tests usen `workout_capacity_weights` persistidos.
- Depende de legacy:
  - Sí, el runtime service in-memory sigue siendo la capa activa de negocio para endpoints actuales.
- Acoplamiento:
  - Builder web está acoplado al shape DTO actual de workout detail/upsert.
  - Validaciones de duración/estructura se duplican en backend y frontend (intencional para UX + seguridad).
- Requiere migración futura:
  - Recomendable migrar lógica de runtime a repositorios/persistencia real para que `workout_capacity_weights` se lea desde DB en producción.

# 6. CONTRATO EXTERNO AFECTADO
- API:
  - Sí, se amplían contratos de workout create/update/list/detail/mutation con `scoreType` y `capacityWeights`.
  - Se agregan endpoints coach list/duplicate.
- Respuesta frontend:
  - Sí, nuevas propiedades y nuevas rutas del builder.
- Base de datos:
  - Sí, nueva migración `0002_score_type_weights` con enum/columna/tabla.
- Seeds:
  - Sí, se añadieron movimientos requeridos por plantillas:
    - `DB Push Press`, `Pull-up strict`, `Hollow Hold`.

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal:
  - No se rompe: cambios en adapters (routers/UI), application (DTO/service) e infraestructura (migración/modelos/seed).
- Separación dominio/aplicación/infrastructure:
  - Se mantiene; no se introducen dependencias de FastAPI/SQLAlchemy en dominio.
- Invariantes de negocio:
  - Se fortalecen invariantes para tests (`scoreType`, weights, ord, estructura de bloques, duración objetivo).
