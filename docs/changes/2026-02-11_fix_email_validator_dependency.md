# 2026-02-11_fix_email_validator_dependency

## 1. CONTEXTO
The backend failed to start with `ImportError: email-validator is not installed` while building Pydantic DTO schemas that use `EmailStr` (`LoginRequestDTO` and auth DTOs).

Goal: restore backend startup without changing business behavior, contracts, or domain logic.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `backend/pyproject.toml`
- Archivos agregados:
  - `docs/changes/2026-02-11_fix_email_validator_dependency.md`

- Funciones anadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - Ninguna.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o anadidas:
  - Ninguna en modelos/DTOs.
- Cambios en contratos o DTOs:
  - Ninguno.

Detalle tecnico:
- Added Poetry dependency `email-validator = "*"`.
- Installed `email-validator` in the active Poetry virtualenv to unblock immediate execution.

## 3. IMPACTO EN EL DOMINIO
- Atletas: no change.
- Capacidades: no change.
- Workouts: no change.
- Tests: no change.
- Ranking: no change.
- Persistencia: no change to schema, tables, migrations, or repositories.

## 4. ESTADO DE USO
- DTOs with `EmailStr` (for example `LoginRequestDTO`):
  - âœ… EN USO (used in auth routers and payload validation).
- Dependency `email-validator`:
  - âœ… EN USO (required by Pydantic schema generation at import time).
- Deprecated/removed elements:
  - âš ï¸ EN TRANSICION: ninguno.
  - âŒ DEPRECADA: ninguno.
  - ðŸ—‘ ELIMINADA: ninguno.

## 5. RIESGO DE REFRACTOR FUTURO
- Low risk.
- This dependency is required while `EmailStr` is used.
- It can be removed in the future only if `EmailStr` is replaced by another validation strategy.
- No new architectural coupling was introduced.

## 6. CONTRATO EXTERNO AFECTADO
- API: no changes.
- Frontend response shape: no changes.
- Database: no changes.
- Seeds: no changes.

## 7. CHECK DE COHERENCIA
- Hexagonal architecture remains intact.
- Domain/application/infrastructure separation remains intact.
- Business invariants are unchanged.
