# QA-001 — Estándar de testing y convención obligatoria (repo-wide)

## Objetivo
Definir un estándar único de testing para Pulse que:

- asegure cobertura mínima por capa (backend, frontend y SDK),
- establezca convenciones de ubicación/naming,
- obligue tests al cambiar comportamiento,
- y habilite una revisión de PR consistente.

---

## 1) Pirámide de tests (obligatoria)

### 1.1 Unit tests (base de la pirámide)
- **Qué validan**: reglas puras de negocio y funciones aisladas.
- **Velocidad esperada**: muy rápida.
- **Dependencias externas**: prohibidas (sin DB, sin red, sin filesystem real salvo tmp aislado).
- **Alcance recomendado**:
  - entidades y value objects de dominio,
  - servicios de aplicación con dobles/mocks,
  - utilidades puras del frontend/SDK.

### 1.2 Integration tests (capa media)
- **Qué validan**: integración entre componentes reales (API + DB, repositorios, adapters).
- **Velocidad esperada**: media.
- **Dependencias externas**: permitidas en entorno aislado de tests.
- **Alcance recomendado**:
  - rutas FastAPI + SQLAlchemy + Alembic,
  - repositorios contra base de datos de tests,
  - flujos de autenticación/autorización clave.

### 1.3 E2E / smoke tests (capa superior)
- **Qué validan**: flujos críticos de usuario de punta a punta.
- **Velocidad esperada**: menor, ejecución selectiva.
- **Alcance recomendado**:
  - login + navegación por rol,
  - flujo crítico de atleta/coach,
  - endpoints críticos en secuencia realista.

### 1.4 Distribución objetivo
- **70% unit**, **20% integration**, **10% e2e/smoke** como guía pragmática.
- En MVP puede variar, pero se prioriza siempre más unit que integration/e2e.

---

## 2) Reglas por carpeta/capa

## 2.1 Backend

### `backend/src/domain/**`
- **Tipo de test requerido**: unit.
- **Ubicación**: `backend/tests/domain/**`.
- **Regla**: tests puros de invariantes; no importar infraestructura.

### `backend/src/application/**`
- **Tipo de test requerido**: unit (+ integration cuando orquesta múltiples adapters reales).
- **Ubicación**:
  - unit: `backend/tests/application/**`
  - integration: `backend/tests/integration/**`
- **Regla**: mock de puertos/repos para unit; usar dependencias reales sólo en integration.

### `backend/src/adapters/**` y `backend/src/infrastructure/**`
- **Tipo de test requerido**: integration.
- **Ubicación**: `backend/tests/integration/**`.
- **Regla**: cubrir contrato real de persistencia/API y mapping DTO↔dominio.

### `backend/alembic/**`
- **Tipo de test requerido**: integration.
- **Ubicación**: `backend/tests/integration/migrations/**`.
- **Regla**: toda migración nueva debe probar `upgrade` y, cuando aplique, `downgrade`.

## 2.2 Frontend web (`apps/web/**`)
- **Tipo de test requerido**: unit de componentes y smoke de rutas críticas.
- **Ubicación recomendada**:
  - `apps/web/tests/components/**`
  - `apps/web/tests/routes/**`
  - o co-localizado `*.test.ts(x)` junto al archivo si el módulo es pequeño.
- **Regla**: no duplicar lógica de dominio backend en tests frontend; validar render/estados/llamadas.

## 2.3 Mobile (`apps/mobile/**`)
- **Tipo de test requerido**: unit de componentes y navegación mínima smoke.
- **Ubicación recomendada**: `apps/mobile/tests/**`.

## 2.4 SDK (`packages/sdk/**`)
- **Tipo de test requerido**: unit + integración de cliente HTTP mockeado.
- **Ubicación**: `packages/sdk/tests/**`.

---

## 3) Convención de naming, fixtures y factories

## 3.1 Naming de archivos
- Python: `test_<comportamiento>.py`
  - Ejemplo: `test_ranking_updates_only_with_validated_attempts.py`
