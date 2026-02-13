# 1. CONTEXTO

Se detectó fricción de uso en Coach y Athlete por falta de ayuda contextual en formularios y métricas visibles. El objetivo fue introducir un sistema reutilizable de tooltips accesibles, con copy centralizado y aplicado en pantallas críticas (builder de workouts/tests, overview coach, listados y dashboard athlete), evitando strings hardcodeadas distribuidas.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `apps/web/components/help-tooltip.tsx` (nuevo)
- `apps/web/content/help-text.ts` (nuevo)
- `apps/web/app/coach/workouts/_components/workout-builder.tsx`
- `apps/web/app/coach/overview/page.tsx`
- `apps/web/app/coach/athletes/page.tsx`
- `apps/web/app/coach/athletes/[id]/page.tsx`
- `apps/web/app/athlete/dashboard/page.tsx`

## Funciones añadidas
- `HelpTooltip(...)` en `apps/web/components/help-tooltip.tsx`
- `LabelWithHelp(...)` en `apps/web/components/help-tooltip.tsx`

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- `CoachOverviewPage(...)`: títulos con tooltip para métricas clave.
- `CoachAthletesPage(...)`: columnas de nivel y banda con ayuda contextual.
- `CoachAthleteDetailPage(...)`: labels de inputs de acción con ayuda contextual.
- `AthleteDashboardPage(...)`: tooltips en pulse score, confianza, capacidades, tests y tendencias.
- `WorkoutBuilder(...)` (componente principal): labels clave migrados a `LabelWithHelp` y ayudas en campos críticos del builder.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- No se cambian propiedades de modelos de dominio ni DTOs.
- Se añadieron props de UI (`content`, `title`, `side`) en componente visual nuevo `HelpTooltip`.

## Cambios en contratos o DTOs
- Ninguno. No hay cambios de contratos backend/frontend tipados compartidos.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: mejora comprensión de métricas de rendimiento sin alterar cálculo.
- **Capacidades**: se explica significado de cada capacidad, sin cambiar su lógica.
- **Workouts**: mejor guía de carga de datos en builder, sin alterar reglas de negocio.
- **Tests**: mayor claridad al configurar test/workout; no cambia validación funcional existente.
- **Ranking**: sin cambios funcionales.
- **Persistencia**: sin cambios de base de datos, migraciones ni seeds.

# 4. ESTADO DE USO

- ✅ **EN USO** `HelpTooltip`: usado en Coach Overview, Coach Athletes y Athlete Dashboard.
- ✅ **EN USO** `LabelWithHelp`: usado en inputs críticos de builder y acciones de atleta para coach.
- ✅ **EN USO** `HELP` (diccionario): fuente central de copy para tooltips en pantallas tocadas.
- ⚠️ **EN TRANSICIÓN** cobertura de tooltips al 100% en todo el frontend; se aplicó en pantallas prioritarias del issue.
- ❌ **DEPRECADA**: ninguna.
- 🗑 **ELIMINADA**: ninguna.

# 5. RIESGO DE REFRACTOR FUTURO

- El componente `HelpTooltip` puede evolucionar para migrar a primitive dedicada (por ejemplo shadcn/radix tooltip-popover) si se requieren animaciones/portals avanzados.
- El diccionario `help-text.ts` está acoplado a copy de producto; requerirá mantenimiento coordinado con UX/content.
- No depende de legacy backend.
- Puede requerir futura migración si se internacionaliza i18n completa por locale.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia.
- **Respuesta frontend**: sí, cambia presentación visual y accesibilidad de ayuda contextual.
- **Base de datos**: no cambia.
- **Seeds**: no cambia.

# 7. CHECK DE COHERENCIA

- ✅ No se rompe arquitectura hexagonal.
- ✅ No se rompe separación dominio / aplicación / infraestructura.
- ✅ No se alteran invariantes de negocio.
