# 1. CONTEXTO

En el Step 2 del builder de tests/workouts se debía reforzar que los movimientos usados en la estructura provengan exclusivamente del catálogo, evitando inconsistencias cuando un `movement_id` ya no existe o no pertenece al catálogo activo.

Además, el criterio funcional del issue exige que no se pueda guardar un workout con movimientos inexistentes, manteniendo una referencia estable por FK real y no por strings libres.

# 2. CAMBIOS REALIZADOS

- **Archivos modificados**
  - `apps/web/app/coach/workouts/_components/workout-builder.tsx`
  - `backend/tests/test_api_flows.py`

- **Funciones añadidas**
  - No se añadieron nuevas funciones globales.

- **Funciones eliminadas**
  - No se eliminaron funciones.

- **Funciones modificadas**
  - `validationIssues` (cálculo por `useMemo`) en el builder:
    - Se añade validación para detectar `movementId` inexistente en catálogo cargado.
    - Se reporta error crítico por bloque/movimiento cuando el ID no existe.
  - Se añade memo `movementIds` para comparar IDs válidos del catálogo.

- **Clases sustituidas**
  - No aplica.

- **Propiedades eliminadas o añadidas**
  - No se modificaron propiedades de modelos de dominio/persistencia.

- **Cambios en contratos o DTOs**
  - No hubo cambios en DTOs ni contratos API.

- **Tests añadidos/modificados**
  - Se agregó `test_create_workout_rejects_unknown_movement_id` en backend para garantizar rechazo (422) ante `movementId` inexistente.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**
  - Sin impacto directo en su flujo de ejecución de intentos.

- **Capacidades**
  - Sin impacto en cálculo de capacidades.

- **Workouts**
  - Mayor integridad al impedir creación con movimientos fuera de catálogo.

- **Tests**
  - Se refuerza la consistencia del test builder y del payload enviado al backend.

- **Ranking**
  - Sin cambios directos.

- **Persistencia**
  - Se mantiene el esquema actual con FK (`movement_id`), y se refuerza su uso correcto desde builder + validación backend.

# 4. ESTADO DE USO

- ✅ **EN USO** `validationIssues` (builder Step 2): ahora también valida `movementId` contra catálogo cargado.
- ✅ **EN USO** validación backend `_assert_movement_ids_exist` (ya existente): cubierta adicionalmente por test explícito de rechazo.
- ⚠️ **EN TRANSICIÓN** No aplica.
- ❌ **DEPRECADA** No aplica.
- 🗑 **ELIMINADA** No aplica.

# 5. RIESGO DE REFRACTOR FUTURO

- La validación de catálogo en frontend depende de que el listado de movimientos esté sincronizado con backend.
- Puede consolidarse en una utilidad compartida de validaciones del builder para evitar crecimiento del `useMemo` principal.
- No presenta dependencia de legacy nueva.
- Mantiene acoplamiento esperado UI ↔ catálogo público (`/movements`).

# 6. CONTRATO EXTERNO AFECTADO

- **API**: sin cambios de contrato.
- **Respuesta frontend**: sin cambios de shape, solo bloqueo preventivo ante IDs inválidos.
- **Base de datos**: sin cambios de esquema.
- **Seeds**: sin cambios.

# 7. CHECK DE COHERENCIA

- Se mantiene arquitectura hexagonal.
- Se mantiene separación dominio / aplicación / infraestructura.
- No se alteran invariantes de negocio, se refuerza la invariante de integridad de movimiento por catálogo/FK.
