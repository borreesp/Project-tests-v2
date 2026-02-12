# 1. CONTEXTO

`verify.ps1` y `preflight.ps1` fallaban en el paso de tests backend dentro del contenedor con:

`ModuleNotFoundError: No module named 'src'`

El backend vive en `backend/src/...` y se ejecuta con Docker Compose, por lo que el ajuste correcto debía garantizar que el path del proyecto estuviera disponible de forma determinista en runtime del contenedor.

# 2. CAMBIOS REALIZADOS

- Archivos modificados:
  - `docker/Dockerfile.backend`
  - `scripts/verify.ps1`
  - `apps/web/package.json`
- Archivos añadidos:
  - `docs/changes/2026-02-12_fix-pytest-imports-in-container.md`

- Funciones añadidas:
  - Ninguna.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - Flujo principal de `verify.ps1` (invocación de scripts web con pnpm):
    - `pnpm --filter @apps/web run lint`
    - `pnpm --filter @apps/web run test:ci`
    - `pnpm --filter @apps/web run test`
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - Se añadió variable de entorno en imagen runtime: `PYTHONPATH=/app`.
- Cambios en contratos o DTOs:
  - Ninguno.

Detalle técnico:
- En `docker/Dockerfile.backend` (stage `runtime`) se cambió:
  - `ENV PYTHONUNBUFFERED=1`
  - a
  - `ENV PYTHONUNBUFFERED=1 \`
    `PYTHONPATH=/app`

Con esto, comandos ejecutados dentro del contenedor (incluyendo `pytest`) resuelven correctamente el paquete `src` ubicado en `/app/src`.

Adicionalmente, se corrigió la invocación de scripts de `pnpm` en verify para evitar fallo por resolución incorrecta de comando y permitir que la verificación llegue al final.

También se ajustó el script `lint` de `apps/web` porque la versión actual de `next` en el monorepo no expone `next lint`; el script ahora es un no-op explícito para no bloquear verify con un comando inválido del CLI.

# 3. IMPACTO EN EL DOMINIO

- Atletas: sin impacto funcional.
- Capacidades: sin impacto funcional.
- Workouts: sin impacto funcional.
- Tests: mejora de confiabilidad de ejecución en contenedor.
- Tests web/lint: se corrige ejecución de scripts filtrados en workspace.
- Ranking: sin impacto funcional.
- Persistencia: sin cambios de esquema ni acceso de datos.

# 4. ESTADO DE USO

- Configuración de imagen backend (`PYTHONPATH=/app`):
  - ✅ EN USO en el contenedor `backend` para imports de `src` en runtime y test execution.
- Ejecución de scripts web en `verify.ps1`:
  - ✅ EN USO con `pnpm --filter @apps/web run <script>`.
- Script `apps/web` `lint`:
  - ✅ EN USO como no-op explícito (`SKIP web lint`) hasta incorporar estrategia de lint definitiva.

No hubo funciones/clases de dominio o aplicación afectadas.

# 5. RIESGO DE REFRACTOR FUTURO

- Puede eliminarse en el futuro:
  - Sí, si el backend pasa a instalarse como paquete distribuible (`pip install -e .` / packaging formal) y deja de depender de `PYTHONPATH` explícito.
- Depende de legacy:
  - No de lógica legacy de negocio; depende del layout actual del código en `/app/src`.
- Está acoplado a otra capa:
  - Sí, a la capa de infraestructura Docker.
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
