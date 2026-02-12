# 2026-02-12_seed_demo_coherence_tests

## 1. CONTEXTO
Se identificó riesgo de incoherencia en datos demo: perfiles de atleta sin datos clave o sin capacidades cuando existen tests completados. El objetivo de este cambio es blindar el comportamiento con tests automáticos de coherencia sobre el estado demo inicial y sobre el flujo de test completado/validado.

## 2. CAMBIOS REALIZADOS
- **Archivos modificados**:
  - `backend/tests/test_seed_demo_coherence.py` (nuevo)
  - `docs/changes/2026-02-12_seed_demo_coherence_tests.md` (nuevo)
- **Funciones añadidas**:
  - `_auth_headers`
  - `_login`
  - `_build_test_workout_payload`
  - `_create_completed_demo_attempt`
  - `test_seed_demo_profiles_have_required_core_data`
  - `test_seed_demo_athletes_with_completed_tests_have_capacities`
- **Funciones eliminadas**: ninguna.
- **Funciones modificadas**: ninguna.
- **Clases sustituidas**: ninguna.
- **Propiedades eliminadas o añadidas**: ninguna.
- **Cambios en contratos o DTOs**: ninguno.

## 3. IMPACTO EN EL DOMINIO
- **Atletas**: se valida que el atleta demo tenga perfil y membresía activa coherente.
- **Capacidades**: se valida que atletas demo con tests validados no queden sin capacidades.
- **Workouts**: se usa creación/publicación de workout de test para generar evidencia de coherencia.
- **Tests**: se añade cobertura específica de QA sobre seed/coherencia demo.
- **Ranking**: sin cambios directos de lógica; cobertura indirecta al usar attempt validado.
- **Persistencia**: sin cambios estructurales; validación en capa de tests contra servicio en memoria y endpoints.

## 4. ESTADO DE USO
- ✅ **EN USO** `test_seed_demo_profiles_have_required_core_data`: ejecutado por `pytest` en suite backend.
- ✅ **EN USO** `test_seed_demo_athletes_with_completed_tests_have_capacities`: ejecutado por `pytest` en suite backend.
- ✅ **EN USO** `_create_completed_demo_attempt`: helper interno utilizado por test de coherencia de capacidades.
- ✅ **EN USO** `_build_test_workout_payload`: helper interno utilizado por `_create_completed_demo_attempt`.
- ✅ **EN USO** `_login` y `_auth_headers`: helpers internos reutilizados por ambos escenarios.

## 5. RIESGO DE REFRACTOR FUTURO
- Acoplado a endpoints y credenciales demo (`admin/coach/athlete@local.com`); si cambia seed de identidades, los tests deben actualizarse.
- Puede requerir ajuste futuro si evoluciona el contrato de creación de workouts de test.
- No depende de legacy externo, pero sí del comportamiento vigente de validación de attempts.

## 6. CONTRATO EXTERNO AFECTADO
- **API**: no se modifica contrato, solo se consume en tests.
- **Respuesta frontend**: sin cambios.
- **Base de datos**: sin cambios de esquema.
- **Seeds**: sin cambios de implementación; se añade validación de coherencia sobre datos demo/flujo demo.

## 7. CHECK DE COHERENCIA
- ✅ No se rompe arquitectura hexagonal: el cambio está aislado en capa de tests y documentación.
- ✅ No se rompe separación dominio/aplicación/infrastructure.
- ✅ No se alteran invariantes de negocio; se fortalecen mediante pruebas automatizadas.
