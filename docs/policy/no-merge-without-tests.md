# Política CI: no merge sin tests

## Objetivo
Bloquear merges que no cumplan validaciones mínimas de calidad en backend y web.

## Gate obligatorio en CI
El workflow `CI` debe pasar completo para permitir merge:

1. **Backend lint**: `ruff check src tests`.
2. **Backend unit tests**: `pytest tests/test_health.py -q`.
3. **Backend integration tests**: `pytest tests/test_api_flows.py -q`.
4. **Web lint**: `pnpm lint`.
5. **Web tests**: `pnpm --filter @apps/web test`.
6. **Web build**: `pnpm --filter @apps/web build`.

## Umbral mínimo inicial
- Backend: ejecutar al menos 1 suite de unit y 1 suite de integración en cada PR.
- Web: ejecutar al menos 1 test automatizado de UI en cada PR.
- CI en estado verde es requisito para merge.

## Plan de subida de umbral
1. Añadir cobertura por módulo crítico de dominio (attempts, ranking, capacities).
2. Exigir crecimiento incremental de cobertura en backend.
3. Añadir smoke tests de rutas críticas en web por rol (coach/athlete/admin).
4. Incorporar reportes de cobertura y umbrales por paquete.

## Regla de contribución
Todo PR que cambie comportamiento funcional debe incluir o actualizar tests.
