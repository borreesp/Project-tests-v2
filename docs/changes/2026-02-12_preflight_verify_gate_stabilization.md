## 1. CONTEXTO
El flujo `preflight.ps1` presentaba bloqueos encadenados:
- Ejecucion de `pytest` completo en contenedor backend (ruido fuera del gate minimo de CI).
- Fallo de web tests por runtime faltante de Playwright y fragilidad local de `next dev` lock.
- Falla del enforcement de docs por manejo de colecciones escalares en `check-docs-changes.ps1`
  cuando habia un solo documento nuevo.

Objetivo: estabilizar el gate preflight para que refleje el alcance real de CI y falle con
mensajes accionables.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `scripts/verify.ps1`
  - `apps/web/package.json`
  - `pnpm-lock.yaml`
  - `apps/web/components/role-tabs.tsx`
  - `apps/web/tests/role-tabs.test.tsx`
  - `scripts/check-docs-changes.ps1`
  - `docs/changes/2026-02-12_preflight_verify_gate_stabilization.md`
- Funciones añadidas: ninguna.
- Funciones eliminadas: ninguna.
- Funciones modificadas:
  - `Run-BackendTests` en `scripts/verify.ps1`.
  - `resolveRole` en `apps/web/components/role-tabs.tsx`.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o añadidas:
  - `apps/web/package.json`:
    - `devDependencies.@playwright/test` añadida.
    - script `test:ci` añadido (`vitest run`).
- Cambios en contratos o DTOs: ninguno.
- Ajustes tecnicos:
  - Backend verify ahora ejecuta suites gate explicitas:
    - `tests/test_health.py -q`
    - `tests/test_api_flows.py -q`
  - Se corrige construccion de argumentos `docker compose exec` en PowerShell usando arrays explicitos.
  - Web verify prioriza `test:ci` (ya soportado por verify) y se define dicho script en app web.
  - Se restaura runtime de Playwright para el script `test`.
  - Se corrige `RoleTabs` para tolerar `pathname` nulo.
  - Se actualiza test `RoleTabs` para mockear `usePathname` y validar comportamiento real por ruta.
  - `check-docs-changes.ps1` fuerza arrays (`@(...)`) al ordenar `changedFiles/newDocs` y evita excepcion por `.Count`.

## 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto funcional de negocio.
- Capacidades: sin impacto.
- Workouts: sin impacto.
- Tests: mejora estabilidad y trazabilidad del gate de validacion.
- Ranking: sin impacto.
- Persistencia: sin impacto.

## 4. ESTADO DE USO
- `Run-BackendTests` actualizado:
  - ✅ EN USO (preflight/verify local y CI).
- `resolveRole`:
  - ✅ EN USO (componente `RoleTabs`).
- Test `RoleTabs` actualizado:
  - ✅ EN USO (`vitest` en `test:ci`).
- Logica previa de `pytest` completo en verify:
  - 🗑 ELIMINADA (reemplazada por suites gate).
- Manejo previo de coleccion escalar en docs-check:
  - 🗑 ELIMINADA (reemplazada por arrays forzados).

## 5. RIESGO DE REFRACTOR FUTURO
- Acoplado a rutas fijas de suites backend (`tests/test_health.py`, `tests/test_api_flows.py`).
- Dependiente de convenciones de scripts web (`test`, `test:ci`) en `apps/web/package.json`.
- Dependiente de convencion de `docs/changes` para enforcement de cambios.
- No requiere migracion de datos.

## 6. CONTRATO EXTERNO AFECTADO
- API: no.
- Respuesta frontend: no.
- Base de datos: no.
- Seeds: no.
- CI/automatizacion: si, se estabiliza comportamiento de preflight/verify y docs enforcement.

## 7. CHECK DE COHERENCIA
- No se rompe arquitectura hexagonal.
- No se rompe separacion dominio/aplicacion/infrastructure.
- No se alteran invariantes de negocio.
