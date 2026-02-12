# 1. CONTEXTO

`verify.ps1` permitía `SKIP` de lint/tests web cuando faltaban scripts en `apps/web/package.json`, incluso si el cambio tocaba `apps/web/**`. Eso podía dejar pasar PRs con cambios frontend sin validación mínima explícita.

Objetivo: endurecer la política para que, si hay cambios en `apps/web/**`, la ausencia de scripts de lint/tests provoque `FAIL` con mensaje guiado.

# 2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `scripts/verify.ps1`
- Archivos añadidos:
  - `docs/changes/2026-02-12_web-tests-policy.md`

- Funciones añadidas:
  - `Test-GitRef`
  - `Get-VerifyDiffRange`
  - `Get-ChangedFilesForVerify`
  - `Test-WebChangesPresent`

- Funciones modificadas:
  - Flujo principal de `verify.ps1` para calcular si hay cambios en `apps/web/**`.
  - Bloque de lint web: ahora hace `FAIL` si hay cambios web y falta script `lint`.
  - Bloque de tests web: ahora hace `FAIL` si hay cambios web y faltan scripts `test`/`test:ci`.

- Funciones eliminadas:
  - Ninguna.

- Clases sustituidas:
  - Ninguna.

- Propiedades eliminadas o añadidas:
  - No aplica.

- Cambios en contratos o DTOs:
  - Ninguno.

Comportamiento final:
- Si hay cambios en `apps/web/**`:
  - Falta `lint` => `FAIL` con mensaje `web changed but lint script missing`.
  - Faltan `test` y `test:ci` => `FAIL` con mensaje `web changed but tests missing`.
- Si no hay cambios en `apps/web/**`:
  - Se mantiene `SKIP web lint/tests: script not found`.

# 3. IMPACTO EN EL DOMINIO

- Atletas: sin impacto.
- Capacidades: sin impacto.
- Workouts: sin impacto.
- Tests: endurece política de calidad en frontend cuando hay cambios web.
- Ranking: sin impacto.
- Persistencia: sin impacto.

# 4. ESTADO DE USO

- `Test-WebChangesPresent`:
  - ✅ EN USO en `verify.ps1` para decidir política de `SKIP`/`FAIL` en web.
- `Get-VerifyDiffRange` y `Get-ChangedFilesForVerify`:
  - ✅ EN USO en detección de cambios local y CI.
- Política anterior de `SKIP` incondicional por script faltante:
  - ❌ DEPRECADA (reemplazada por política condicional a cambios web).

# 5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse en el futuro:
  - La detección local por `HEAD + working tree` podría simplificarse si toda validación se limita a CI con range fijo.
- Depende de legacy:
  - Depende de convención de rutas `apps/web/**` y de `git` disponible en entorno.
- Está acoplado a otra capa:
  - Acoplado a scripts de infraestructura/CI, no a dominio.
- Requiere migración futura:
  - No requiere migración de datos.

# 6. CONTRATO EXTERNO AFECTADO

- API: no cambia.
- Respuesta frontend: no cambia contrato; cambia política de validación en pipeline.
- Base de datos: no cambia.
- Seeds: no cambia.

# 7. CHECK DE COHERENCIA

- No se rompe arquitectura hexagonal.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
