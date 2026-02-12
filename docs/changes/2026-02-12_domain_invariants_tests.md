# 1. CONTEXTO

Se requiere cubrir invariantes críticas del dominio para evitar regresiones en reglas sensibles de producto (capacidades y ranking) sin depender de DB ni IO externo. El objetivo de esta intervención es añadir tests unitarios rápidos para validar reglas de `is_test`, ranking por intentos validados, pesos de capacidades y obligatoriedad de `ScoreType` en workouts tipo test.

# 2. CAMBIOS REALIZADOS

- **Archivos modificados**
  - `backend/src/application/services/runtime_service.py`
- **Archivos añadidos**
  - `backend/tests/test_domain_invariants.py`
- **Funciones añadidas**
  - `_build_workout_payload` (helper de test)
  - `_seed_attempt` (helper de test)
  - `test_only_is_test_workouts_alter_capacities`
  - `test_non_validated_attempts_do_not_affect_ranking`
  - `test_capacity_weights_sum_must_be_one`
  - `test_score_type_is_required_for_test_workouts`
- **Funciones modificadas**
  - `_recalculate_capacities_and_pulse`: ahora ignora intentos validados cuyo workout no tenga `is_test=True`.
- **Funciones eliminadas**
  - Ninguna.
- **Clases sustituidas**
  - Ninguna.
- **Propiedades eliminadas o añadidas**
  - Ninguna.
- **Cambios en contratos o DTOs**
  - Ninguno.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**
  - Las capacidades del atleta no se alteran por workouts no marcados como test.
- **Capacidades**
  - Se refuerza la invariante: solo resultados validados de workouts `is_test=True` participan en recálculo.
- **Workouts**
  - Se mantiene la exigencia de `ScoreType` en test workouts (validada por test automatizado).
- **Tests**
  - Se añade una suite unitaria enfocada en invariantes de dominio y comportamiento crítico.
- **Ranking**
  - Se valida que attempts no validados no entran en leaderboard.
- **Persistencia**
  - Sin impacto: cambios en memoria/runtime y tests sin DB.

# 4. ESTADO DE USO

- `RuntimeService._recalculate_capacities_and_pulse`
  - ✅ **EN USO** en flujo de validación/rechazo de attempts para recalcular capacidades/pulse.
- `test_only_is_test_workouts_alter_capacities`
  - ✅ **EN USO** en suite de QA de invariantes.
- `test_non_validated_attempts_do_not_affect_ranking`
  - ✅ **EN USO** en suite de QA de invariantes.
- `test_capacity_weights_sum_must_be_one`
  - ✅ **EN USO** en suite de QA de invariantes.
- `test_score_type_is_required_for_test_workouts`
  - ✅ **EN USO** en suite de QA de invariantes.
- Código deprecado/eliminado
  - No aplica en esta intervención.

# 5. RIESGO DE REFRACTOR FUTURO

- El filtro `is_test=True` en el recálculo de capacidades puede requerir ajuste si en el futuro se define una nueva categoría de workouts que también deba impactar capacidades.
- Los tests están acoplados al `RuntimeService` in-memory actual; si se desacopla la lógica a servicios de dominio puros, convendrá migrarlos para reducir dependencia de helpers internos.
- No depende de legacy externo, pero sí del contrato interno de enums/DTOs del backend.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: No cambia.
- **Respuesta frontend**: No cambia.
- **Base de datos**: No cambia.
- **Seeds**: No cambia.

# 7. CHECK DE COHERENCIA

- ✅ No se rompe arquitectura hexagonal.
- ✅ No se rompe separación dominio/aplicación/infrastructure.
- ✅ No se alteran invariantes de negocio; se refuerzan con tests y con el filtro explícito de `is_test` en capacidades.
