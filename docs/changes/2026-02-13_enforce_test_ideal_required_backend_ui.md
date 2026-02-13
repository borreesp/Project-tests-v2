1. CONTEXTO

Se detectó que era posible publicar tests (`isTest=true`) sin un ideal score configurado, lo que degrada la confiabilidad de la estimación en pruebas variables (AMRAP/intervals). El objetivo fue forzar el requisito de ideal obligatorio antes de publicar, con validación consistente en backend y feedback preventivo en UI.

2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `backend/src/application/services/runtime_service.py`
  - `apps/web/app/coach/workouts/_components/workout-builder.tsx`
  - `backend/tests/test_api_flows.py`
  - `backend/tests/integration/test_api_smoke_flow.py`

- Funciones añadidas:
  - `RuntimeService._assert_test_workout_has_required_ideal(workout, gym_id)`
  - `backend/tests/test_api_flows.py::_set_gym_ideal_score(...)`
  - `backend/tests/integration/test_api_smoke_flow.py::_set_gym_ideal_score(...)`
  - `backend/tests/test_api_flows.py::test_publish_test_workout_requires_ideal_score(...)`

- Funciones eliminadas:
  - Ninguna.

- Funciones modificadas:
  - `RuntimeService.publish_workout(...)`: ahora valida ideal requerido antes de publicar.
  - `WorkoutBuilder.save(...)`: ahora bloquea publicación desde UI si no hay ideal válido según scope.

- Clases sustituidas:
  - Ninguna.

- Propiedades eliminadas o añadidas:
  - Ninguna propiedad de modelo persistente modificada.

- Cambios en contratos o DTOs:
  - No se alteraron DTOs, schemas ni mappers.
  - Se agregan mensajes de validación para publicación sin ideal.

3. IMPACTO EN EL DOMINIO

- Atletas:
  - Solo verán tests publicados que cumplen prerequisito de ideal, mejorando consistencia de métricas.
- Capacidades:
  - Las capacidades derivadas de tests publicados se apoyan en un baseline obligatorio para estimación.
- Workouts:
  - Publicación de test queda condicionada a ideal (community en scope community, gym/community en scope gym).
- Tests:
  - Se refuerza la invariante funcional: `is_test=true` requiere ideal antes de publicar.
- Ranking:
  - Ranking y cálculos relacionados reducen riesgo de distorsión por ausencia de ideal.
- Persistencia:
  - No hay cambios de esquema ni migraciones; se reutiliza `ideal_profiles` existente para validar.

4. ESTADO DE USO

- `RuntimeService.publish_workout(...)`
  - ✅ EN USO (endpoint `POST /api/v1/coach/workouts/{id}/publish`).
- `RuntimeService._assert_test_workout_has_required_ideal(...)`
  - ✅ EN USO (invocada por `publish_workout`).
- `WorkoutBuilder.save(...)`
  - ✅ EN USO (flujo de guardado/publicación del builder de coach web).
- Helpers de test `_set_gym_ideal_score(...)`
  - ✅ EN USO (tests API e integración para preparar precondición de publicación).
- `test_publish_test_workout_requires_ideal_score(...)`
  - ✅ EN USO (suite backend `test_api_flows`).

5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse en el futuro:
  - El helper de tests `_set_gym_ideal_score` podría consolidarse en fixtures comunes.
- Depende de legacy:
  - La lógica depende del estado in-memory de `ideal_profiles` del runtime service actual.
- Acoplamiento a otra capa:
  - Validación de negocio permanece en aplicación/backend, UI solo aplica guardrails de UX.
- Requiere migración futura:
  - No requiere migración de DB actualmente.

6. CONTRATO EXTERNO AFECTADO

- API:
  - Sí. Publicar test sin ideal ahora devuelve error de validación (422) con mensaje explícito.
- Respuesta frontend:
  - Sí. Builder muestra error preventivo en cliente antes de intentar publicar.
- Base de datos:
  - No.
- Seeds:
  - No.

7. CHECK DE COHERENCIA

- Arquitectura hexagonal:
  - Confirmado: la regla de negocio crítica se valida en backend (capa de aplicación), no en infraestructura.
- Separación dominio/aplicación/infrastructure:
  - Confirmado: UI agrega validación de UX, pero la invariante se protege en backend.
- Invariantes de negocio:
  - Confirmado: se refuerza la invariante de publicación de tests con ideal obligatorio.
