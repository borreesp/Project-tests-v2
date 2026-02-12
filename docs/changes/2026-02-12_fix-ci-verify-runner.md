# 1. CONTEXTO

El workflow de CI mezclaba decisiones de ejecución entre scripts de verificación y requería un comando canónico único para evitar divergencias entre local y CI.

Objetivo: ejecutar la verificación en CI exclusivamente mediante `preflight.ps1` en `pwsh`, manteniendo instalación determinista de dependencias con lockfile congelado.

# 2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `.github/workflows/ci.yml`
- Archivos añadidos:
  - `docs/changes/2026-02-12_fix-ci-verify-runner.md`

- Funciones añadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - No aplica a código de aplicación; se modificó flujo de pipeline CI.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - No aplica.
- Cambios en contratos o DTOs:
  - Ninguno.

Detalle técnico en CI:
- Se mantiene `runs-on: ubuntu-latest`.
- Se mantiene `actions/checkout@v4` con `fetch-depth: 0`.
- Se mantiene setup de `pnpm` + `node` con cache `pnpm`.
- Se mantiene paso obligatorio `pnpm -w install --frozen-lockfile` previo a verificación.
- Se reemplaza ejecución final de `./scripts/verify.ps1` por `./scripts/preflight.ps1` con `shell: pwsh`.

# 3. IMPACTO EN EL DOMINIO

- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: mejora de consistencia del flujo de validación previo a merge.
- Ranking: sin impacto funcional.
- Persistencia: sin cambios.

# 4. ESTADO DE USO

- Workflow de CI (`.github/workflows/ci.yml`):
  - ✅ EN USO. Ejecuta verificación canónica vía `preflight.ps1`.
- Ejecución directa de `verify.ps1` en job de CI:
  - ⚠️ EN TRANSICIÓN fuera del flujo principal de CI (sigue existiendo para uso local/encadenado por preflight).

# 5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse en el futuro:
  - No aplica eliminación inmediata.
- Depende de legacy:
  - Depende de que `preflight.ps1` siga invocando internamente `verify.ps1`.
- Está acoplado a otra capa:
  - Sí, a capa de infraestructura CI y scripts operativos.
- Requiere migración futura:
  - No requiere migración de datos.

# 6. CONTRATO EXTERNO AFECTADO

- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambia.

# 7. CHECK DE COHERENCIA

- No se rompe arquitectura hexagonal.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
