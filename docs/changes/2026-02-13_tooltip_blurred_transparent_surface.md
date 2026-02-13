# 1. CONTEXTO

En la UI web, el tooltip de ayuda presentaba baja legibilidad en fondos oscuros porque se veía demasiado transparente sin separación visual suficiente del contenido detrás. El objetivo del ajuste fue mantener la transparencia (look & feel actual) pero añadiendo difuminado del fondo para mejorar lectura.

# 2. CAMBIOS REALIZADOS

## Archivos modificados
- `apps/web/components/help-tooltip.tsx`
- `docs/changes/2026-02-13_tooltip_blurred_transparent_surface.md` (nuevo)

## Funciones añadidas
- Ninguna.

## Funciones eliminadas
- Ninguna.

## Funciones modificadas
- `HelpTooltip(...)`: actualización de clases visuales del panel tooltip para incorporar `backdrop-blur-sm`, transparencia calibrada (`bg-popover/65`) y borde/ombra más definidos.

## Clases sustituidas
- Ninguna.

## Propiedades eliminadas o añadidas
- No se añaden ni eliminan propiedades de modelos.
- Se ajustan propiedades visuales CSS utilitarias del contenedor tooltip.

## Cambios en contratos o DTOs
- Ninguno.

# 3. IMPACTO EN EL DOMINIO

- **Atletas**: sin impacto de lógica; mejora de legibilidad en UI.
- **Capacidades**: sin impacto funcional.
- **Workouts**: sin impacto funcional.
- **Tests**: sin impacto funcional.
- **Ranking**: sin impacto funcional.
- **Persistencia**: sin cambios.

# 4. ESTADO DE USO

- ✅ **EN USO** `HelpTooltip(...)`: aplicado en pantallas Coach/Athlete ya integradas.
- ⚠️ **EN TRANSICIÓN** estandarización visual global de overlays (tooltip/popover) para unificar tokens de transparencia y blur en todos los componentes.
- ❌ **DEPRECADA**: ninguna.
- 🗑 **ELIMINADA**: ninguna.

# 5. RIESGO DE REFRACTOR FUTURO

- Bajo riesgo técnico.
- Puede requerir ajuste futuro si se redefine el sistema de design tokens de superficies translúcidas.
- Ligero acoplamiento con soporte CSS `backdrop-filter` del navegador.

# 6. CONTRATO EXTERNO AFECTADO

- **API**: no cambia.
- **Respuesta frontend**: sí, cambio visual de presentación del tooltip.
- **Base de datos**: no cambia.
- **Seeds**: no cambia.

# 7. CHECK DE COHERENCIA

- ✅ No se rompe arquitectura hexagonal.
- ✅ No se rompe separación dominio / aplicación / infraestructura.
- ✅ No se alteran invariantes de negocio.
