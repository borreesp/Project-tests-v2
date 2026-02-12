# 1. CONTEXTO

`apps/web/package.json` mantenía dependencias críticas con `latest` (Next/React/TypeScript/lint stack). Eso introduce no determinismo: CI puede romper por cambios upstream sin cambios en el repositorio.

Objetivo del cambio: fijar versiones exactas del core frontend usando `pnpm-lock.yaml` como fuente de verdad, manteniendo `preflight` en PASS.

# 2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `apps/web/package.json`
  - `pnpm-lock.yaml`
- Archivos añadidos:
  - `docs/changes/2026-02-12_pin-web-deps-from-lockfile.md`

- Funciones añadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - Ninguna (solo versionado de dependencias).
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - No aplica.
- Cambios en contratos o DTOs:
  - Ninguno.

Dependencias pinneadas desde lockfile (`apps/web` importer):
- `next`: `latest` -> `16.1.6`
- `react`: `latest` -> `19.2.4`
- `react-dom`: `latest` -> `19.2.4`
- `typescript`: `latest` -> `5.9.3`
- `eslint-config-next`: `latest` -> `16.1.6`
- `eslint`: `^9.22.0` -> `9.39.2`
- `@types/node`: `latest` -> `25.2.3`
- `@types/react`: `latest` -> `19.2.14`
- `@types/react-dom`: `latest` -> `19.2.3`

Notas:
- No se pinnearon en esta intervención todas las librerías auxiliares (`clsx`, `recharts`, etc.) para mantener diff mínimo, priorizando el core solicitado.

# 3. IMPACTO EN EL DOMINIO

- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: mejora de reproducibilidad en CI/local al fijar versiones críticas de frontend.
- Ranking: sin impacto funcional.
- Persistencia: sin impacto.

# 4. ESTADO DE USO

- Dependencias core pinneadas en `apps/web/package.json`:
  - ✅ EN USO.
- Especificadores `latest` para core frontend:
  - 🗑 ELIMINADOS para `next/react/react-dom/typescript/eslint-config-next` y tipos principales.

# 5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse en el futuro:
  - No aplica eliminación inmediata.
- Depende de legacy:
  - Depende del lockfile como referencia de versiones resueltas actuales.
- Está acoplado a otra capa:
  - Sí, tooling frontend (gestión de dependencias npm/pnpm).
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
