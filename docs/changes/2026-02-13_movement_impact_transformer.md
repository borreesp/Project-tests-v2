1. CONTEXTO

Se necesitaba transformar el impacto por movimiento hacia capacidades internas con normalización total (sum=1.0), para mejorar la precisión del cálculo de capacidades cuando un workout no define `capacityWeights` explícitos.

2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `backend/src/application/services/runtime_service.py`
- Archivos añadidos:
  - `backend/src/application/services/movement_impact_transformer.py`
  - `backend/tests/unit/test_movement_impact_transformer.py`
- Funciones añadidas:
  - `transform_movements_to_capacity_impact`
  - `_movement_volume`
- Funciones modificadas:
  - `_capacity_weights` (ahora utiliza el transformador por movimiento cuando no hay pesos explícitos)
- Funciones eliminadas: ninguna.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o añadidas: ninguna en modelos persistidos.
- Cambios en contratos o DTOs: se añade `MovementImpactInput` como estructura interna de servicio (sin exponer API externa).

3. IMPACTO EN EL DOMINIO

- Atletas:
  - Mejora la estimación de capacidades cuando los tests no traen pesos manuales, al basarse en movimientos reales.
- Capacidades:
  - El vector de impacto queda normalizado a 1.0 y no negativo.
- Workouts:
  - Para workouts sin `capacityWeights`, el cálculo usa bloques/movimientos en lugar de heurística por nombre.
- Tests:
  - Se incorporan unit tests específicos para normalización, no negatividad y lista vacía.
- Ranking:
  - Impacto indirecto: al mejorar capacidades base, puede cambiar la señal usada por métricas derivadas.
- Persistencia:
  - Sin cambios de esquema ni migraciones.

4. ESTADO DE USO

- `transform_movements_to_capacity_impact`
  - ✅ EN USO en `RuntimeService._capacity_weights` para workouts sin pesos explícitos.
- `_movement_volume`
  - ✅ EN USO por `transform_movements_to_capacity_impact`.
- Heurística legacy por nombre de workout dentro de `_capacity_weights`
  - ⚠️ EN TRANSICIÓN como fallback cuando no hay movimientos resolubles.

5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse en el futuro:
  - La heurística por nombre podría eliminarse cuando todos los workouts tengan movimientos válidos y/o pesos explícitos.
- Depende de legacy:
  - Sí, mantiene fallback legacy por nombre para compatibilidad.
- Acoplado a otra capa:
  - Acoplamiento limitado al catálogo de movimientos cargado en runtime.
- Requiere migración futura:
  - No requiere migración de datos actualmente.

6. CONTRATO EXTERNO AFECTADO

- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambia.

7. CHECK DE COHERENCIA

- Arquitectura hexagonal:
  - Se mantiene; la lógica añadida está en capa de aplicación/dominio y no en adapters de entrada/salida.
- Separación dominio/aplicación/infrastructure:
  - Se mantiene la separación, sin mover lógica de dominio a infraestructura o frontend.
- Invariantes de negocio:
  - Se mantiene normalización y no negatividad del impacto por capacidad.
