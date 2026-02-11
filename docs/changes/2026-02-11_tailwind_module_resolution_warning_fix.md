# 1. CONTEXTO

Se reportó que, aunque la app web respondía, Next/Tailwind seguía mostrando warning de resolución de módulo en `tailwind.config.ts` por `require("@packages/ui-tokens")`.

Objetivo: eliminar el warning de `Module not found` sin romper la fuente única de tokens compartidos.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `apps/web/tailwind.config.ts`

## Funciones añadidas
- Ninguna.

## Funciones eliminadas
- `resolveWebThemeColors` eliminada de `apps/web/tailwind.config.ts`.

## Funciones modificadas
- Configuración de Tailwind para usar import directo relativo de `webThemeColors` desde `../../packages/ui-tokens/src/index`.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- Ninguna en modelos/DTOs.
- Se simplifica la propiedad `theme.extend.colors` para consumir directamente `webThemeColors`.

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

- ✅ `webThemeColors`: **EN USO** desde `apps/web/tailwind.config.ts`.
- 🗑 `resolveWebThemeColors`: **ELIMINADA** por causar warning de resolución en análisis estático.
- ✅ Import relativo a tokens compartidos: **EN USO** como mecanismo estable en entorno actual.

# 5. RIESGO DE REFRACTOR FUTURO

- El import relativo depende de la estructura del monorepo; si se mueve `apps/web` o `packages/ui-tokens`, debe actualizarse.
- Puede migrarse nuevamente a import de paquete workspace cuando la resolución esté garantizada sin warnings en todos los entornos.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia.
- **Respuesta frontend**: no cambia; solo configuración de estilos/build.
- **Base de datos**: no cambia.
- **Seeds**: no cambia.

# 7. CHECK DE COHERENCIA

- Se confirma que no se rompe arquitectura hexagonal.
- Se confirma que no se rompe separación dominio/aplicación/infrastructure.
- Se confirma que no se alteran invariantes de negocio.
- Se mantiene regla de tokens centralizados y sin introducir lógica de dominio en frontend.