- TypeScript: `<module>.test.ts` o `<Component>.test.tsx`
  - Ejemplo: `workout-builder.test.tsx`

## 3.2 Naming de tests
- Patrón recomendado: `should_<resultado>_when_<condicion>`
  - Ejemplo: `should_reject_attempt_when_workout_is_not_test`

## 3.3 Fixtures
- Centralizar fixtures compartidas:
  - backend: `backend/tests/conftest.py`
  - frontend/mobile/sdk: `tests/fixtures/**`
- Fixtures deben ser **determinísticas**, pequeñas y explícitas.
- Evitar fixtures “mágicas” con demasiados defaults implícitos.

## 3.4 Factories
- Usar factories para creación de entidades/DTOs de test cuando haya repetición.
- Convención recomendada:
  - `make_<entity>()` para objetos en memoria,
  - `persist_<entity>()` para objetos guardados en DB.
- Toda factory debe permitir override de campos críticos.

---

## 4) Criterio obligatorio: qué cambios requieren tests

Todo PR que cambie comportamiento funcional debe añadir o actualizar tests.

## 4.1 **SIEMPRE** requieren tests
- Cambios en dominio (`domain/**`): entidades, value objects, reglas e invariantes.
- Cambios en servicios de aplicación (`application/**`) que alteren decisiones de negocio.
- Cambios de persistencia/modelos/migraciones (`adapters/outbound/persistence/**`, `alembic/**`).
- Cambios en endpoints/contratos (request/response DTOs, status codes, validaciones).
- Cambios de ranking, capacidades, attempts validados, `is_test=true`, coherencia de nivel/fill.
- Correcciones de bugs funcionales (el test debe reproducir el bug antes de corregirlo).

## 4.2 Pueden no requerir tests nuevos (pero sí revisar existentes)
- Cambios puramente de estilo/formato sin alterar comportamiento.
- Renombres internos sin impacto funcional, cubiertos por tests existentes.
- Refactors mecánicos sin cambio de contrato ni lógica (debe quedar evidencia en PR).

## 4.3 Política de aceptación
- Si cambia comportamiento y no hay tests, el PR **no está listo para merge**.

---

## 5) Cobertura mínima por tipo de cambio

- **Cambio de dominio**: al menos 1 unit test nuevo/modificado por regla alterada.
- **Cambio de API/persistencia**: al menos 1 integration test de camino feliz + 1 caso de error relevante.
- **Cambio en UI crítica**: al menos 1 test de componente/flujo afectado.
- **Bug fix**: 1 test que falle antes del fix y pase después.

---

## 6) Convención de ejecución en CI/local

Comandos de referencia (pueden evolucionar por repo):

- Backend: `cd backend && poetry run pytest`
- Web: `pnpm --filter @apps/web test` (si existe script)
- Mobile: `pnpm --filter @apps/mobile test` (si existe script)
- SDK: `pnpm --filter @packages/sdk test`

Regla CI:
- Ejecutar al menos backend + paquetes afectados por el PR.
- Bloquear merge si falla cualquier suite obligatoria del cambio.

---

## 7) Definición de Done (Testing)

Un cambio se considera completo cuando:

1. Tiene tests adecuados al nivel de impacto (unit/integration/e2e).
2. Los tests son determinísticos y pasan en local/CI.
3. No rompe arquitectura hexagonal (dominio no depende de infraestructura).
4. Si cambia contrato externo, hay test de contrato/API que lo cubra.

---

## 8) Checklist obligatorio para PR

- [ ] Identifiqué el tipo de cambio (dominio/aplicación/infra/UI).
- [ ] Añadí o actualicé tests correspondientes.
- [ ] Cubrí camino feliz y caso(s) de error relevantes.
- [ ] Si hubo bug fix, agregué test que lo reproduce.
- [ ] Verifiqué que no se duplica lógica de dominio en frontend.
- [ ] Documenté limitaciones/gaps de cobertura restantes.

---

## 9) Alcance y evolución

Este estándar aplica a todo el monorepo y debe actualizarse en cada cambio estructural del sistema de testing.
