# 1. CONTEXTO

Se detectó fragmentación visual entre `apps/web` y `apps/mobile`: paleta no alineada a Pulse, estilos con valores de color hardcodeados y ausencia de una fuente única de tokens consumible por ambas apps.

Objetivo de la intervención: unificar la capa visual frontend con la paleta oficial Pulse (`#FFFFFF`, `#F5760B`, `#C0C0C0`, `#404040`, `#000000`), definir tokens reutilizables y remover hex inline de componentes web/mobile.

Regla explícita aplicada: **No hex inline fuera del módulo de tokens**.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `packages/ui-tokens/src/index.ts`
- `apps/web/package.json`
- `apps/web/tailwind.config.ts`
- `apps/web/app/globals.css`
- `apps/web/components/ui/button.tsx`
- `apps/mobile/src/components/ui.tsx`
- `apps/mobile/src/screens/auth/LoginScreen.tsx`
- `apps/mobile/src/screens/athlete/DashboardScreen.tsx`
- `apps/mobile/src/navigation/AppNavigator.tsx`
- `package.json` (normalización de encoding)
- `apps/mobile/package.json` (normalización de encoding)
- `packages/ui-tokens/package.json` (normalización de encoding)

## Funciones añadidas
- Ninguna.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- `AppButton` (`apps/mobile/src/components/ui.tsx`): variantes visuales alineadas a `primary | secondary | ghost | destructive` y colores provenientes de tokens.
- `confidenceColor` (`apps/mobile/src/screens/athlete/DashboardScreen.tsx`): mantiene semántica funcional y reemplaza hex inline por tokens semánticos.

## Clases sustituidas
- Ninguna clase de dominio/aplicación/infrastructure.

## Propiedades eliminadas o añadidas
- Se amplía el contrato interno de tokens visuales en `packages/ui-tokens/src/index.ts` con:
  - `primary`, `background`, `surface`, `border`, `textPrimary`, `textSecondary`, `disabled`, `error`
  - estados de botón (`default`, `hover`, `pressed`, `disabled`) por variante.
  - adaptador `webThemeColors` para Tailwind.
- Se mantienen aliases (`foreground`, `secondary`, `muted`) para compatibilidad de consumo actual.

## Cambios en contratos o DTOs
- No hay cambios en DTOs, schemas, mappers ni contratos API.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: sin cambios funcionales; solo presentación visual (tipografía/color de UI).
- **Capacidades**: sin cambios de cálculo; solo colorización basada en tokens.
- **Workouts**: sin cambios de reglas; botones/inputs/cards usan tokens.
- **Tests**: sin cambios semánticos ni de datos.
- **Ranking**: sin cambios de lógica; únicamente estandarización visual.
- **Persistencia**: sin impacto (no cambios de DB, ORM, seeds ni migraciones).

# 4. ESTADO DE USO

- ✅ `colors` (`packages/ui-tokens/src/index.ts`): **EN USO** en web y mobile.
- ✅ `buttonColors` (`packages/ui-tokens/src/index.ts`): **EN USO** en botón mobile.
- ✅ `webThemeColors` (`packages/ui-tokens/src/index.ts`): **EN USO** en Tailwind web.
- ✅ `buttonVariants` (`apps/web/components/ui/button.tsx`): **EN USO** en pantallas coach/athlete/login.
- ✅ `AppButton` (`apps/mobile/src/components/ui.tsx`): **EN USO** transversal en mobile.
- ⚠️ Variante `outline` en web: **EN TRANSICIÓN**; se mantiene como alias visual de `secondary` para no romper llamadas actuales.
- ❌ Elementos de color inline previos en mobile (`#64748b`, `#16a34a`, `#dc2626`, etc.): **DEPRECADOS y removidos**.
- 🗑 Ninguna función/clase eliminada.

# 5. RIESGO DE REFRACTOR FUTURO

- `outline` en web puede eliminarse a futuro cuando todas las llamadas migren a `secondary`/`ghost`.
- `webThemeColors` está acoplado a Tailwind (capa UI web), pero aislado en tokens compartidos.
- `success`, `warning`, `danger` se conservan para semántica visual existente; potencial migración futura a set semántico más formal si se define design system completo.
- Requiere validación visual continua al agregar nuevas pantallas para mantener regla **No hex inline**.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia.
- **Respuesta frontend**: no cambia estructura de datos; solo estilos.
- **Base de datos**: no cambia.
- **Seeds**: no cambian.

# 7. CHECK DE COHERENCIA

- Se confirma que no se rompe arquitectura hexagonal.
- Se confirma que no se rompe separación dominio/aplicación/infrastructure.
- Se confirma que no se alteran invariantes de negocio.
- Se confirma alcance exclusivo de frontend (web + mobile) y sin cambios de backend.
