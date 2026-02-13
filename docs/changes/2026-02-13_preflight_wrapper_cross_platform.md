1. CONTEXTO
En Codex web el comando `powershell -NoProfile -ExecutionPolicy Bypass -File ./scripts/preflight.ps1` falla cuando el runtime no tiene `powershell`/`pwsh`, bloqueando el cierre obligatorio de preflight.

Objetivo: exponer un entrypoint unico (`scripts/preflight`) que detecte entorno y ejecute la validacion sin depender de un shell concreto.

2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `scripts/preflight` (nuevo archivo wrapper).
  - `.github/workflows/ci.yml` (actualizacion del job `verify` para usar wrapper).
  - `docs/changes/2026-02-13_preflight_wrapper_cross_platform.md` (documentacion tecnica obligatoria).
- Funciones anadidas:
  - Ninguna funcion de dominio/aplicacion. Se agrega flujo shell en wrapper.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - Ninguna funcion Python/TypeScript.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o anadidas:
  - Ninguna en modelos/entidades.
- Cambios en contratos o DTOs:
  - Ninguno.
- Detalle tecnico del wrapper:
  - Prioriza `pwsh` si existe.
  - Si no existe, intenta `powershell`/`powershell.exe`.
  - Si no hay PowerShell, hace fallback a `scripts/verify.sh`.
  - Mantiene salida `OK TO OPEN PR` cuando la verificacion termina en exito.
- CI:
  - Se reemplaza la ejecucion directa de `./scripts/preflight.ps1` por `bash ./scripts/preflight`.

3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: sin impacto en reglas de negocio; cambia el entrypoint de ejecucion de validaciones en CI y entornos Linux.
- Ranking: sin impacto funcional.
- Persistencia: sin impacto (sin cambios de schema, modelos ni migraciones).

4. ESTADO DE USO
- `scripts/preflight`:
  - ✅ EN USO (entrypoint principal en CI y utilizable en Codex web/Linux/macOS).
- `scripts/preflight.ps1`:
  - ✅ EN USO (ejecucion principal cuando existe PowerShell; invocado por wrapper).
- `scripts/verify.sh`:
  - ⚠️ EN TRANSICION (fallback cuando PowerShell no esta disponible).
- Paso `Run preflight verification` de `.github/workflows/ci.yml`:
  - ✅ EN USO (ahora ejecuta wrapper portable).

5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro:
  - El fallback a `verify.sh` podria eliminarse si se unifican todas las validaciones en un runner cross-platform unico.
- Dependencia de legacy:
  - Mantiene compatibilidad con `preflight.ps1` (legacy operativo actual).
- Acoplamiento:
  - El wrapper queda acoplado a la existencia de `scripts/preflight.ps1` y/o `scripts/verify.sh`.
- Migracion futura:
  - Recomendable consolidar verificaciones en un solo script con paridad completa de checks entre shells.

6. CONTRATO EXTERNO AFECTADO
- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambia.
- CI/automatizacion: si cambia el comando de invocacion del gate de preflight en GitHub Actions.

7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe (sin cambios en dominio/adapters/ports).
- Separacion dominio/aplicacion/infrastructure: se mantiene intacta.
- Invariantes de negocio: no se alteran.
