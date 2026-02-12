# 1. CONTEXTO
Se necesitaba un flujo único de verificación repo-wide para el monorepo (backend FastAPI en Docker + web Next.js con pnpm) y enforcement automático de la regla de documentación obligatoria en `docs/changes` definida en `AGENTS.md`, tanto en local como en CI.

# 2. CAMBIOS REALIZADOS
## Archivos modificados
- `.github/workflows/ci.yml`
- `README.md`

## Archivos añadidos
- `scripts/verify.sh`
- `scripts/check-docs-changes.sh`
- `docs/changes/2026-02-12_verify-script-and-docs-enforcement.md`

## Funciones añadidas
- `scripts/verify.sh`:
  - `log`
  - `warn`
  - `fail`
  - `require_command`
  - `service_exists`
  - `detect_backend_service`
  - `wait_for_backend_ready`
  - `run_backend_tests`
  - `web_script_exists`
  - `cleanup`
- `scripts/check-docs-changes.sh`:
  - `log`
  - `fail`
  - `determine_diff_range`
  - `is_code_file`

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- No aplica (se añadieron scripts nuevos).

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- Ninguna en modelos de dominio o persistencia.

## Cambios en contratos o DTOs
- Ninguno.

## Detalle técnico relevante
- `scripts/verify.sh` ahora:
  - Valida herramientas mínimas (`docker`, `docker compose`, `pnpm`).
  - Verifica conectividad al daemon Docker antes de ejecutar compose.
  - Levanta stack con `docker compose up -d --build`.
  - Espera readiness del backend por healthcheck de contenedor o sondeo HTTP (`/health`, `/docs`, `/openapi.json`).
  - Ejecuta tests backend priorizando `docker compose exec -T backend pytest` cuando existe servicio `backend`; si no, detecta servicio con `backend|api`.
  - Ejecuta fallback `poetry run pytest` cuando `pytest` no está disponible en el contenedor y deja mensaje de comando sugerido.
  - Ejecuta verificación web (`lint`, `test` o `test:ci`) según scripts reales en `apps/web/package.json`.
  - Ejecuta `scripts/check-docs-changes.sh`.
  - Hace `docker compose down --remove-orphans` al finalizar salvo `KEEP_DOCKER_UP=1`.
- `scripts/check-docs-changes.sh` ahora:
  - Calcula diff contra base en CI (`GITHUB_BASE_REF`) o local (`origin/main` y fallback `HEAD~1`).
  - En local con cambios sin commit, evalúa `HEAD + working tree` para evitar falsos positivos contra commits previos.
  - Detecta cambios de código en backend/apps/packages/migrations.
  - Exige al menos un archivo nuevo `docs/changes/YYYY-MM-DD_*.md` cuando hay cambios de código.
  - Valida presencia de secciones obligatorias del documento técnico.

# 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: sin impacto en lógica de scoring/validación de negocio.
- Ranking: sin impacto funcional.
- Persistencia: sin cambios en esquemas, migraciones de datos ni repositorios.

# 4. ESTADO DE USO
- ✅ EN USO
  - `.github/workflows/ci.yml`: job `verify` ejecuta `bash scripts/verify.sh`.
  - `scripts/verify.sh`: script principal de verificación local/CI.
  - `scripts/check-docs-changes.sh`: enforcement de documentación obligatoria.
  - `README.md`: sección `Verification` con comandos oficiales.
- ⚠️ EN TRANSICIÓN
  - Ninguno.
- ❌ DEPRECADA (pero mantenida)
  - Ninguna.
- 🗑 ELIMINADA
  - Ninguna.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro:
  - Lógica de fallback para detección de base diff (`HEAD~1`) si se estandariza un flujo único de CI con base siempre disponible.
- Depende de legacy:
  - Sí, depende de convención de nombres de servicio compose (`backend` o regex `backend|api`).
- Está acoplado a otra capa:
  - Acoplado a tooling de infraestructura (`docker compose`, `pnpm`, `git`) y scripts declarados en `apps/web/package.json`.
- Requiere migración futura:
  - No obligatoria, pero si cambian rutas/stack del monorepo se debe ajustar patrón de detección de archivos de código.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambian.
- CI/automatización: sí cambia (nuevo pipeline de verificación unificado y enforcement de documentación).

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe; los cambios están en tooling/infraestructura de desarrollo y CI.
- Separación dominio/aplicación/infrastructure: no se altera; no se movió lógica de negocio entre capas.
- Invariantes de negocio: no se alteran; no hay cambios en reglas de dominio ni contratos funcionales del backend/web.
