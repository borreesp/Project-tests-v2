# 1. CONTEXTO

Tras la unificación visual previa, se reportó un bloqueo en web: `tailwind.config.ts` no podía resolver `@packages/ui-tokens` en tiempo de carga de configuración (entorno con resolución de módulos no enlazada al workspace), provocando error 500 en render.

Objetivo: mantener fuente compartida de tokens sin romper carga de Tailwind en entornos donde el alias de workspace no está disponible.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `apps/web/tailwind.config.ts`

## Funciones añadidas
- `resolveWebThemeColors`: resuelve `webThemeColors` con estrategia de fallback.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- Configuración `tailwind` en `apps/web/tailwind.config.ts` para consumir `colors` vía `resolveWebThemeColors()` en lugar de import estático directo.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- Se añade tipo local `WebThemeColors` para tipado de la resolución de colores.

## Cambios en contratos o DTOs
- Ninguno.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: sin impacto funcional.
- **Capacidades**: sin impacto funcional.
- **Workouts**: sin impacto funcional.
- **Tests**: sin impacto funcional.
- **Ranking**: sin impacto funcional.
- **Persistencia**: sin impacto.

# 4. ESTADO DE USO

- ✅ `resolveWebThemeColors`: **EN USO** en `apps/web/tailwind.config.ts` para carga de colores Tailwind.
- ✅ `webThemeColors` (tokens compartidos): **EN USO** por ruta principal (`@packages/ui-tokens`) y fallback (`../../packages/ui-tokens/src/index.ts`).
- ⚠️ Fallback relativo: **EN TRANSICIÓN**, diseñado como compatibilidad de entorno hasta estabilizar resolución de workspace en todos los entornos de ejecución.

# 5. RIESGO DE REFRACTOR FUTURO

- El fallback relativo está acoplado al layout actual del monorepo; si cambian rutas, debe actualizarse.
- Puede eliminarse en el futuro cuando la resolución de `@packages/ui-tokens` esté garantizada en todos los entornos (CI/local/Windows).

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia.
- **Respuesta frontend**: no cambia contratos, solo estabilidad de build/render.
- **Base de datos**: no cambia.
- **Seeds**: no cambia.

# 7. CHECK DE COHERENCIA

- Se confirma que no se rompe arquitectura hexagonal.
- Se confirma que no se rompe separación dominio/aplicación/infrastructure.
- Se confirma que no se alteran invariantes de negocio.
- Se mantiene regla **No hex inline** (sin introducir colores inline fuera del módulo de tokens).
