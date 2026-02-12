# 1. CONTEXTO
Se detectó la necesidad de blindar el contrato entre frontend web y backend para evitar regresiones donde un mapper del cliente recalcule datos sensibles (por ejemplo métricas de capacidades como `percentFill`) o altere campos críticos del contrato (`id`, `scoreType`, `isTest`).

# 2. CAMBIOS REALIZADOS
- **Archivos modificados**
  - `packages/sdk/tests/api-contract.test.ts` (nuevo)
  - `docs/changes/2026-02-12_web_mapper_contract_tests.md` (nuevo)
- **Funciones añadidas**
  - No se añadieron funciones productivas.
  - Se añadieron 2 casos de test en Vitest:
    - `returns workout contract fields exactly as delivered by backend`
    - `does not recalculate dashboard capacity values and preserves backend computed fields`
- **Funciones eliminadas**
  - Ninguna.
- **Funciones modificadas**
  - Ninguna función de código productivo.
- **Clases sustituidas**
  - Ninguna.
- **Propiedades eliminadas o añadidas**
  - No hubo cambios en modelos/entidades/DTOs de producción.
  - En tests se validó preservación de campos críticos del contrato.
- **Cambios en contratos o DTOs**
  - No hubo cambios de contrato; se añadieron validaciones automáticas del contrato actual.

# 3. IMPACTO EN EL DOMINIO
- **Atletas**: sin cambio funcional; se asegura que el dashboard del atleta use métricas calculadas por backend sin recálculo en frontend.
- **Capacidades**: se protege que los valores y campos computados (incluyendo `percentFill` cuando venga en payload) pasen intactos.
- **Workouts**: se protege la integridad de `id`, `scoreType` e `isTest` en listados consumidos por web.
- **Tests**: aumenta cobertura de contrato entre capas.
- **Ranking**: sin cambios directos.
- **Persistencia**: sin cambios.

# 4. ESTADO DE USO
- ✅ **EN USO** `createApi().listWorkouts` (validado por test de contrato en `packages/sdk/tests/api-contract.test.ts`).
- ✅ **EN USO** `createApi().getAthleteDashboard` (validado por test de no recálculo y passthrough de payload backend).
- ⚠️ **EN TRANSICIÓN** N/A.
- ❌ **DEPRECADA** Ninguna.
- 🗑 **ELIMINADA** Ninguna.

# 5. RIESGO DE REFRACTOR FUTURO
- Riesgo principal: introducir mappers frontend que normalicen/recalculen datos de capacidades rompería estos tests.
- Acoplamiento: los tests dependen del contrato backend vigente (camelCase y campos críticos).
- Migración futura: si backend cambia nombres/campos, se deberán actualizar tests junto con versión de contrato.

# 6. CONTRATO EXTERNO AFECTADO
- **API**: no cambia.
- **Respuesta frontend**: no cambia.
- **Base de datos**: no cambia.
- **Seeds**: no cambia.

# 7. CHECK DE COHERENCIA
- Se confirma que **no se rompe arquitectura hexagonal**.
- Se confirma que **no se rompe separación dominio/aplicación/infrastructure**.
- Se confirma que **no se alteran invariantes de negocio**; solo se refuerza cobertura de tests de contrato.
