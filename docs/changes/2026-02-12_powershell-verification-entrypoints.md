# 1. CONTEXTO
La ejecución local en Windows PowerShell de `bash scripts/check-docs-changes.sh` y `bash scripts/verify.sh` estaba fallando porque `bash.exe` apuntaba al launcher de WSL sin `/bin/bash` disponible.

Objetivo:
- Permitir ejecutar la verificación repo-wide y el enforcement de documentación desde PowerShell sin depender de WSL.

# 2. CAMBIOS REALIZADOS
## Archivos modificados
- `README.md`
- `scripts/check-docs-changes.ps1`
- `scripts/verify.ps1`

## Archivos añadidos
- `docs/changes/2026-02-12_powershell-verification-entrypoints.md`

## Funciones añadidas
- `scripts/check-docs-changes.ps1`:
  - `Write-Log`
  - `Fail`
  - `Test-GitRef`
  - `Get-DiffRange`
  - `Test-CodeFile`
- `scripts/verify.ps1`:
  - `Write-Log`
  - `Write-WarnLog`
  - `Fail`
  - `Require-Command`
  - `Invoke-CommandWithResult`
  - `Get-ComposeServices`
  - `Test-ServiceExists`
  - `Get-BackendService`
  - `Wait-BackendReady`
  - `Run-BackendTests`
  - `Test-WebScriptExists`

## Funciones eliminadas
- Se eliminaron implementaciones wrapper previas en ambos `.ps1` que solo delegaban a Git Bash.

## Funciones modificadas
- No aplica en código de dominio; solo scripting de automatización.

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
  - `scripts/check-docs-changes.ps1`: enforcement de documentación en entorno PowerShell.
  - `scripts/verify.ps1`: verificación repo-wide en entorno PowerShell.
  - `README.md`: comandos PowerShell documentados.
- ⚠️ EN TRANSICIÓN
  - Ninguno.
- ❌ DEPRECADA (pero mantenida)
  - Ninguna.
- 🗑 ELIMINADA
  - Lógica de delegación a Git Bash dentro de `scripts/check-docs-changes.ps1`.
  - Lógica de delegación a Git Bash dentro de `scripts/verify.ps1`.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro:
  - Scripts `.ps1` si se estandariza ejecución local únicamente en contenedor Linux/WSL.
- Depende de legacy:
  - Sí, depende del comportamiento de `git diff`/`git rev-parse` para detectar base de comparación.
- Está acoplado a otra capa:
  - Acoplado a infraestructura de tooling (`docker`, `pnpm`, `git`) y a la estructura de scripts del monorepo.
- Requiere migración futura:
  - No obligatoria. Solo ajuste si cambian nombres de servicios compose o scripts de `apps/web`.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambian.
- Tooling de desarrollo: sí cambia (entrypoints PowerShell nativos).

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe; no se tocó dominio/aplicación/infra de negocio.
- Separación dominio/aplicación/infrastructure: se mantiene intacta.
- Invariantes de negocio: no se alteran.
