# 2026-02-11_delete_test_endpoint

## 1. CONTEXTO
En `/coach/workouts` no existía una acción para eliminar tests obsoletos. Esto obligaba a conservar definiciones de test no deseadas y aumentaba ruido operativo para coaches. Se implementó eliminación segura de tests con bloqueo por resultados asociados.

## 2. CAMBIOS REALIZADOS
- **Archivos modificados**:
  - `backend/src/application/services/runtime_service.py`
  - `backend/src/application/dtos/coach.py`
  - `backend/src/adapters/inbound/http/routers/coach.py`
  - `backend/tests/test_api_flows.py`
  - `packages/sdk/src/api.ts`
  - `apps/web/app/coach/workouts/page.tsx`
- **Funciones añadidas**:
  - `RuntimeService.delete_workout(...)`
  - Endpoint HTTP `DELETE /api/v1/coach/workouts/{workout_id}`
  - Método SDK `deleteWorkout(workoutId)`
  - Handler frontend `onDelete(workout)`
- **Funciones eliminadas**: ninguna.
- **Funciones modificadas**:
  - Se amplió la importación/DTOs de coach para respuesta de borrado.
- **Clases sustituidas**: ninguna.
- **Propiedades eliminadas o añadidas**:
  - DTO nuevo `DeleteWorkoutResponseDTO` con `status`.
- **Cambios en contratos o DTOs**:
  - Nuevo contrato de respuesta para delete: `{ "status": "ok" }`.

## 3. IMPACTO EN EL DOMINIO
- **Atletas**: no pueden perder intentos accidentalmente; si existen attempts, el borrado se bloquea con `409`.
- **Capacidades**: sin impacto directo; no se recalculan capacidades por delete al estar bloqueado con attempts.
- **Workouts**: permite limpiar tests (`is_test=true`) sin resultados asociados.
- **Tests**: mejora ciclo de vida (alta/publicación/eliminación segura).
- **Ranking**: se eliminan leaderboards en memoria vinculados al test borrado para evitar referencias huérfanas.
- **Persistencia**: en este runtime in-memory se eliminan estructuras asociadas (`assignments`, `ideal_profiles`, `leaderboards`) junto al workout.

## 4. ESTADO DE USO
- ✅ **EN USO** `RuntimeService.delete_workout`: usado por `DELETE /api/v1/coach/workouts/{workout_id}`.
- ✅ **EN USO** endpoint delete en router coach: consumido por `webApi.deleteWorkout`.
- ✅ **EN USO** `webApi.deleteWorkout`: usado en la UI de `/coach/workouts`.
- ✅ **EN USO** `onDelete` en frontend: invocado desde botón `Eliminar` por fila.
- ❌ **DEPRECADA**: ninguna.
- 🗑 **ELIMINADA**: ninguna.

## 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse lógica in-memory específica cuando se migre totalmente a repositorios persistentes.
- Acoplado actualmente a estructuras internas de `RuntimeService`; conviene extraer a caso de uso/repositorio transaccional al crecer.
- Requiere migración futura para garantizar transacciones ACID reales en DB relacional.

## 6. CONTRATO EXTERNO AFECTADO
- **API**: sí, se añade `DELETE /api/v1/coach/workouts/{id}`.
- **Respuesta frontend**: sí, se maneja `409` con mensaje funcional para usuario.
- **Base de datos**: no aplica en este runtime in-memory; en implementación DB real deberá reflejar cascadas/constraints.
- **Seeds**: sin cambios.

## 7. CHECK DE COHERENCIA
- Se mantiene arquitectura hexagonal vigente del proyecto (router -> service -> DTO).
- No se rompe separación dominio/aplicación/infrastructure en la estructura actual.
- Se preservan invariantes de negocio: solo test (`is_test=true`), control de ownership/rol, y bloqueo por resultados asociados.
