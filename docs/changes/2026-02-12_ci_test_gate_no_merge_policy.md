# 1. CONTEXTO
Se necesitaba implementar un gate de CI que ejecute lint y suites de tests de backend + web para bloquear merges con calidad insuficiente, y documentar explícitamente la política de “no merge sin tests” con un umbral mínimo inicial y plan de crecimiento.

# 2. CAMBIOS REALIZADOS
- Archivos modificados:
  - `.github/workflows/ci.yml`
  - `apps/web/package.json`
- Archivos añadidos:
  - `apps/web/vitest.config.ts`
  - `apps/web/vitest.setup.ts`
  - `apps/web/tests/role-tabs.test.tsx`
  - `docs/policy/no-merge-without-tests.md`
- Funciones añadidas:
  - Ninguna en backend.
  - Se añade función de test `renders role labels for coach and athlete` en `apps/web/tests/role-tabs.test.tsx`.
- Funciones eliminadas:
  - Ninguna.
- Funciones modificadas:
  - Ninguna función de dominio/aplicación backend.
- Clases sustituidas:
  - Ninguna.
- Propiedades eliminadas o añadidas:
  - No hay cambios de modelos de dominio ni persistencia.
- Cambios en contratos o DTOs:
  - Ninguno.

# 3. IMPACTO EN EL DOMINIO
- Atletas: sin cambios funcionales directos; mejora indirecta por mayor control de regresiones.
- Capacidades: sin cambios de cálculo ni persistencia.
- Workouts: sin cambios en reglas de negocio.
- Tests: mejora del marco de validación automática (CI + test web básico).
- Ranking: sin cambios de lógica.
- Persistencia: sin cambios de esquema, migraciones ni seeds.

# 4. ESTADO DE USO
- ✅ EN USO:
  - Workflow CI (`.github/workflows/ci.yml`) en push/pull_request.
  - Test web `apps/web/tests/role-tabs.test.tsx` ejecutado por `pnpm --filter @apps/web test`.
  - Política de calidad en `docs/policy/no-merge-without-tests.md`.
- ⚠️ EN TRANSICIÓN:
  - Umbral mínimo de web tests inicia con suite básica y queda planificado su crecimiento.
- ❌ DEPRECADA:
  - Ninguna.
- 🗑 ELIMINADA:
  - Ninguna.

# 5. RIESGO DE REFRACTOR FUTURO
- El split actual backend unit/integration por archivo puede evolucionar a markers explícitos de pytest.
- La suite web inicial es mínima y requiere expansión gradual para reducir falsos verdes.
- El gate depende de mantener scripts de lint/test consistentes por paquete.

# 6. CONTRATO EXTERNO AFECTADO
- API: no cambia.
- Respuesta frontend: no cambia.
- Base de datos: no cambia.
- Seeds: no cambia.

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal: no se rompe; no hay cambios en límites de capa.
- Separación dominio/aplicación/infrastructure: intacta; cambios concentrados en CI/testing y documentación.
- Invariantes de negocio: no se alteran.
