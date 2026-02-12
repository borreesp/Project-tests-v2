## 1. CONTEXTO
`preflight.ps1` presentaba dos bloqueos:
- En backend tests, con mensaje generico `Backend pytest command failed`.
- En web tests, con `playwright` no encontrado al ejecutar `pnpm --filter @apps/web run test`.

La causa operativa era que `verify.ps1` ejecutaba `pytest` completo dentro del contenedor,
incluyendo suites no pertenecientes al gate minimo definido para CI, y por eso bloqueaba
preflight aunque las suites objetivo de CI estuvieran en verde.

Adicionalmente, la primera implementacion de suites explicitas concatenaba argumentos
de PowerShell en linea y podia construir incorrectamente el comando de `docker compose exec`.

Tambien se detecto drift en `apps/web/package.json`: existia script `test` con `playwright test`
sin declarar `@playwright/test` en dependencias de desarrollo.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `scripts/verify.ps1`
  - `apps/web/package.json`
  - `pnpm-lock.yaml`
  - `docs/changes/2026-02-12_align_verify_backend_suites_with_ci_gate.md`
- Funciones añadidas: ninguna.
- Funciones eliminadas: ninguna.
- Funciones modificadas:
  - `Run-BackendTests` en `scripts/verify.ps1`.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o añadidas: no aplica.
- Cambios en contratos o DTOs: ninguno.
- Ajuste tecnico:
  - `Run-BackendTests` deja de ejecutar `pytest` completo.
  - Ahora ejecuta suites explicitas del gate backend:
    - `tests/test_health.py -q`
    - `tests/test_api_flows.py -q`
  - Se corrige la construccion de argumentos a `docker` creando arrays explicitos
    (`$pytestArgs` / `$poetryPytestArgs`) antes de invocar `Invoke-CommandWithResult`.
  - Se mantiene fallback a `poetry run pytest` cuando `pytest` no existe en PATH del contenedor.
  - Los mensajes de error ahora identifican la suite puntual que fallo.
  - Se restaura `@playwright/test` en `apps/web/package.json` para que el script `test`
    tenga su runtime declarado.
  - Se actualiza `pnpm-lock.yaml` para reflejar la declaracion restaurada.

## 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: cambia la politica de verificacion automatica backend en preflight (scope de suites)
  y se restablece ejecucion de test web por disponibilidad de runtime.
- Ranking: sin impacto funcional.
- Persistencia: sin impacto funcional.

## 4. ESTADO DE USO
- `Run-BackendTests` actualizado:
  - ✅ EN USO (invocado por `verify.ps1` en preflight local y CI).
- Ejecucion previa de `pytest` completo en preflight:
  - 🗑 ELIMINADA (reemplazada por ejecucion de suites gate backend).
- Script web `test` con runtime faltante:
  - ⚠️ EN TRANSICION resuelta (se restaura `@playwright/test`).

## 5. RIESGO DE REFRACTOR FUTURO
- Puede requerir ajuste si se redefine el gate backend de CI.
- Acoplado al layout actual de tests (`tests/test_health.py`, `tests/test_api_flows.py`).
- Depende de tooling en contenedor (`pytest` o `poetry`).
- Depende de instalacion de runtime Playwright en workspace para test web.
- No requiere migracion de datos.

## 6. CONTRATO EXTERNO AFECTADO
- API: no.
- Respuesta frontend: no.
- Base de datos: no.
- Seeds: no.
- CI/automatizacion: si, se alinea el alcance de tests backend en preflight con gate de CI
  y se corrige runtime faltante para test web.

## 7. CHECK DE COHERENCIA
- No se rompe arquitectura hexagonal.
- No se rompe separacion dominio/aplicacion/infrastructure.
- No se alteran invariantes de negocio.
