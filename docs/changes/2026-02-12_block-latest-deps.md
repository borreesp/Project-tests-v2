# 1. CONTEXTO

El monorepo permitía especificadores de dependencia con valor `"latest"` en múltiples `package.json` (apps y packages). Eso rompe reproducibilidad: una misma rama podía resolver versiones diferentes en distintos momentos y provocar fallos de CI sin cambios de código.

Objetivo: bloquear totalmente `latest` en monorepo y hacer que verify/preflight/CI fallen si reaparece, dejando versiones deterministas pinneadas desde `pnpm-lock.yaml`.

# 2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `scripts/verify.ps1`
  - `apps/web/package.json`
  - `apps/mobile/package.json`
  - `packages/sdk/package.json`
  - `packages/types/package.json`
  - `packages/ui-tokens/package.json`
  - `pnpm-lock.yaml`
- Archivos añadidos:
  - `scripts/check-no-latest-deps.ps1`
  - `docs/changes/2026-02-12_block-latest-deps.md`

- Funciones añadidas:
  - En `scripts/check-no-latest-deps.ps1`:
    - `Get-PackageJsonPaths`
    - `Get-RelativePath`
  - El script valida secciones `dependencies`, `devDependencies`, `peerDependencies`, `optionalDependencies` para todos los `package.json` en `apps/**`, `packages/**` y raíz.

- Funciones modificadas:
  - Flujo principal de `scripts/verify.ps1`:
    - Se añade ejecución obligatoria de política no-latest:
      - log: `Running no-latest dependency policy check...`
      - ejecución de `scripts/check-no-latest-deps.ps1`
      - fail inmediato si hay violaciones.

- Funciones eliminadas:
  - Ninguna.

- Clases sustituidas:
  - Ninguna.

- Propiedades eliminadas o añadidas:
  - No aplica.

- Cambios en contratos o DTOs:
  - Ninguno.

Dependencias pinneadas (`latest -> exact`) desde `pnpm-lock.yaml`:

- `apps/web/package.json`
  - `dependencies.class-variance-authority`: `latest` -> `0.7.1`
  - `dependencies.clsx`: `latest` -> `2.1.1`
  - `dependencies.lucide-react`: `latest` -> `0.563.0`
  - `dependencies.recharts`: `latest` -> `3.7.0`
  - `dependencies.tailwind-merge`: `latest` -> `3.4.0`

- `apps/mobile/package.json`
  - `dependencies.@react-navigation/bottom-tabs`: `latest` -> `7.13.0`
  - `dependencies.@react-navigation/native`: `latest` -> `7.1.28`
  - `dependencies.@react-navigation/native-stack`: `latest` -> `7.12.0`
  - `dependencies.expo-secure-store`: `latest` -> `15.0.8`
  - `dependencies.expo-status-bar`: `latest` -> `3.0.9`
  - `dependencies.react`: `latest` -> `19.2.4`
  - `dependencies.react-native`: `latest` -> `0.84.0`
  - `dependencies.react-native-gesture-handler`: `latest` -> `2.30.0`
  - `dependencies.react-native-safe-area-context`: `latest` -> `5.6.2`
  - `dependencies.react-native-screens`: `latest` -> `4.23.0`
  - `devDependencies.@types/react`: `latest` -> `19.2.14`
  - `devDependencies.typescript`: `latest` -> `5.9.3`

- `packages/sdk/package.json`
  - `devDependencies.typescript`: `latest` -> `5.9.3`
  - `devDependencies.vitest`: `latest` -> `4.0.18`

- `packages/types/package.json`
  - `devDependencies.typescript`: `latest` -> `5.9.3`

- `packages/ui-tokens/package.json`
  - `devDependencies.typescript`: `latest` -> `5.9.3`

Validación ejecutada:
- `pnpm -w install`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-no-latest-deps.ps1` -> `NO_LATEST_DEPS PASS`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\preflight.ps1` -> `OK TO OPEN PR` (PASS)

# 3. IMPACTO EN EL DOMINIO

- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: mejora de estabilidad de build/test al eliminar no determinismo de resolución de dependencias.
- Ranking: sin impacto funcional.
- Persistencia: sin cambios.

# 4. ESTADO DE USO

- `scripts/check-no-latest-deps.ps1`:
  - ✅ EN USO (invocado siempre desde `verify.ps1`).
- Política de tolerancia a `latest` en apps/packages/root:
  - 🗑 ELIMINADA como comportamiento permitido.
- Integración en `scripts/verify.ps1`:
  - ✅ EN USO en ejecución local y CI (vía preflight).

# 5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse en el futuro:
  - No recomendado; la política protege reproducibilidad.
- Depende de legacy:
  - Depende de estructura actual del monorepo (`apps/**`, `packages/**`, raíz).
- Está acoplado a otra capa:
  - Sí, capa de tooling/infra (gestión de dependencias y pipeline).
- Requiere migración futura:
  - No requiere migración de datos.

# 6. CONTRATO EXTERNO AFECTADO

- API: no cambia.
- Respuesta frontend: no cambia contrato funcional.
- Base de datos: no cambia.
- Seeds: no cambia.

# 7. CHECK DE COHERENCIA

- No se rompe arquitectura hexagonal.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
