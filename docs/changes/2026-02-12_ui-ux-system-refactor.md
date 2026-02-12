# 1. CONTEXTO

La UI del frontend tenía consistencia parcial entre vistas clave (dashboard athlete, ranking y overview coach), con estados de carga/error poco expresivos y una base de tokens limitada para sostener una identidad visual profesional y uniforme.

Objetivo de esta intervención: elevar coherencia visual y percepción de producto SaaS deportivo sin tocar contratos API, lógica de dominio, ni persistencia.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `packages/ui-tokens/src/index.ts`
- `apps/web/app/globals.css`
- `apps/web/components/state-view.tsx`
- `apps/web/components/ui/button.tsx`
- `apps/web/components/ui/card.tsx`
- `apps/web/components/ui/input.tsx`
- `apps/web/components/ui/select.tsx`
- `apps/web/components/ui/badge.tsx`
- `apps/web/components/ui/progress.tsx`
- `apps/web/app/athlete/dashboard/page.tsx`
- `apps/web/app/athlete/ranking/page.tsx`
- `apps/web/app/coach/overview/page.tsx`

## Funciones añadidas
- `Skeleton` en `apps/web/components/ui/skeleton.tsx`
- `EmptyState` en `apps/web/components/state-view.tsx`

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- `LoadingState` y `ErrorState` para añadir jerarquía visual, iconografía y skeleton.
- Componentes UI base (`Button`, `Card`, `Input`, `Select`, `Badge`, `Progress`) con variantes visuales unificadas.
- Páginas `AthleteDashboardPage`, `AthleteRankingPage`, `CoachOverviewPage` con mejoras de composición y legibilidad.

## Clases sustituidas
- No se sustituyeron clases de dominio ni clases de infraestructura.

## Propiedades eliminadas o añadidas
- No se alteraron propiedades de modelos de dominio ni de persistencia.

## Cambios en contratos o DTOs
- Ninguno.

## Tokens añadidos
- Escala de spacing 4pt ampliada.
- Tokens semánticos de color (success/warning/error, surface/surfaceElevated).
- Niveles de elevación y tipografía extendida.

## Rutas afectadas
- `/athlete/dashboard`
- `/athlete/ranking`
- `/coach/overview`

## Justificación visual
- Se priorizó legibilidad en métricas críticas y estructura uniforme de cards/forms.
- Se mejoró feedback en loading/error/empty state.
- Se reforzó contraste y jerarquía en una estética sobria de rendimiento deportivo.

# 3. IMPACTO EN EL DOMINIO

- **Atletas:** sin cambio de reglas de negocio; solo mejora visual en consumo de datos.
- **Capacidades:** sin recálculo ni alteración de fórmulas.
- **Workouts:** sin cambios de estructura, publicación o validación.
- **Tests:** sin cambios en flujo funcional backend.
- **Ranking:** sin cambios en cálculo ni criterios; solo presentación.
- **Persistencia:** sin cambios en esquemas, migraciones o escrituras.

# 4. ESTADO DE USO

- ✅ EN USO: `LoadingState` en vistas web con fetch de datos.
- ✅ EN USO: `ErrorState` en vistas web con manejo de errores.
- ✅ EN USO: `EmptyState` en ranking cuando no hay tests publicados.
- ✅ EN USO: `Skeleton` dentro de `LoadingState`.
- ✅ EN USO: nuevos estilos en componentes UI base (`Button`, `Card`, `Input`, `Select`, `Badge`, `Progress`).
- ⚠️ EN TRANSICIÓN: tokens nuevos en `ui-tokens` aún pueden no estar consumidos por el 100% de pantallas.
- ❌ DEPRECADA: no aplica.
- 🗑 ELIMINADA: no aplica.

# 5. RIESGO DE REFRACTOR FUTURO

- Parte de los tokens previos puede consolidarse/eliminarse al completar migración visual de pantallas restantes.
- Existe acoplamiento visual con utilidades Tailwind actuales; conviene futura normalización en primitives compartidas.
- No depende de legacy de negocio, pero sí de la evolución del sistema de diseño frontend.

# 6. CONTRATO EXTERNO AFECTADO

- **API:** No.
- **Respuesta frontend:** Sí, solo a nivel presentacional (layout/estilo), sin cambio de estructura de datos.
- **Base de datos:** No.
- **Seeds:** No.

# 7. CHECK DE COHERENCIA

- Arquitectura hexagonal: ✅ No se rompe.
- Separación dominio/aplicación/infrastructure: ✅ No se rompe.
- Invariantes de negocio: ✅ No se alteran.
