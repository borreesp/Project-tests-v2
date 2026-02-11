# 1. CONTEXTO

Se solicitó reducir el brillo general de la UI porque los fondos blancos resultaban molestos visualmente. El objetivo fue invertir la jerarquía cromática hacia un esquema oscuro, manteniendo la paleta oficial Pulse como base.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `packages/ui-tokens/src/index.ts`
- `apps/web/tailwind.config.ts`
- `apps/web/app/globals.css`

## Funciones añadidas
- Ninguna.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- Ninguna función de dominio/aplicación.
- Se ajustaron objetos de configuración visual/tokens (`colors`, `buttonColors`, `webThemeColors`) para usar esquema oscuro.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- Se actualizaron propiedades de color en tokens compartidos:
  - `background` pasa a negro.
  - `surface` pasa a gunmetal.
  - `textPrimary` pasa a blanco.
  - `textSecondary` pasa a silver.
  - variantes secundarias/ghost y bordes se recalibran para contraste en dark.
- En web se reintroduce el mapeo de Tailwind por variables CSS (`hsl(var(--...))`) para evitar dependencias de resolución de módulos en `tailwind.config.ts`.
- Se definieron variables de tema en `apps/web/app/globals.css` con base oscura.

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

- ✅ `colors` (ui-tokens): **EN USO** en mobile y referencias de UI compartida.
- ✅ `buttonColors` (ui-tokens): **EN USO** en botón mobile.
- ✅ Variables CSS de `globals.css`: **EN USO** para tema web.
- ✅ `theme.extend.colors` con `hsl(var(--...))`: **EN USO** en Tailwind web.
- ❌ Configuración visual clara previa (fondo blanco dominante): **DEPRECADA**.

# 5. RIESGO DE REFRACTOR FUTURO

- Existe desacople temporal entre tema web (variables CSS) y export `webThemeColors` del paquete compartido.
- Si cambia la paleta oficial o se decide soporte dual light/dark, hará falta estrategia de theming conmutables y token pipeline más estricto.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia.
- **Respuesta frontend**: no cambia contratos de datos; solo render visual.
- **Base de datos**: no cambia.
- **Seeds**: no cambia.

# 7. CHECK DE COHERENCIA

- No se rompe arquitectura hexagonal.
- No se rompe separación dominio/aplicación/infrastructure.
- No se alteran invariantes de negocio.
- Cambio acotado a frontend (tema visual y tokens).
