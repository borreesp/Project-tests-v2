# 1. CONTEXTO
Los logins de prueba devolvían `422 Unprocessable Entity` porque los correos con dominio `.test` eran rechazados por la validación de email en DTOs/Pydantic. Se requiere usar dominios válidos para los usuarios seeded/default.

# 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `backend/src/application/services/runtime_service.py`
  - `backend/src/infrastructure/db/seed.py`
  - `backend/tests/test_api_flows.py`
- Funciones añadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - `RuntimeService._seed_defaults`: correos por defecto cambiados de `@local.test` a `@local.com`.
  - `run_seed`: salida informativa de usuarios actualizada a `@local.com`.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - Ninguna propiedad de modelo.
- Cambios en contratos o DTOs:
  - Ninguno.

# 3. IMPACTO EN EL DOMINIO
- Atletas: el usuario atleta de prueba ahora usa `athlete@local.com`.
- Capacidades: sin cambios.
- Workouts: sin cambios.
- Tests: los tests de API usan emails `.com` para reflejar datos válidos.
- Ranking: sin cambios.
- Persistencia: los seeds/upserts de usuarios base pasan a `.com`.

# 4. ESTADO DE USO
- ✅ EN USO: `RuntimeService._seed_defaults` en arranque del backend para datos iniciales en memoria.
- ✅ EN USO: `run_seed` para poblar PostgreSQL con usuarios de prueba.
- ✅ EN USO: `backend/tests/test_api_flows.py` para validación de flujos auth/invite/workout.
- ⚠️ EN TRANSICIÓN: ninguno.
- ❌ DEPRECADA (pero mantenida): ninguna.
- 🗑 ELIMINADA: ninguna.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro: no aplica.
- Depende de legacy: mínimo; depende de credenciales hardcodeadas de entorno dev.
- Está acoplado a otra capa: sí, acoplado a validación de DTOs y datos de semilla.
- Requiere migración futura: no.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia endpoints ni shape, cambia credencial esperada para pruebas.
- Respuesta frontend: no.
- Base de datos: no cambia esquema.
- Seeds: sí, correos de usuarios base pasan a `.com`.

# 7. CHECK DE COHERENCIA
- No se rompe arquitectura hexagonal.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
