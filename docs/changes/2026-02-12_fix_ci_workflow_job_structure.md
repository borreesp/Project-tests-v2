## 1. CONTEXTO
El workflow de GitHub Actions (`.github/workflows/ci.yml`) quedó inválido porque existía un job `web` incompleto (solo con `name`), lo que impedía que GitHub interpretara el archivo y ejecutara CI.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `.github/workflows/ci.yml`
  - `docs/changes/2026-02-12_fix_ci_workflow_job_structure.md`
- Funciones añadidas: ninguna.
- Funciones eliminadas: ninguna.
- Funciones modificadas: ninguna.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o añadidas: no aplica a modelos de dominio.
- Cambios en contratos o DTOs: ninguno.
- Ajuste técnico realizado:
  - Se eliminó el bloque huérfano:
    - `web:`
    - `name: Web lint + tests`
  - Se mantiene `verify` como job válido con `runs-on` y `steps`.

## 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto.
- Capacidades: sin impacto.
- Workouts: sin impacto.
- Tests (entidad de negocio): sin impacto.
- Ranking: sin impacto.
- Persistencia: sin impacto.

## 4. ESTADO DE USO
- Job `backend` en `.github/workflows/ci.yml`:
  - ✅ EN USO (ejecuta lint + tests backend).
- Job `verify` en `.github/workflows/ci.yml`:
  - ✅ EN USO (ejecuta `preflight.ps1`).
- Job `web` incompleto:
  - 🗑 ELIMINADA (no ejecutable; reemplazo funcional cubierto por `verify`).

## 5. RIESGO DE REFRACTOR FUTURO
- Puede requerir separación futura de un job `web` dedicado si se desea paralelizar lint/tests frontend fuera de `verify`.
- Actualmente el gate queda acoplado al script `scripts/preflight.ps1` (single entrypoint).
- No depende de legacy de dominio; depende de infraestructura CI.

## 6. CONTRATO EXTERNO AFECTADO
- API: no.
- Respuesta frontend: no.
- Base de datos: no.
- Seeds: no.
- CI/automatización: sí, se corrige el contrato de ejecución de GitHub Actions al volver el YAML válido.

## 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe (sin cambios de código de dominio/aplicación/infrastructure).
- Separación dominio/aplicación/infrastructure: no se altera.
- Invariantes de negocio: no se alteran.
