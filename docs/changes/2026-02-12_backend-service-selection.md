# 1. CONTEXTO
En `scripts/verify.ps1`, la detección del servicio backend usaba prioridad por nombre `backend` y luego el primer match por regex `backend|api`, lo que podía seleccionar servicios incorrectos en stacks grandes (por ejemplo `api-gateway`, `worker-api`) por orden de aparición.

Objetivo:
- Hacer determinista la selección del servicio backend.
- Permitir override explícito por entorno.
- Fallar de forma guiada cuando haya ambigüedad.

# 2. CAMBIOS REALIZADOS
## Archivos modificados
- `scripts/verify.ps1`

## Archivos añadidos
- `docs/changes/2026-02-12_backend-service-selection.md`

## Funciones añadidas
- Ninguna nueva.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- `Get-BackendService`:
  - Añade soporte de override con `BACKEND_SERVICE`.
  - Si `BACKEND_SERVICE` existe y no coincide con servicios de compose, falla y lista servicios disponibles.
  - Sin override, aplica prioridad determinista:
    - exacto `backend`
    - exacto `api`
    - contiene `backend` (case-insensitive)
    - contiene `api` (case-insensitive)
  - Si hay múltiples candidatos en fases `contains`, falla con mensaje de ambigüedad y pide definir `BACKEND_SERVICE`.
  - Añade logs:
    - `Detected compose services: ...`
    - `Ambiguous backend service candidates: ...`
    - y se mantiene log de uso final: `Using backend service: ...` en flujo principal.

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
- Tests: sin impacto en lógica de negocio.
- Ranking: sin impacto.
- Persistencia: sin cambios en esquema o datos.

# 4. ESTADO DE USO
- ✅ EN USO
  - Selección determinista del servicio backend en `scripts/verify.ps1`.
  - Override operativo por `BACKEND_SERVICE`.
- ⚠️ EN TRANSICIÓN
  - Ninguno.
- ❌ DEPRECADA (pero mantenida)
  - Detección previa basada en “primer match” por orden implícito.
- 🗑 ELIMINADA
  - No se elimina código histórico en esta intervención.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro:
  - Fase de detección por contains si se estandariza un único nombre de servicio backend.
- Depende de legacy:
  - Sí, depende del naming de servicios en `docker compose`.
- Está acoplado a otra capa:
  - Acoplado a infraestructura de compose y variables de entorno.
- Requiere migración futura:
  - No obligatoria; solo ajustes si cambian convenciones de nombres de servicios.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambian.
- Tooling/automatización: sí cambia (resolución de servicio backend más estricta y predecible).

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe (cambio en script operativo).
- Separación dominio/aplicación/infrastructure: intacta.
- Invariantes de negocio: no se alteran.
