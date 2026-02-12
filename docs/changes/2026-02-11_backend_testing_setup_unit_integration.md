# 1. CONTEXTO
Se requería una infraestructura de testing reproducible para backend (FastAPI/SQLAlchemy/Alembic) con separación de pruebas unitarias e integración, base de datos de tests aislada y validación explícita de migraciones en entorno de pruebas.

# 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `Makefile`
  - `README.md`
- Archivos añadidos:
  - `backend/pytest.ini`
  - `backend/tests/integration/conftest.py`
  - `backend/tests/integration/test_db_migrations.py`
  - `backend/tests/integration/test_api_smoke_flow.py`
  - `backend/tests/unit/test_settings.py`
  - `docker-compose.test.yml`
- Funciones añadidas:
  - `test_alembic_head_applied`
  - `test_create_athlete_workout_attempt_and_read_from_api`
  - `test_parse_cors_origins_from_comma_separated_string`
  - Helpers de tests en integración:
    - `_auth_headers`
    - `_login`
    - `_build_workout_payload`
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - Ninguna de dominio/aplicación/productiva.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - Ninguna en modelos de dominio/persistencia.
- Cambios en contratos o DTOs:
  - Ninguno.

# 3. IMPACTO EN EL DOMINIO
- Atletas: sin cambios de reglas de negocio; se añade cobertura de flujo básico por API.
- Capacidades: sin cambios de lógica; cobertura indirecta por flujo de intento.
- Workouts: sin cambios de lógica; cobertura de creación/publicación y consulta por API.
- Tests: mejora importante de infraestructura con marcadores `unit`/`integration`, DB de tests y validación de migraciones.
- Ranking: sin cambios de reglas.
- Persistencia: sin cambios de esquema; se valida aplicabilidad de Alembic en entorno de test aislado.

# 4. ESTADO DE USO
- ✅ EN USO: `backend/pytest.ini` para configuración y segmentación de suites.
- ✅ EN USO: `backend/tests/integration/conftest.py` para aplicar/revertir migraciones y limpiar tablas de integración.
- ✅ EN USO: `backend/tests/integration/test_db_migrations.py` para smoke de Alembic + tablas críticas.
- ✅ EN USO: `backend/tests/integration/test_api_smoke_flow.py` para flujo de salud API (athlete + workout + attempt + lectura).
- ✅ EN USO: `backend/tests/unit/test_settings.py` como base de suite unitaria sin dependencias externas.
- ✅ EN USO: `docker-compose.test.yml` para DB de integración aislada.
- ✅ EN USO: targets `test-backend-unit`, `test-backend-integration`, `test-backend` en `Makefile`.
- ⚠️ EN TRANSICIÓN: pruebas de API continúan sobre runtime service en memoria, mientras coexistencia con validación de infraestructura SQL/Alembic.
- ❌ DEPRECADA (pero mantenida): ninguna.
- 🗑 ELIMINADA: ninguna.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro: limpieza manual de tablas en fixture puede reemplazarse por transacciones por test.
- Depende de legacy: sí, parte de endpoints sigue apoyándose en runtime in-memory.
- Está acoplado a otra capa: integración acoplada a Docker/Postgres local para ejecución reproducible.
- Requiere migración futura: recomendable migrar progresivamente tests API a repositorios persistentes cuando se complete adopción SQL en runtime productivo.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia contrato.
- Respuesta frontend: no cambia.
- Base de datos: no cambia esquema; se añade verificación de migraciones en tests.
- Seeds: sin cambios.

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe; cambios orientados a test harness e infraestructura.
- Separación dominio/aplicación/infrastructure: se mantiene; no se movió lógica de dominio.
- Invariantes de negocio: no se alteran; sólo se añadió cobertura y tooling de pruebas.
