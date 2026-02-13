# 1. CONTEXTO

El cálculo previo de `impactBreakdown` normalizaba impactos por movimiento individual, lo que causaba que el volumen (reps/meters/seconds/calories) no se reflejara en los splits. Cada movimiento pesaba igual dentro de su bloque, independientemente de su volumen real. Esto hacía que el desglose no fuera realmente auditable ni atributivo por movimiento/bloque.

El objetivo de este cambio es corregir la lógica para calcular contribuciones raw (pattern_weight × movement_volume) y normalizar al final, permitiendo que el desglose refleje correctamente la proporción de impacto basada en el volumen de cada movimiento.

# 2. CAMBIOS REALIZADOS

- **Archivos modificados**
  - `backend/src/application/services/movement_impact_transformer.py`
  - `backend/src/application/services/runtime_service.py`

- **Funciones añadidas**
  - `compute_raw_movement_impact(movement)`: calcula el impacto raw (no normalizado) de un movimiento individual como pattern_weight × movement_volume por cada capacidad.
  - `normalize_capacity_impact(raw_impact)`: normaliza un diccionario de impactos raw para que sume 1.0.

- **Funciones eliminadas**
  - Ninguna.

- **Funciones modificadas**
  - `RuntimeService._build_impact_breakdown(workout)`: ahora calcula impactos raw por movimiento, los agrega por bloque, y normaliza ambos (`byMovement` y `byBlock`) al final. Esto asegura que el volumen de cada movimiento se refleje correctamente en el desglose.

- **Clases sustituidas**
  - Ninguna.

- **Propiedades eliminadas o añadidas**
  - Ninguna.

- **Cambios en contratos o DTOs**
  - Ninguno. El contrato externo (`AttemptDTO.impactBreakdown`) permanece sin cambios; solo cambia la lógica interna de cálculo.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**
  - Reciben un desglose más preciso del impacto por capacidad, reflejando correctamente el volumen de trabajo de cada movimiento.
- **Capacidades**
  - El cálculo de capacidades global no cambia; solo mejora la trazabilidad del desglose persistido.
- **Workouts**
  - El desglose por movimiento/bloque ahora refleja correctamente la contribución ponderada por volumen.
- **Tests**
  - El test existente `test_create_workout_create_attempt_submit_validate_dashboard` continúa pasando, validando la persistencia y respuesta de `impactBreakdown`.
- **Ranking**
  - Sin cambios.
- **Persistencia**
  - Sin cambios en esquema; solo mejora la calidad de los datos persistidos en `derived_metrics_json.impactBreakdown`.

# 4. ESTADO DE USO

- `compute_raw_movement_impact`
  - ✅ **EN USO** desde `RuntimeService._build_impact_breakdown`.
- `normalize_capacity_impact`
  - ✅ **EN USO** desde `RuntimeService._build_impact_breakdown` para normalizar impactos por movimiento y por bloque.
- `RuntimeService._build_impact_breakdown`
  - ✅ **EN USO** desde `submit_attempt_result` (sin cambios en punto de llamada).

# 5. RIESGO DE REFRACTOR FUTURO

- Bajo riesgo: la lógica de cálculo ahora refleja correctamente el volumen, lo que mejora la precisión sin introducir deuda técnica.
- Si el modelo de volumen (_movement_volume) cambia, estos helpers necesitarán ajustarse, pero eso ya era el caso antes.
- No introduce nuevas dependencias ni acoplamientos.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: No, el contrato de respuesta (`AttemptDTO.impactBreakdown`) permanece sin cambios. Solo mejora la calidad de los datos devueltos.
- **Respuesta frontend**: No rupturista; el frontend recibirá datos más precisos sin cambios de estructura.
- **Base de datos**: No, solo mejora la calidad de los datos persistidos en el JSON existente.
- **Seeds**: No.

# 7. CHECK DE COHERENCIA

- Se mantiene arquitectura hexagonal: helpers en `movement_impact_transformer`, lógica de aplicación en `RuntimeService`.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio (estado de intentos, validación, cálculo de score/ranking).
- El cambio es quirúrgico y localizado: solo corrige el cálculo interno del desglose.
