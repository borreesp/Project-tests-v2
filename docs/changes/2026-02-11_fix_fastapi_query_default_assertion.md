# 2026-02-11_fix_fastapi_query_default_assertion

## 1. CONTEXTO
After fixing `email-validator`, backend import still failed during route registration with:
`AssertionError: Query default value cannot be set in Annotated for 'query'.`

Root cause: FastAPI version in use rejects `Query(default=...)` inside `Annotated[...]` for this endpoint signature.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `backend/src/adapters/inbound/http/routers/public.py`
- Archivos agregados:
  - `docs/changes/2026-02-11_fix_fastapi_query_default_assertion.md`

- Funciones anadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - `list_movements`
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o anadidas:
  - Ninguna.
- Cambios en contratos o DTOs:
  - Ninguno (solo ajuste de declaracion de default del query param).

Detalle tecnico:
- Cambio de firma:
  - Antes: `query: Annotated[str | None, Query(default=None)]`
  - Ahora: `service: Annotated[RuntimeService, Depends(runtime_service_dep)], query: Annotated[str | None, Query()] = None`
- Se reordeno la firma para cumplir reglas de Python (`no-default parameter follows default parameter`).

## 3. IMPACTO EN EL DOMINIO
- Atletas: sin cambio funcional.
- Capacidades: sin cambio.
- Workouts: sin cambio.
- Tests: sin cambio.
- Ranking: sin cambio.
- Persistencia: sin cambio.

## 4. ESTADO DE USO
- `list_movements`:
  - ? EN USO (router publico `GET /api/v1/movements`).
- Firma anterior de parametro con `Query(default=...)` en `Annotated`:
  - ?? ELIMINADA (sustituida por declaracion compatible con FastAPI actual).
- Componentes en transicion/deprecados:
  - ?? EN TRANSICION: ninguno.
  - ? DEPRECADA: ninguno.

## 5. RIESGO DE REFRACTOR FUTURO
- Riesgo bajo.
- Cambio acotado al wiring HTTP de FastAPI.
- Si se actualiza FastAPI, mantener el patron recomendado para defaults en `Annotated`.

## 6. CONTRATO EXTERNO AFECTADO
- API: sin cambios de ruta, semantica o payload.
- Respuesta frontend: sin cambios.
- Base de datos: sin cambios.
- Seeds: sin cambios.

## 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: intacta.
- Separacion dominio/aplicacion/infrastructure: intacta.
- Invariantes de negocio: no alteradas.
