## 1. CONTEXTO
El job de CI fallaba en el paso `Install backend dependencies` con el error de Poetry:
`pyproject.toml changed significantly since poetry.lock was last generated`.

Objetivo: resincronizar `backend/poetry.lock` con el contenido actual de
`backend/pyproject.toml` para restaurar instalaciones deterministas en CI.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `backend/poetry.lock`
  - `docs/changes/2026-02-12_fix_backend_poetry_lock_sync.md`
- Funciones anadidas: ninguna.
- Funciones eliminadas: ninguna.
- Funciones modificadas: ninguna.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o anadidas: ninguna.
- Cambios en contratos o DTOs: ninguno.
- Cambio tecnico:
  - Se regenero `backend/poetry.lock` ejecutando `poetry lock` para alinear el lockfile
    con `pyproject.toml`.

## 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: sin impacto en reglas de negocio.
- Ranking: sin impacto funcional.
- Persistencia: sin cambios en modelo ni migraciones; solo tooling de dependencias.

## 4. ESTADO DE USO
- `backend/poetry.lock`:
  - ✅ EN USO (consumido por `poetry install --no-interaction --no-root` en CI y local).
- Lockfile previo desalineado:
  - 🗑 ELIMINADA (estado obsoleto reemplazado por lockfile regenerado).

## 5. RIESGO DE REFRACTOR FUTURO
- Puede requerir nueva regeneracion si cambia `backend/pyproject.toml`.
- Depende de tooling Poetry y su version en CI.
- Acoplado a la capa de build/CI (no a dominio).
- No requiere migracion de datos.

## 6. CONTRATO EXTERNO AFECTADO
- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambian.
- CI/Build: si cambia, porque se corrige el contrato de instalacion reproducible con lockfile.

## 7. CHECK DE COHERENCIA
- No se rompe arquitectura hexagonal.
- No se rompe separacion dominio/aplicacion/infrastructure.
- No se alteran invariantes de negocio.
