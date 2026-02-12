## 1. CONTEXTO
Durante preflight/ejecucion web se observaba `500 Internal Server Error` en `GET /api/v1/me`
cuando el access token estaba expirado. El traceback mostraba `ExpiredSignatureError`
en `jwt_service.decode()` y fallo posterior en dependencia de autenticacion.

Objetivo: asegurar que token expirado/invalido se traduzca a `401 Unauthorized`,
sin propagarse como error interno.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `backend/src/application/services/runtime_service.py`
  - `backend/tests/test_api_flows.py`
  - `docs/changes/2026-02-12_fix_expired_token_me_unauthorized.md`
- Funciones añadidas:
  - `test_me_returns_401_with_expired_access_token` en `backend/tests/test_api_flows.py`.
- Funciones eliminadas: ninguna.
- Funciones modificadas:
  - `decode_access_token` en `backend/src/application/services/runtime_service.py`.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o añadidas: ninguna.
- Cambios en contratos o DTOs: ninguno.
- Ajuste tecnico:
  - `decode_access_token` ahora captura `ValueError` de `JwtService.decode()` y la mapea a
    `UnauthorizedError("Invalid token")`.
  - Se agrega test de regresion que genera JWT expirado y valida `401` en `/api/v1/me`.

## 3. IMPACTO EN EL DOMINIO
- Atletas: mejora manejo de sesion expirada (respuesta correcta `401`).
- Capacidades: sin impacto.
- Workouts: sin impacto.
- Tests: mejora robustez de autenticacion en endpoint publico autenticado.
- Ranking: sin impacto.
- Persistencia: sin impacto.

## 4. ESTADO DE USO
- `RuntimeService.decode_access_token`:
  - ✅ EN USO (dependencias `current_user_dep` y `current_user_optional_dep`).
- Flujo previo que propagaba `ValueError` sin mapear:
  - 🗑 ELIMINADA (reemplazado por mapping a `UnauthorizedError`).
- `test_me_returns_401_with_expired_access_token`:
  - ✅ EN USO (suite `backend/tests/test_api_flows.py`).

## 5. RIESGO DE REFRACTOR FUTURO
- Riesgo bajo; cambio de mapeo de error en capa aplicacion/auth.
- Depende de que `JwtService.decode` mantenga contrato de error (`ValueError`).
- Acoplado a flujo de autenticacion HTTP por `current_user_dep`.
- No requiere migracion futura de datos.

## 6. CONTRATO EXTERNO AFECTADO
- API: si, corrige comportamiento esperado para token expirado (`401` en lugar de `500`).
- Respuesta frontend: si, ahora recibe error de autorizacion manejable.
- Base de datos: no.
- Seeds: no.

## 7. CHECK DE COHERENCIA
- No se rompe arquitectura hexagonal.
- No se rompe separacion dominio/aplicacion/infrastructure.
- No se alteran invariantes de negocio.
