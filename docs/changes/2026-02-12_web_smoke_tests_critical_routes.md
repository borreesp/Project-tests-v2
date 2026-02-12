# 1. CONTEXTO
Se necesitaba implementar la base de smoke tests de navegación/render para rutas críticas de la app web Next.js (QA-006), cubriendo login, listado de tests de coach y flujo de builder de creación/edición, sin duplicar lógica de dominio.

# 2. CAMBIOS REALIZADOS
## Archivos modificados
- `apps/web/package.json`
- `package.json`

## Archivos añadidos
- `apps/web/playwright.config.ts`
- `apps/web/tests/smoke-routes.spec.ts`

## Funciones añadidas
- `mockApi(page: Page)` en `apps/web/tests/smoke-routes.spec.ts` para stub de endpoints UI/wiring durante smoke tests.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- Ninguna función de dominio/aplicación/infrastructure fue modificada.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- `apps/web/package.json`:
  - Script `test` actualizado para ejecutar Playwright.
  - Script `test:smoke` añadido para ejecutar la spec de rutas críticas.
  - `devDependencies` añade `@playwright/test`.

## Cambios en contratos o DTOs
- Ninguno.

# 3. IMPACTO EN EL DOMINIO
- Atletas:
  - Sin impacto en reglas de negocio.
- Capacidades:
  - Sin impacto.
- Workouts:
  - Sin impacto en cálculo/validación de dominio; solo cobertura de UI de rutas coach.
- Tests:
  - Se añade cobertura smoke sobre listado y builder, verificando wiring de render/navegación.
- Ranking:
  - Sin impacto.
- Persistencia:
  - Sin cambios en base de datos, modelos, migraciones o repositorios.

# 4. ESTADO DE USO
- ✅ EN USO
  - `apps/web/playwright.config.ts` como configuración de ejecución E2E/smoke para web.
  - `apps/web/tests/smoke-routes.spec.ts` con 4 escenarios smoke:
    - login
    - `/coach/workouts`
    - `/coach/workouts/new`
    - `/coach/workouts/[id]/edit`
- ⚠️ EN TRANSICIÓN
  - Dependencia de entorno con acceso a binarios/dependencias Playwright para ejecución local/CI.
- ❌ DEPRECADA (pero mantenida)
  - Ninguna.
- 🗑 ELIMINADA
  - Ninguna.

# 5. RIESGO DE REFRACTOR FUTURO
- Puede eliminarse en el futuro:
  - Stubs de API dentro de la spec podrían migrarse a fixtures compartidos si crece la suite.
- Depende de legacy:
  - No depende de lógica legacy de dominio.
- Está acoplado a otra capa:
  - Sí, los asserts están acoplados a labels/textos de UI y rutas actuales.
- Requiere migración futura:
  - Recomendable escalar hacia smoke + happy paths integrados con backend real en CI dedicada.

# 6. CONTRATO EXTERNO AFECTADO
- API:
  - No.
- Respuesta frontend:
  - No (solo validación automatizada de UI existente).
- Base de datos:
  - No.
- Seeds:
  - No.

# 7. CHECK DE COHERENCIA
- Arquitectura hexagonal:
  - No se rompe; solo se añade capa de tests de frontend.
- Separación dominio/aplicación/infrastructure:
  - Se mantiene; no se movió lógica entre capas.
- Invariantes de negocio:
  - No se alteran invariantes del dominio.
