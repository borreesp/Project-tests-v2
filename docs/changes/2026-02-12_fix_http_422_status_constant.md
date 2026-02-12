## 1. CONTEXTO
La suite `tests/test_api_flows.py` mostraba dos advertencias:
- De FastAPI/Starlette en codigo propio:
  - `HTTP_422_UNPROCESSABLE_ENTITY` deprecada.
- De dependencia externa (`passlib`) en Python 3.12+:
  - deprecacion del modulo `crypt`, que hoy no depende de logica propia.

Objetivo: eliminar advertencias accionables y reducir ruido en CI sin cambiar comportamiento funcional.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `backend/src/adapters/inbound/http/errors.py`
  - `backend/pytest.ini`
  - `docs/changes/2026-02-12_fix_http_422_status_constant.md`
- Funciones anadidas: ninguna.
- Funciones eliminadas: ninguna.
- Funciones modificadas:
  - `to_http_exception(exc: Exception)` en `backend/src/adapters/inbound/http/errors.py`.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o anadidas: ninguna.
- Cambios en contratos o DTOs: ninguno.
- Ajuste tecnico:
  - Se reemplaza `status.HTTP_422_UNPROCESSABLE_ENTITY` por
    `status.HTTP_422_UNPROCESSABLE_CONTENT` para `ValidationServiceError`.
  - Se agrega filtro de warning en `backend/pytest.ini` para suprimir la advertencia
    conocida de `passlib` sobre `crypt` deprecado en Python 3.13.

## 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto.
- Capacidades: sin impacto.
- Workouts: sin impacto.
- Tests: sin impacto en reglas de negocio.
- Ranking: sin impacto.
- Persistencia: sin impacto.

## 4. ESTADO DE USO
- `to_http_exception`:
  - ✅ EN USO (router HTTP de backend para mapear errores de servicio a respuestas API).
- Constante deprecada `HTTP_422_UNPROCESSABLE_ENTITY` en este mapeo:
  - 🗑 ELIMINADA (reemplazada por `HTTP_422_UNPROCESSABLE_CONTENT`).
- Configuracion de warnings en `backend/pytest.ini`:
  - ✅ EN USO (aplicada por pytest en ejecucion local y CI).

## 5. RIESGO DE REFRACTOR FUTURO
- Riesgo bajo; cambio de constante equivalente en capa HTTP.
- No depende de legacy de dominio.
- Acoplado a la API de constantes de FastAPI/Starlette.
- No requiere migracion de datos.
- El filtro de warning depende de texto exacto del warning de `passlib`; puede requerir
  ajuste si cambia el mensaje en futuras versiones.

## 6. CONTRATO EXTERNO AFECTADO
- API: no cambia semanticamente (se mantiene status 422 para errores de validacion).
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambia.
- Tooling/calidad: si, se elimina advertencia de deprecacion en tests backend.

## 7. CHECK DE COHERENCIA
- No se rompe arquitectura hexagonal.
- No se rompe separacion dominio/aplicacion/infrastructure.
- No se alteran invariantes de negocio.
