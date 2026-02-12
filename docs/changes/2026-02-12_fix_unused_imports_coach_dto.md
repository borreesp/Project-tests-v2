## 1. CONTEXTO
El pipeline de CI fallaba en el lint de backend (`ruff`) por imports no usados en
`backend/src/application/dtos/coach.py` (`F401`), bloqueando el job antes de completar validaciones.

## 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `backend/src/application/dtos/coach.py`
  - `docs/changes/2026-02-12_fix_unused_imports_coach_dto.md`
- Funciones añadidas: ninguna.
- Funciones eliminadas: ninguna.
- Funciones modificadas: ninguna.
- Clases sustituidas: ninguna.
- Propiedades eliminadas o añadidas: ninguna.
- Cambios en contratos o DTOs: ninguno (solo limpieza de imports del modulo).
- Ajuste tecnico:
  - Se eliminan imports no usados:
    - `from datetime import datetime`
    - `MovementPattern`
    - `MovementUnit`

## 3. IMPACTO EN EL DOMINIO
- Atletas: sin impacto.
- Capacidades: sin impacto.
- Workouts: sin impacto.
- Tests: sin impacto en reglas de negocio.
- Ranking: sin impacto.
- Persistencia: sin impacto.

## 4. ESTADO DE USO
- Clases DTO en `backend/src/application/dtos/coach.py`:
  - ✅ EN USO (sin cambios funcionales, mantienen contrato actual).
- Imports `datetime`, `MovementPattern`, `MovementUnit` en ese modulo:
  - 🗑 ELIMINADA (no usados; limpieza para cumplir lint).

## 5. RIESGO DE REFRACTOR FUTURO
- Riesgo bajo; cambio cosmetico de mantenimiento.
- No depende de legacy.
- No introduce acoplamiento nuevo.
- No requiere migracion futura.

## 6. CONTRATO EXTERNO AFECTADO
- API: no.
- Respuesta frontend: no.
- Base de datos: no.
- Seeds: no.
- CI/Calidad: si, porque desbloquea el gate de lint backend.

## 7. CHECK DE COHERENCIA
- No se rompe arquitectura hexagonal.
- No se rompe separacion dominio/aplicacion/infrastructure.
- No se alteran invariantes de negocio.
