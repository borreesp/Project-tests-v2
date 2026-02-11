# 1. CONTEXTO
Se necesitaba que backend y PostgreSQL levantaran con un único comando `docker compose up`, sin pasos manuales, con conexión por hostname de servicio, persistencia y orden correcto de arranque.

# 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `docker-compose.yml`
  - `docker/Dockerfile.backend`
- Funciones añadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - Ninguna función de aplicación; se modificó orquestación y comando de arranque del contenedor backend.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - En `docker-compose.yml`:
    - Servicio `db` con imagen oficial `postgres:16`.
    - Variables `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`.
    - Volumen persistente `postgres_data`.
    - `depends_on` para backend con condición de healthcheck.
    - `DATABASE_URL` de backend apuntando a `db` (sin `localhost`).
    - `CORS_ORIGINS` en formato JSON parseable por `pydantic-settings`.
  - En `docker/Dockerfile.backend`:
    - `CMD` para ejecutar migraciones (`alembic upgrade head`) y luego `uvicorn`.
- Cambios en contratos o DTOs:
  - Ninguno.

# 3. IMPACTO EN EL DOMINIO
- Atletas: sin cambios de reglas.
- Capacidades: sin cambios de reglas.
- Workouts: sin cambios de reglas.
- Tests: sin cambios de reglas.
- Ranking: sin cambios de reglas.
- Persistencia: mejora de arranque y disponibilidad de PostgreSQL + aplicación de migraciones al iniciar backend.

# 4. ESTADO DE USO
- ✅ EN USO: `docker-compose.yml` en arranque local con `docker compose up`.
- ✅ EN USO: `docker/Dockerfile.backend` como build del servicio backend.
- ⚠️ EN TRANSICIÓN: ninguno.
- ❌ DEPRECADA: ninguna.
- 🗑 ELIMINADA: ninguna.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro: la parte de `alembic upgrade head` en `CMD` podría migrarse a un entrypoint dedicado.
- Depende de legacy: depende del layout actual del repositorio (`backend/` + Dockerfile en `docker/`).
- Está acoplado a otra capa: acoplado a infraestructura Docker y a Alembic.
- Requiere migración futura: posible ajuste si se agregan más servicios (cache/worker) o estrategia de despliegue distinta.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia esquema; cambia forma de inicialización/arranque.
- Seeds: sin cambios directos.

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe.
- Separación dominio/aplicación/infrastructure: no se rompe; cambios en capa de infraestructura/deploy.
- Invariantes de negocio: no se alteran.
