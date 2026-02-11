# 2026-02-11_docker_compose_backend_db

## 1. CONTEXTO
The project did not satisfy a one-command startup for backend + PostgreSQL with `docker compose up`.

Detected issues before this change:
- `docker-compose.yml` had incomplete database configuration.
- PostgreSQL service had no required env vars or persistent volume.
- Compose referenced backend build context without a backend Dockerfile.
- Backend DB connection defaults used `localhost`.
- Compose included an unrelated `web` service for this requirement.

Goal:
- Ensure backend + db are fully dockerized and start via only `docker compose up`.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `docker-compose.yml`
  - `backend/src/infrastructure/config/settings.py`
  - `backend/alembic.ini`
- Archivos agregados:
  - `backend/Dockerfile`
  - `backend/.dockerignore`
  - `docs/changes/2026-02-11_docker_compose_backend_db.md`

- Funciones anadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - Ninguna.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o anadidas:
  - Modificada propiedad de configuracion `Settings.database_url` (default value).
- Cambios en contratos o DTOs:
  - Ninguno.

Detalle tecnico aplicado:
- `docker-compose.yml` now defines only:
  - `db` service using official `postgres:16` image.
  - `backend` service built from `backend/Dockerfile`.
- Added required PostgreSQL env vars:
  - `POSTGRES_USER`
  - `POSTGRES_PASSWORD`
  - `POSTGRES_DB`
- Added PostgreSQL persistent volume:
  - `postgres_data:/var/lib/postgresql/data`
- Added `depends_on` with health condition:
  - `backend` waits for `db` to be healthy.
- Backend DATABASE_URL now uses compose hostname:
  - `postgresql+asyncpg://postgres:postgres@db:5432/app`
- Removed localhost DB references in dockerized connection defaults:
  - `backend/src/infrastructure/config/settings.py`
  - `backend/alembic.ini`
- Added backend container build file:
  - multi-stage `backend/Dockerfile`.
- Added `backend/.dockerignore` to keep backend image context clean.

## 3. IMPACTO EN EL DOMINIO
- Atletas: no business behavior change.
- Capacidades: no business behavior change.
- Workouts: no business behavior change.
- Tests: no business behavior change.
- Ranking: no business behavior change.
- Persistencia:
  - Infrastructure-level change only (container networking and DB bootstrap).
  - No schema change.
  - No migration content change.

## 4. ESTADO DE USO
- `docker-compose.yml` (`db`, `backend` services):
  - ? EN USO (entrypoint for `docker compose up`).
- `backend/Dockerfile`:
  - ? EN USO (compose backend build target).
- `Settings.database_url` default with host `db`:
  - ? EN USO (runtime config fallback).
- Previous compose `postgres` minimal service and `web` service in this flow:
  - ?? ELIMINADA (from required backend+db startup path).
- Deprecated/transitional elements:
  - ?? EN TRANSICION: ninguno.
  - ? DEPRECADA: ninguno.

## 5. RIESGO DE REFRACTOR FUTURO
- Low-to-medium.
- `Settings.database_url` default is now container-oriented (`db` hostname).
- Non-docker local runs should override `DATABASE_URL` explicitly if needed.
- Docker startup depends on Docker Engine availability and permissions on host.

## 6. CONTRATO EXTERNO AFECTADO
- API: no change.
- Frontend response: no change.
- Base de datos: no schema change, only container service definition and connection host.
- Seeds: no change.

## 7. CHECK DE COHERENCIA
- Hexagonal architecture: preserved.
- Domain/application/infrastructure separation: preserved.
- Business invariants: unchanged.
