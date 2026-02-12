# 1. CONTEXTO

`apps/web` tenía un script `lint` en modo no-op (`echo ...`), lo que debilitaba el gate de calidad para frontend y permitía cambios web sin validación estática real.

Objetivo: restaurar un lint real y funcional en `apps/web`, manteniendo `preflight` en PASS.

# 2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `apps/web/package.json`
  - `apps/web/app/coach/workouts/_components/workout-builder.tsx`
  - `apps/web/lib/use-auth.ts`
  - `apps/web/postcss.config.mjs`
- Archivos eliminados:
  - `apps/web/.eslintrc.json`
- Archivos añadidos:
  - `apps/web/eslint.config.mjs`
  - `docs/changes/2026-02-12_restore-web-lint.md`

- Funciones añadidas:
  - Ninguna.

- Funciones eliminadas:
  - `durationSeconds(blocks)` en `workout-builder.tsx`
  - `isPressEmom(blocks)` en `workout-builder.tsx`
  - Ambas estaban sin uso y generaban warnings.

- Funciones modificadas:
  - `useRequireAuth(allowedRoles?)` en `apps/web/lib/use-auth.ts`:
    - Se ajusta dependencia de `useMemo` para evitar warning de `react-hooks/exhaustive-deps`.

- Clases sustituidas:
  - Ninguna.

- Propiedades eliminadas o añadidas:
  - `apps/web/package.json`:
    - `scripts.lint` cambia de no-op a lint real: `eslint . --max-warnings=0`.
    - `devDependencies.eslint` fijado a `^9.22.0` (runtime real de lint en app web).

- Cambios en contratos o DTOs:
  - Ninguno.

Detalle técnico de lint:
- Se migra de configuración legacy a flat config de ESLint 9 para compatibilidad con stack actual de Next:
  - Nuevo `apps/web/eslint.config.mjs` con `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`.
- Se elimina `.eslintrc.json` legacy para evitar conflictos de resolución de configuración.
- Se corrigen hallazgos de lint existentes en código (1 error + warnings) para mantener `--max-warnings=0`.

# 3. IMPACTO EN EL DOMINIO

- Atletas: sin impacto de negocio.
- Capacidades: sin impacto de negocio.
- Workouts: sin cambio de lógica de dominio; solo limpieza de código frontend y texto JSX.
- Tests: mejora gate de calidad en frontend (lint real).
- Ranking: sin impacto.
- Persistencia: sin impacto.

# 4. ESTADO DE USO

- Script `apps/web` `lint`:
  - ✅ EN USO con validación real (`eslint . --max-warnings=0`).
- Configuración `apps/web/eslint.config.mjs`:
  - ✅ EN USO (config canónica de lint en frontend).
- Configuración legacy `apps/web/.eslintrc.json`:
  - 🗑 ELIMINADA.
- Funciones `durationSeconds` / `isPressEmom`:
  - 🗑 ELIMINADAS por no uso.

# 5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse en el futuro:
  - No aplica eliminación inmediata de este cambio.
- Depende de legacy:
  - Se elimina dependencia de formato legacy `.eslintrc` en `apps/web`.
- Está acoplado a otra capa:
  - Acoplado a capa de tooling frontend (ESLint/Next), no a dominio.
- Requiere migración futura:
  - No requiere migración de datos.

# 6. CONTRATO EXTERNO AFECTADO

- API: no cambia.
- Respuesta frontend: no cambia contrato de API; solo calidad estática y ajustes menores de código UI.
- Base de datos: no cambia.
- Seeds: no cambia.

# 7. CHECK DE COHERENCIA

- No se rompe arquitectura hexagonal.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
