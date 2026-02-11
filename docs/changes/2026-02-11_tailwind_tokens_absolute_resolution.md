# 1. CONTEXTO

Persistía un warning de `Module not found` en `apps/web/tailwind.config.ts` al resolver tokens compartidos, tanto con alias workspace como con import relativo estático.

Objetivo: asegurar resolución estable de `webThemeColors` en el archivo de configuración de Tailwind sin romper la fuente compartida de tokens.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `apps/web/tailwind.config.ts`

## Funciones añadidas
- Ninguna.

## Funciones eliminadas
- Ninguna función exportada.

## Funciones modificadas
- Carga de tokens en `tailwind.config.ts`: se reemplaza import relativo estático por `require()` con ruta absoluta calculada vía `path.resolve(__dirname, ...)` hacia `packages/ui-tokens/src/index.ts`.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- No hay cambios en modelos ni DTOs.
- Se añade constante `tokensModulePath` para resolver la ruta del módulo de tokens.

## Cambios en contratos o DTOs
- Ninguno.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: sin impacto funcional.
- **Capacidades**: sin impacto funcional.
- **Workouts**: sin impacto funcional.
- **Tests**: sin impacto funcional.
- **Ranking**: sin impacto funcional.
- **Persistencia**: sin cambios.

# 4. ESTADO DE USO

- ✅ `webThemeColors`: **EN USO** desde `apps/web/tailwind.config.ts`.
- ✅ `tokensModulePath`: **EN USO** para carga estable de tokens compartidos en configuración web.
- ❌ Import relativo estático `../../packages/ui-tokens/src/index`: **DEPRECADO** por warnings de resolución.

# 5. RIESGO DE REFRACTOR FUTURO

- La ruta absoluta calculada depende del layout actual del monorepo; si cambian carpetas, deberá ajustarse.
- Puede migrarse a import de paquete workspace cuando el toolchain de configuración soporte resolución homogénea sin warnings en todos los entornos.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia.
- **Respuesta frontend**: no cambia contratos de datos, solo estabilidad de configuración visual.
- **Base de datos**: no cambia.
- **Seeds**: no cambia.

# 7. CHECK DE COHERENCIA

- No se rompe arquitectura hexagonal.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
- Se mantiene alcance frontend y tokens compartidos, sin tocar backend ni dominio.
