# 1. CONTEXTO

Se detectó riesgo de falsos positivos en verificación integral: un PR podía pasar readiness + tests y aun así fallar en runtime por problemas de base de datos/migraciones.

Objetivo del cambio: añadir un chequeo opcional de sanidad de DB en `scripts/verify.ps1`, activado únicamente con `VERIFY_DB=1`, para validar conectividad/estado de migraciones antes de ejecutar `pytest`.

# 2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `scripts/verify.ps1`
- Archivos añadidos:
  - `docs/changes/2026-02-12_verify-db-sanity.md`

- Funciones añadidas en `scripts/verify.ps1`:
  - `Get-HttpStatusCode(Url, TimeoutSec)`
  - `Test-ServiceCommandExists(Service, CommandName)`
  - `Get-DbDependentEndpointCandidate()`
  - `Run-DbSanityCheck(Service)`

- Funciones modificadas:
  - `Wait-BackendReady(Service)`:
    - Mantiene prioridad en `/health`.
    - Usa helper común `Get-HttpStatusCode`.
    - Mantiene fallback a `/openapi.json` solo cuando `/health` no está disponible.
  - Flujo principal de verify:
    - Inserta ejecución condicional de `Run-DbSanityCheck` después de `Wait-BackendReady` y antes de `Run-BackendTests` cuando `VERIFY_DB=1`.

- Funciones eliminadas:
  - Ninguna.

- Clases sustituidas:
  - Ninguna.

- Propiedades eliminadas o añadidas:
  - No aplica (sin cambios en modelos de dominio/persistencia).

- Cambios en contratos o DTOs:
  - Ninguno.

Detalles funcionales del nuevo chequeo:
- Si `VERIFY_DB=1`:
  1. Intenta `alembic current` dentro del contenedor backend (si existe `alembic`).
  2. Si `alembic` no existe, intenta fallback HTTP solo con endpoint DB-dependiente existente detectado en código (`db_session_dep`, `GET`, sin path params, sin dependencia de usuario actual).
  3. Si no hay forma fiable de validar DB, falla con mensaje explícito:
     - `VERIFY_DB=1 requested but DB sanity check cannot be performed; install alembic in container or provide a DB-dependent endpoint.`

# 3. IMPACTO EN EL DOMINIO

- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: mejora del pipeline de verificación previa (más cobertura de fallos de infraestructura).
- Ranking: sin impacto funcional.
- Persistencia: sin cambios de esquema ni datos; solo validación operativa opcional del estado DB/migraciones.

# 4. ESTADO DE USO

- `Run-DbSanityCheck`:
  - ✅ EN USO en `scripts/verify.ps1` cuando `VERIFY_DB=1`.
- `Get-HttpStatusCode`:
  - ✅ EN USO por `Wait-BackendReady` y `Run-DbSanityCheck`.
- `Test-ServiceCommandExists`:
  - ✅ EN USO por `Run-DbSanityCheck`.
- `Get-DbDependentEndpointCandidate`:
  - ✅ EN USO como fallback de `Run-DbSanityCheck` cuando no hay `alembic`.
- `Wait-BackendReady`:
  - ✅ EN USO por flujo principal de verificación.

No quedan elementos en transición, deprecados o eliminados en esta intervención.

# 5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse en el futuro:
  - El fallback por detección estática de endpoint DB puede retirarse si el contenedor backend garantiza `alembic` siempre.
- Depende de legacy:
  - Depende del contrato actual de `docker compose exec` y del layout de routers Python para detección de fallback.
- Acoplado a otra capa:
  - Acoplado a infraestructura/CI (scripts), no a dominio.
- Requiere migración futura:
  - No requiere migración de datos.

# 6. CONTRATO EXTERNO AFECTADO

- API: no cambia contrato de endpoints.
- Respuesta frontend: sin cambios.
- Base de datos: sin cambios de esquema.
- Seeds: sin cambios.

# 7. CHECK DE COHERENCIA

- Arquitectura hexagonal: no se rompe (cambio limitado a scripting operacional).
- Separación dominio/aplicación/infrastructure: se mantiene; no se toca lógica de negocio.
- Invariantes de negocio: no se alteran.
