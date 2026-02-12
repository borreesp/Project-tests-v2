# 1. CONTEXTO

Se había resuelto el error `ModuleNotFoundError: No module named 'src'` en tests de backend usando `PYTHONPATH=/app` global en la imagen Docker runtime. Aunque funcional, el objetivo era reducir esa dependencia global y adoptar una configuración más estándar para tests.

Durante la inspección se confirmó en `backend/pyproject.toml`:
- `package-mode = false`
- El proyecto no está configurado para instalarse como paquete propio en la imagen.

Por ello se eligió la opción mínima basada en configuración de pytest.

# 2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `docker/Dockerfile.backend`
- Archivos añadidos:
  - `backend/pytest.ini`
  - `docs/changes/2026-02-12_backend-packaging-for-tests.md`

- Funciones añadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - Ninguna.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - Se eliminó `PYTHONPATH=/app` del stage runtime en Docker.
- Cambios en contratos o DTOs:
  - Ninguno.

Detalle técnico:
- `docker/Dockerfile.backend`:
  - Antes: `ENV PYTHONUNBUFFERED=1 \ PYTHONPATH=/app`
  - Ahora: `ENV PYTHONUNBUFFERED=1`
- `backend/pytest.ini`:
  - Añadido `pythonpath = .` para que tests resuelvan `src` desde `/app` sin variable global de entorno.
  - Mantiene `asyncio_mode = auto`.

Validación puntual en contenedor:
- `PYTHONPATH` vacío (`PYTHONPATH=`).
- `pytest -q` en backend: PASS (10 tests).

# 3. IMPACTO EN EL DOMINIO

- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: mejora de estandarización de imports en entorno de pruebas.
- Ranking: sin impacto funcional.
- Persistencia: sin cambios.

# 4. ESTADO DE USO

- Configuración `backend/pytest.ini`:
  - ✅ EN USO para ejecución de tests backend en contenedor.
- `PYTHONPATH=/app` en runtime Docker:
  - ❌ DEPRECADA (eliminada como mecanismo principal para tests).

# 5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse en el futuro:
  - Sí, si el backend pasa a packaging formal instalable y pytest ya no requiere `pythonpath = .`.
- Depende de legacy:
  - Depende del layout actual del backend con código en `src/` bajo `/app`.
- Está acoplado a otra capa:
  - Sí, a infraestructura de tests/runner (pytest), no al dominio.
- Requiere migración futura:
  - No requiere migración de datos.

# 6. CONTRATO EXTERNO AFECTADO

- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambia.

# 7. CHECK DE COHERENCIA

- No se rompe arquitectura hexagonal.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
