# 1. CONTEXTO

Se requería persistir y exponer por API el impacto de capacidades de forma auditable, no solo como peso total del workout. El objetivo es guardar el total por capacidad y su desglose por movimiento/bloque para habilitar comparativas, debugging y feedback accionable.

# 2. CAMBIOS REALIZADOS

- **Archivos modificados**
  - `backend/src/application/dtos/athlete.py`
  - `backend/src/application/services/runtime_service.py`
  - `backend/tests/test_api_flows.py`

- **Funciones añadidas**
  - `RuntimeService._build_impact_breakdown(workout)`
  - `RuntimeService._capacity_impact_payload(impact)`

- **Funciones eliminadas**
  - Ninguna.

- **Funciones modificadas**
  - `RuntimeService.submit_attempt_result(...)`: ahora persiste `derived_metrics_json.impactBreakdown` con `total`, `byMovement` y `byBlock`.
  - `RuntimeService._attempt_to_dto(...)`: ahora rehidrata `impactBreakdown` desde `derived_metrics_json` hacia el DTO de respuesta.

- **Clases sustituidas**
  - Ninguna.

- **Propiedades eliminadas o añadidas**
  - Añadida propiedad `impactBreakdown` en `AttemptDTO`.
  - Añadidos DTOs de contrato:
    - `CapacityImpactDTO`
    - `CapacityImpactMovementSplitDTO`
    - `CapacityImpactBlockSplitDTO`
    - `CapacityImpactBreakdownDTO`

- **Cambios en contratos o DTOs**
  - Extensión no rupturista del contrato de respuesta de intentos (`AttemptDTO`) con campo opcional `impactBreakdown`.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**
  - Al enviar resultado y al validarse intento, ahora reciben también desglose de impacto por capacidad para ese intento.
- **Capacidades**
  - Se mantiene el cálculo de capacidad global; adicionalmente queda trazabilidad persistida del reparto por movimiento/bloque.
- **Workouts**
  - Se usa su estructura (bloques + movimientos) para construir el split auditable.
- **Tests**
  - Se amplía test de flujo API para verificar persistencia y respuesta de `impactBreakdown`.
- **Ranking**
  - Sin cambios en cálculo/ranking.
- **Persistencia**
  - Sin migración DB: se aprovecha `workout_results.derived_metrics_json` para almacenar el breakdown.

# 4. ESTADO DE USO

- `RuntimeService.submit_attempt_result`
  - ✅ **EN USO** en endpoint `POST /api/v1/athlete/attempts/{attempt_id}/submit-result`.
- `RuntimeService._attempt_to_dto`
  - ✅ **EN USO** en respuestas de submit, validación y rechazo de intentos.
- `RuntimeService._build_impact_breakdown`
  - ✅ **EN USO** desde `submit_attempt_result` para persistir desglose auditable.
- `RuntimeService._capacity_impact_payload`
  - ✅ **EN USO** desde `_build_impact_breakdown` para serialización estable del contrato.
- DTOs de impacto (`CapacityImpact*`)
  - ✅ **EN USO** en `AttemptDTO.impactBreakdown` (respuesta API).

# 5. RIESGO DE REFRACTOR FUTURO

- Acoplado a la estructura interna del workout (bloques/movimientos) y al transformador de impacto; si cambia el modelo de bloques, requiere ajuste.
- Puede requerir migración futura a tablas normalizadas si se necesita querying SQL analítico sobre split por movimiento/bloque.
- Dependencia moderada de formato JSON versionado (`derived_metrics_json.impactBreakdown`) para mantener retrocompatibilidad.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: Sí, se amplía respuesta de intentos con `impactBreakdown` (aditivo, no rupturista).
- **Respuesta frontend**: Sí, nuevo campo disponible para consumo.
- **Base de datos**: Sí, se persiste nueva estructura dentro de columna JSON existente (`derived_metrics_json`), sin cambio de esquema.
- **Seeds**: No.

# 7. CHECK DE COHERENCIA

- Se mantiene arquitectura hexagonal: lógica en `application/services`, DTOs en capa de aplicación.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio existentes (estado de intentos, validación, cálculo de score/ranking).
