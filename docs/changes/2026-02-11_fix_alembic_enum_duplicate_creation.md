# 1. CONTEXTO
El backend no arrancaba en Docker porque la migración inicial `0001_initial_schema` intentaba crear enums de PostgreSQL dos veces durante `alembic upgrade head`, provocando `DuplicateObjectError` y caída del contenedor backend.

# 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `backend/alembic/versions/0001_initial_schema.py`
- Funciones añadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - `upgrade()` (comportamiento efectivo): los enums declarados ahora usan `create_type=False` para evitar creación implícita al crear tablas.
  - `downgrade()` (comportamiento efectivo): mantiene drop explícito de enums sin cambios estructurales de flujo.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - Se añadió la propiedad `create_type=False` a todas las declaraciones `postgresql.ENUM`.
- Cambios en contratos o DTOs:
  - Ninguno.

# 3. IMPACTO EN EL DOMINIO
- Atletas: sin cambio funcional.
- Capacidades: sin cambio funcional.
- Workouts: sin cambio funcional.
- Tests: sin cambio funcional de reglas de negocio; solo estabilidad de inicialización de esquema.
- Ranking: sin cambio funcional.
- Persistencia: se corrige la idempotencia de creación de tipos enum en la migración inicial para permitir arranque correcto en entorno Docker.

# 4. ESTADO DE USO
- ✅ EN USO: `backend/alembic/versions/0001_initial_schema.py::upgrade` en startup del contenedor backend (ejecución de `alembic upgrade head`).
- ✅ EN USO: definiciones `postgresql.ENUM(..., create_type=False)` usadas por todas las tablas que referencian enums.
- ⚠️ EN TRANSICIÓN: ninguno.
- ❌ DEPRECADA: ninguna.
- 🗑 ELIMINADA: ninguna.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro: no, mientras exista la migración base.
- Depende de legacy: sí, depende del flujo actual de migraciones en arranque del contenedor.
- Está acoplado a otra capa: acoplado a Alembic/SQLAlchemy (infraestructura de persistencia).
- Requiere migración futura: no obligatoria; solo si se redefine la estrategia de creación de enums.

# 6. CONTRATO EXTERNO AFECTADO
- API: no.
- Respuesta frontend: no.
- Base de datos: sí, solo en bootstrap/migración (corrige error de creación duplicada de enum).
- Seeds: no.

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe.
- Separación dominio/aplicación/infrastructure: no se rompe; cambio aislado en infraestructura de migraciones.
- Invariantes de negocio: no se alteran.
