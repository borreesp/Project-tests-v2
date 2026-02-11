# 1. CONTEXTO
Con backend levantado en Docker, los endpoints `/api/v1/me` y `/api/v1/movements` devolvían `500` por una incompatibilidad de runtime entre `passlib` y la versión de `bcrypt` resuelta automáticamente.

# 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `backend/pyproject.toml`
- Funciones añadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - Ninguna (cambio de dependencia de infraestructura).
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - Se añadió dependencia `bcrypt = "4.0.1"` para fijar versión compatible con `passlib[bcrypt]`.
- Cambios en contratos o DTOs:
  - Ninguno.

# 3. IMPACTO EN EL DOMINIO
- Atletas: sin cambio de reglas.
- Capacidades: sin cambio de reglas.
- Workouts: sin cambio de reglas.
- Tests: sin cambio de reglas.
- Ranking: sin cambio de reglas.
- Persistencia: sin cambios de esquema; mejora estabilidad de autenticación/hasheo en runtime.

# 4. ESTADO DE USO
- ✅ EN USO: `backend/pyproject.toml` dependencia `bcrypt=4.0.1` en build del contenedor backend.
- ⚠️ EN TRANSICIÓN: ninguno.
- ❌ DEPRECADA: ninguna.
- 🗑 ELIMINADA: ninguna.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro: sí, cuando `passlib` soporte oficialmente versiones nuevas de `bcrypt` sin errores.
- Depende de legacy: sí, depende del comportamiento actual de `passlib`.
- Está acoplado a otra capa: sí, capa de seguridad/autenticación (infraestructura).
- Requiere migración futura: potencialmente, al actualizar stack criptográfico.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia contrato.
- Respuesta frontend: no cambia shape.
- Base de datos: no.
- Seeds: no.

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe.
- Separación dominio/aplicación/infrastructure: no se rompe; cambio solo de dependencia.
- Invariantes de negocio: no se alteran.
