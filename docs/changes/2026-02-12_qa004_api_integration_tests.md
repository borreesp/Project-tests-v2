# 1. CONTEXTO

La issue **HIB-10 (QA-004)** solicita cobertura de integración para endpoints críticos de FastAPI, validando tanto casos felices como negativos (payload inválido, `scoreType` faltante e `is_test=false`).

Aunque ya existía una base de pruebas API, faltaban validaciones explícitas de:
- rechazo de payload inválido al crear attempts,
- esquema esperado del perfil del atleta tras validar un intento,
- respuesta de ranking con contrato mínimo esperado tras flujo completo de validación.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `backend/tests/test_api_flows.py`

## Funciones añadidas
- `test_create_attempt_rejects_invalid_payload`
- `test_athlete_dashboard_and_rankings_schema_after_attempt_validation`

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- Ninguna función de dominio/aplicación/infra fue modificada.
- Se amplió la suite de integración API en capa de tests.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- Ninguna (no hay cambios en modelos persistentes).

## Cambios en contratos o DTOs
- Ninguno. Solo se agregan aserciones de contrato sobre respuestas existentes (`dashboard` y `rankings`).

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: se valida que el endpoint de dashboard retorna campos clave del atleta (`athleteId`, `level`, `levelBand`, `capacities`, `counts`) después de attempt validado.
- **Capacidades**: se verifica presencia de 4 capacidades esperadas en dashboard.
- **Workouts**: se mantiene el flujo de creación/publicación para habilitar el contexto de pruebas.
- **Tests**: aumenta cobertura de integración con casos negativos y verificación de schema de respuesta.
- **Ranking**: se valida respuesta de ranking (`scope`, `period`, `scaleCode`, `entries`, `myRank`) tras validación de attempt.
- **Persistencia**: sin cambios estructurales ni migraciones; impacto indirecto al validar comportamiento observable de API.

# 4. ESTADO DE USO

- ✅ **EN USO** `test_create_attempt_rejects_invalid_payload` (ejecutada por `pytest backend/tests/test_api_flows.py` en la suite de integración).
- ✅ **EN USO** `test_athlete_dashboard_and_rankings_schema_after_attempt_validation` (ejecutada por la misma suite).
- ✅ **EN USO** helpers existentes `_login`, `_auth_headers`, `_build_workout_payload` consumidos por las nuevas pruebas.
- ❌ **DEPRECADA**: ninguna.
- 🗑 **ELIMINADA**: ninguna.

# 5. RIESGO DE REFRACTOR FUTURO

- Acoplamiento moderado al contrato HTTP actual (nombres de campos camelCase y estados esperados).
- Si cambia el contrato de ranking/dashboard, estos tests fallarán y exigirán actualización coordinada.
- No depende de legacy específico ni requiere migración de datos.
- Puede ampliarse en el futuro con más casos negativos de validación de resultados (`primaryResult` por `scoreType`).

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia el contrato; se fortalece su verificación automática.
- **Respuesta frontend**: sin cambios de payload, solo validación de estructura existente.
- **Base de datos**: sin cambios.
- **Seeds**: sin cambios.

# 7. CHECK DE COHERENCIA

- ✅ No se rompe arquitectura hexagonal (cambio restringido a capa `tests/`).
- ✅ No se rompe separación dominio/aplicación/infrastructure.
- ✅ No se alteran invariantes de negocio; solo se validan por integración (`is_test=true`, flujo de attempt y ranking).
