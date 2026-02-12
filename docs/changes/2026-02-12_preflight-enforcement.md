# 1. CONTEXTO
Se necesitaba establecer una compuerta única de validación previa (`preflight`) y endurecer la política operativa para impedir apertura de PR o push final sin validación explícita en estado PASS.

Objetivo:
- Proveer comando único de preflight.
- Formalizar regla obligatoria en `AGENTS.md`.
- Exigir reporte de cierre con estado PASS/FAIL y detalle de checks.

# 2. CAMBIOS REALIZADOS
## Archivos modificados
- `AGENTS.md`

## Archivos añadidos
- `scripts/preflight.ps1`
- `docs/changes/2026-02-12_preflight-enforcement.md`

## Funciones añadidas
- En `scripts/preflight.ps1`:
  - Flujo principal de preflight que ejecuta `verify.ps1`.
  - Mensaje final `OK TO OPEN PR` cuando `verify.ps1` termina en PASS.
  - Salida con `exit 1` cuando `verify.ps1` falla o no existe.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- No aplica en código de dominio/aplicación; se modifica gobernanza operativa en `AGENTS.md`.

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
- Tests: sin impacto de negocio.
- Ranking: sin impacto.
- Persistencia: sin cambios.

# 4. ESTADO DE USO
- ✅ EN USO
  - `scripts/preflight.ps1` como comando único de validación previa.
  - Regla de bloqueo de PR/push final en `AGENTS.md`.
  - Bloque de cierre obligatorio con reporte PASS/FAIL y checks ejecutados/skipped.
- ⚠️ EN TRANSICIÓN
  - Ninguno.
- ❌ DEPRECADA (pero mantenida)
  - Práctica informal de validar sin preflight explícito.
- 🗑 ELIMINADA
  - Ninguna pieza de código eliminada.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro:
  - `preflight.ps1` solo si se reemplaza por un wrapper único equivalente.
- Depende de legacy:
  - Sí, depende de la existencia y resultado de `verify.ps1`.
- Está acoplado a otra capa:
  - Acoplado a tooling operativo (PowerShell + scripts del repo).
- Requiere migración futura:
  - No obligatoria; solo ajuste si cambia el comando de verificación canónico.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambian.
- Proceso de entrega: sí cambia (bloqueo explícito de PR/push sin preflight PASS).

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe (cambio en capa de automatización y gobernanza de contribución).
- Separación dominio/aplicación/infrastructure: intacta.
- Invariantes de negocio: no se alteran.
