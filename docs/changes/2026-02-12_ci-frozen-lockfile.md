# 1. CONTEXTO
Se necesitaba hacer el pipeline de CI más determinista para evitar ejecuciones de verificación sobre un workspace con dependencias potencialmente desalineadas respecto al lockfile, y mejorar la trazabilidad de skips en verificación web.

Objetivo:
- Forzar instalación con lockfile congelado en CI antes de la verificación repo-wide.
- Señalizar explícitamente cuando lint/tests web se omiten por falta de scripts.

# 2. CAMBIOS REALIZADOS
## Archivos modificados
- `.github/workflows/ci.yml`
- `scripts/verify.ps1`

## Archivos añadidos
- `docs/changes/2026-02-12_ci-frozen-lockfile.md`

## Funciones añadidas
- Ninguna.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- Flujo CI (`.github/workflows/ci.yml`):
  - Añadido paso obligatorio:
    - `pnpm -w install --frozen-lockfile`
  - Se ejecuta antes de `verify.ps1`.
  - Se mantiene cache pnpm vía `actions/setup-node`.
- `scripts/verify.ps1`:
  - Ajuste de mensajes de skip:
    - `SKIP web lint: script not found`
    - `SKIP web tests: script not found`
  - Sin cambios de política (sigue siendo skip, no fail).

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- Ninguna.

## Cambios en contratos o DTOs
- Ninguno.

# 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto.
- Capacidades: sin impacto.
- Workouts: sin impacto.
- Tests: sin impacto en reglas de negocio.
- Ranking: sin impacto.
- Persistencia: sin cambios.

# 4. ESTADO DE USO
- ✅ EN USO
  - CI usa instalación determinista con lockfile congelado antes de `verify.ps1`.
  - Logs de skip web en `verify.ps1` quedan explícitos y uniformes.
- ⚠️ EN TRANSICIÓN
  - Ninguno.
- ❌ DEPRECADA (pero mantenida)
  - Mensajes de skip previos menos explícitos en verificación web.
- 🗑 ELIMINADA
  - Ninguna pieza de código eliminada.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro:
  - Paso explícito de instalación en CI si se unifica instalación dentro de `verify.ps1` con modo estricto forzado por entorno.
- Depende de legacy:
  - Sí, depende del lockfile presente y consistente en repo.
- Está acoplado a otra capa:
  - Acoplado a tooling de CI (GitHub Actions, pnpm).
- Requiere migración futura:
  - No obligatoria; solo ajustes si cambia el gestor de paquetes o el flujo de verificación.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambian.
- CI/automatización: sí cambia (instalación determinista con `--frozen-lockfile` previa a verify).

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe (cambios en tooling/automatización).
- Separación dominio/aplicación/infrastructure: se mantiene intacta.
- Invariantes de negocio: no se alteran.
