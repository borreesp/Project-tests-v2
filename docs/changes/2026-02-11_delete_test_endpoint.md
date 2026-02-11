# 2026-02-11_delete_test_endpoint

## 1. CONTEXTO
En `/coach/workouts` faltaba la acción para eliminar tests obsoletos. Esto impedía limpiar datos de prueba y forzaba a mantener tests sin uso. Se implementa una eliminación segura con confirmación en frontend y bloqueo en backend cuando existen attempts asociados.

## 2. CAMBIOS REALIZADOS
- **Archivos modificados**
  - `backend/src/application/dtos/coach.py`
  - `backend/src/application/services/runtime_service.py`
  - `backend/src/adapters/inbound/http/routers/coach.py`
  - `backend/tests/test_api_flows.py`
  - `packages/types/src/dtos.ts`
  - `packages/sdk/src/api.ts`
  - `apps/web/app/coach/workouts/page.tsx`
- **Funciones añadidas**
  - `RuntimeService.delete_workout(current_user, workout_id)`
  - `delete_workout` (handler HTTP en router coach)
  - `onDelete(workoutId)` (frontend)
  - `getDeleteErrorMessage(err)` (frontend)
- **Funciones modificadas**
  - `createApi(...)` en SDK para exponer `deleteWorkout(workoutId)`
- **Funciones eliminadas**
  - Ninguna
- **Clases sustituidas**
  - Ninguna
- **Propiedades eliminadas o añadidas**
  - Se añade DTO `DeleteWorkoutResponseDTO` con `status: "ok"`
- **Cambios en contratos o DTOs**
  - Nuevo endpoint `DELETE /api/v1/coach/workouts/{workout_id}`
  - Nuevo contrato de respuesta de borrado en backend y `packages/types`

## 3. IMPACTO EN EL DOMINIO
- **Atletas**
  - No se alteran perfiles ni métricas de atletas.
  - Si existe cualquier attempt del test, el borrado queda bloqueado con `409`.
- **Capacidades**
  - Sin cambios directos; no se recalculan capacidades al bloquear borrado con attempts.
- **Workouts**
  - Se permite eliminar únicamente workouts `is_test=true`.
  - Se elimina también su asignación e ideal profiles relacionadas para evitar referencias colgantes en memoria.
- **Tests**
  - Se habilita ciclo de vida completo: crear, editar, duplicar, publicar y eliminar.
- **Ranking**
  - Se limpian leaderboards del workout eliminado cuando no tiene attempts.
- **Persistencia**
  - En este proyecto in-memory se limpia estado relacionado (`assignments`, `ideal_profiles`, `leaderboards`) antes de eliminar workout.

## 4. ESTADO DE USO
- ✅ **EN USO** `RuntimeService.delete_workout` (invocado por `DELETE /api/v1/coach/workouts/{workout_id}`)
- ✅ **EN USO** endpoint `DELETE /api/v1/coach/workouts/{workout_id}` (consumido por SDK y frontend)
- ✅ **EN USO** `webApi.deleteWorkout` (usado en listado `/coach/workouts`)
- ✅ **EN USO** botón `Eliminar` + confirmación en `apps/web/app/coach/workouts/page.tsx`
- ❌ **DEPRECADA** ninguna
- 🗑 **ELIMINADA** ninguna

## 5. RIESGO DE REFRACTOR FUTURO
- El borrado está acoplado al almacenamiento in-memory de `RuntimeService`; en migración a DB real requerirá transacción SQL explícita.
- La regla de bloqueo por attempts (`409`) puede evolucionar a borrado en cascada bajo feature flag si negocio lo requiere.
- El mensaje de error de conflicto se usa en frontend para UX; conviene estandarizar códigos de error de dominio para evitar acoplamiento a texto.

## 6. CONTRATO EXTERNO AFECTADO
- **API**: Sí, se añade `DELETE /api/v1/coach/workouts/{workout_id}`.
- **Respuesta frontend**: Sí, nuevo flujo de eliminación con refresh y notice de éxito; manejo específico de `409`.
- **Base de datos**: No aplica aún (runtime in-memory), pero la semántica de cascada lógica queda definida para futura persistencia real.
- **Seeds**: Sin cambios.

## 7. CHECK DE COHERENCIA
- Se mantiene arquitectura hexagonal: endpoint (inbound) delega en caso de uso de aplicación (`RuntimeService`).
- Se mantiene separación dominio/aplicación/infrastructure existente del proyecto.
- No se alteran invariantes de negocio: no se permite borrar workouts no-test, ni tests con attempts, ni tests de otro coach (salvo ADMIN).
