# 1. CONTEXTO
Se detectó riesgo de falsos positivos en la verificación de readiness del backend en `scripts/verify.ps1`, porque se aceptaban como señal de listo endpoints auxiliares (`/docs` y `/openapi.json`) aunque `/health` ya existe en el backend.

Objetivo:
- Priorizar `/health` como señal principal de readiness.
- Usar `/openapi.json` solo como fallback cuando `/health` no esté disponible tras una ventana corta.
- Excluir `/docs` como señal de readiness.

# 2. CAMBIOS REALIZADOS
## Archivos modificados
- `scripts/verify.ps1`

## Archivos añadidos
- `docs/changes/2026-02-12_harden-backend-readiness.md`

## Funciones añadidas
- Ninguna función global nueva.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- `Wait-BackendReady`:
  - Mantiene soporte de `BACKEND_BASE_URL` y `BACKEND_READY_TIMEOUT_SECONDS`.
  - Cambia la lógica HTTP de readiness:
    - Primero sondea `/health`.
    - Si `/health` devuelve `200`, marca ready y retorna.
    - Si `/health` no está disponible de forma consistente en una ventana corta (404/no respuesta), habilita fallback a `/openapi.json`.
    - Se elimina `/docs` como criterio de readiness.
  - Añade logs explícitos:
    - `Probing /health...`
    - `/health OK → backend ready`
    - `/health not available → fallback to /openapi.json`

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- Ninguna.

## Cambios en contratos o DTOs
- Ninguno.

# 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: sin impacto en reglas de negocio.
- Ranking: sin impacto funcional.
- Persistencia: sin cambios.

# 4. ESTADO DE USO
- ✅ EN USO
  - `Wait-BackendReady` actualizado en `scripts/verify.ps1`.
- ⚠️ EN TRANSICIÓN
  - Ninguno.
- ❌ DEPRECADA (pero mantenida)
  - Lógica anterior que consideraba `/docs` como señal de readiness queda deprecada y removida en esta intervención.
- 🗑 ELIMINADA
  - Ruta `/docs` como fallback de readiness en `Wait-BackendReady`.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro:
  - Fallback de `/openapi.json` si el stack garantiza `/health` en todos los servicios backend.
- Depende de legacy:
  - Sí, mantiene fallback por compatibilidad ante entornos sin `/health`.
- Está acoplado a otra capa:
  - Acoplado a infraestructura de ejecución local/CI y a disponibilidad HTTP del backend.
- Requiere migración futura:
  - No obligatoria. Solo ajustar si cambia el endpoint estándar de salud.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia el contrato funcional de negocio.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambian.
- Tooling/automatización: sí cambia (criterio de readiness del script de verificación).

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe (cambio en script operativo, no en capas de dominio/aplicación/infra de negocio).
- Separación dominio/aplicación/infrastructure: se mantiene.
- Invariantes de negocio: no se alteran.
