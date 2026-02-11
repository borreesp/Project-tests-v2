# 2026-02-11_delete_test_button_workouts_list

## 1. CONTEXTO
En el listado `/coach/workouts` no existía una acción de eliminación de tests, por lo que los coaches no podían limpiar tests obsoletos desde la interfaz. Se requería habilitar eliminación segura, con confirmación explícita y validación de integridad cuando existen attempts asociados.

## 2. CAMBIOS REALIZADOS
- **Archivos modificados**
  - `backend/src/application/dtos/coach.py`
  - `backend/src/application/dtos/__init__.py`
  - `backend/src/adapters/inbound/http/routers/coach.py`
  - `backend/src/application/services/runtime_service.py`
  - `backend/tests/test_api_flows.py`
  - `packages/types/src/dtos.ts`
  - `packages/sdk/src/api.ts`
  - `apps/web/app/coach/workouts/page.tsx`
- **Funciones añadidas**
  - `delete_workout(...)` en router coach (endpoint `DELETE /api/v1/coach/workouts/{workout_id}`)
  - `delete_workout(...)` en `RuntimeService`
  - `deleteWorkout(workoutId)` en SDK web
- **Funciones modificadas**
  - Flujo de UI del listado de workouts para incorporar acción `Eliminar`, modal de confirmación y refresco de listado.
- **Clases/DTOs añadidos**
  - `DeleteWorkoutResponseDTO` en backend.
  - `DeleteWorkoutResponseDTO` en `packages/types`.
- **Contratos modificados**
  - Se amplía contrato API de coach con endpoint `DELETE /coach/workouts/{id}` y respuesta `{ status: "ok" }`.

## 3. IMPACTO EN EL DOMINIO
- **Atletas**: no se alteran atletas directamente. Si un test tiene attempts, no se permite eliminación (409), protegiendo historial de resultados.
- **Capacidades**: no hay recalculado directo durante el borrado; el bloqueo por attempts evita inconsistencias históricas.
- **Workouts**: se habilita eliminación solo para `is_test=true` y con control de permisos (ADMIN o coach autor).
- **Tests**: mejora de ciclo de vida de tests borradores/obsoletos sin resultados.
- **Ranking**: se eliminan entradas de leaderboard en memoria ligadas al workout eliminado para evitar referencias huérfanas.
- **Persistencia**: se elimina workout y entidades relacionadas en memoria (`assignments`, `ideal_profiles`, `leaderboards`) dentro de una sección crítica bloqueada por lock del servicio.

## 4. ESTADO DE USO
- `RuntimeService.delete_workout`
  - ✅ **EN USO** por `DELETE /api/v1/coach/workouts/{workout_id}`.
- `delete_workout` (router coach)
  - ✅ **EN USO** por frontend en `webApi.deleteWorkout`.
- `webApi.deleteWorkout`
  - ✅ **EN USO** desde `/coach/workouts` al confirmar modal.
- Acción UI “Eliminar” y modal
  - ✅ **EN USO** en cada fila del listado de tests.
- Elementos de flujo reemplazados/deprecados
  - No hay elementos deprecados ni eliminados en este cambio.

## 5. RIESGO DE REFRACTOR FUTURO
- El borrado está acoplado a estructuras en memoria de `RuntimeService`; al migrar a repositorios SQL reales, deberá implementarse transacción DB explícita.
- La estrategia actual bloquea borrado con attempts (segura). Si producto requiere cascada de attempts/resultados, deberá añadirse migración y política de auditoría.
- El modal está implementado a nivel de página; podría extraerse a componente reutilizable si se repite patrón.

## 6. CONTRATO EXTERNO AFECTADO
- **API**: ✅ Sí. Nuevo endpoint `DELETE /api/v1/coach/workouts/{id}`.
- **Respuesta frontend**: ✅ Sí. Nuevo flujo de eliminación con feedback de éxito y manejo de 409.
- **Base de datos/persistencia**: ⚠️ Parcial en runtime actual (almacenamiento en memoria), sin migraciones SQL en este cambio.
- **Seeds**: ❌ No cambia.

## 7. CHECK DE COHERENCIA
- ✅ No se rompe arquitectura hexagonal: el endpoint delega en caso de uso (`RuntimeService`) y mantiene separación de capas.
- ✅ No se rompe separación dominio/aplicación/infrastructure: la lógica de autorización y consistencia permanece en application service.
- ✅ No se alteran invariantes de negocio: solo se elimina `is_test=true`, con control de ownership/rol y bloqueo cuando existen resultados asociados.
